import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth, currentUser } from '@clerk/nextjs/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get user details from Clerk
    const user = await currentUser()
    const userName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user?.username || 'Unknown'
    const userEmail = user?.emailAddresses[0]?.emailAddress || ''

    const body = await request.json()
    const { answers, time_taken, started_at } = body

    // Validate required fields
    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Invalid answers format' }, { status: 400 })
    }

    // Check if user has already submitted this quiz (prevent duplicate submissions)
    const { data: existingResponse } = await supabaseAdmin
      .from('quiz_responses')
      .select('id')
      .eq('quiz_id', id)
      .eq('user_id', userId)
      .single()

    if (existingResponse) {
      return NextResponse.json({ error: 'Quiz already submitted' }, { status: 409 })
    }

    // Get quiz details (verify quiz exists and is active)
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .select('passing_score, is_active')
      .eq('id', id)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    if (!quiz.is_active) {
      return NextResponse.json({ error: 'Quiz is not active' }, { status: 403 })
    }

    // Get quiz questions to calculate score
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('quiz_id', id)
      .order('order_index', { ascending: true })

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'No questions found for this quiz' }, { status: 400 })
    }

    // Calculate score
    let correctAnswers = 0
    let totalPoints = 0

    console.log('Submitted answers:', JSON.stringify(answers))

    questions.forEach((question: any) => {
      totalPoints += question.points
      const userAnswer = (answers[question.id] || '').trim()
      const correctAnswer = (question.correct_answer || '').trim()
      
      let isCorrect = userAnswer === correctAnswer

      // Smart matching for AI generated multiple choice questions
      if (!isCorrect && question.question_type === 'multiple_choice') {
        // 1. If AI set correct_answer to "A", "B", "C", or "D", but options are "A. ...", "B. ..."
        const correctLetterMatch = correctAnswer.match(/^[A-D](?:\.|\))?$/i)
        if (correctLetterMatch) {
           const letter = correctAnswer.charAt(0).toUpperCase()
           // Check if user answer starts with this letter
           if (userAnswer.toUpperCase().startsWith(`${letter}.`) || userAnswer.toUpperCase().startsWith(`${letter})`) || userAnswer.toUpperCase().startsWith(`${letter} `)) {
             isCorrect = true
           }
           
           // Or check by index if options don't have letters
           let optionsArray = question.options
           if (typeof optionsArray === 'string') {
             try { optionsArray = JSON.parse(optionsArray) } catch(e) {}
           }
           if (!isCorrect && Array.isArray(optionsArray)) {
             const index = letter.charCodeAt(0) - 65 // A=0, B=1, etc.
             if (optionsArray[index] && optionsArray[index] === userAnswer) {
               isCorrect = true
             }
           }
        }
        
        // 2. Inverse case: correct_answer is "A. Option" but userAnswer is just "A"
        const userLetterMatch = userAnswer.match(/^[A-D](?:\.|\))?$/i)
        if (!isCorrect && userLetterMatch) {
           const letter = userAnswer.charAt(0).toUpperCase()
           if (correctAnswer.toUpperCase().startsWith(`${letter}.`) || correctAnswer.toUpperCase().startsWith(`${letter})`) || correctAnswer.toUpperCase().startsWith(`${letter} `)) {
             isCorrect = true
           }
        }

        // 3. Number index case: AI set correct_answer to "0", "1", "2", "3"
        if (!isCorrect && /^[0-9]+$/.test(correctAnswer)) {
           const index = parseInt(correctAnswer, 10)
           let optionsArray = question.options
           if (typeof optionsArray === 'string') {
             try { optionsArray = JSON.parse(optionsArray) } catch(e) {}
           }
           if (Array.isArray(optionsArray) && optionsArray[index] === userAnswer) {
             isCorrect = true
           }
        }

        // 4. Substring match fallback for AI mismatches (e.g. "Paris" vs "A. Paris" or "Paris, France")
        if (!isCorrect && userAnswer.length > 2 && correctAnswer.length > 2) {
          const userLower = userAnswer.toLowerCase()
          const correctLower = correctAnswer.toLowerCase()
          
          // Remove prefixes like "A. ", "B) ", etc before comparing
          const cleanUser = userLower.replace(/^[a-d][.)]\s*/, '').trim()
          const cleanCorrect = correctLower.replace(/^[a-d][.)]\s*/, '').trim()

          if (cleanUser === cleanCorrect || cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser)) {
            isCorrect = true
          }
        }
      }

      console.log(`Q ${question.id}: user="${userAnswer}" correct="${correctAnswer}" match=${isCorrect}`)
      if (isCorrect) {
        correctAnswers += question.points
      }
    })

    const score = correctAnswers
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0

    console.log(`Score: ${score}/${totalPoints} = ${percentage}%`)

    const passed = percentage >= quiz.passing_score

    // Validate time limit on server side (security check)
    if (time_taken && quiz.time_limit && time_taken > quiz.time_limit * 60) {
      console.error(`Time limit exceeded for quiz ${id} by user ${userId}: ${time_taken}s vs limit ${quiz.time_limit * 60}s`)
      return NextResponse.json({ error: 'Time limit exceeded' }, { status: 403 })
    }

    // Insert quiz response
    const { data: response, error: responseError } = await supabaseAdmin
      .from('quiz_responses')
      .insert({
        quiz_id: id,
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        answers,
        score,
        total_points: totalPoints,
        percentage,
        passed,
        time_taken,
        started_at,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (responseError) {
      console.error('Error inserting quiz response:', responseError)
      return NextResponse.json({ error: 'Failed to save quiz response' }, { status: 500 })
    }

    return NextResponse.json({
      response,
      score,
      total_points: totalPoints,
      percentage,
      passed,
      correct_answers: correctAnswers,
    })
  } catch (error: any) {
    console.error('Quiz submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
