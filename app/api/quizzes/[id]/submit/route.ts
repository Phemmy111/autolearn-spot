import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
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
    const { data: existingResponse } = await supabase
      .from('quiz_responses')
      .select('id')
      .eq('quiz_id', id)
      .eq('user_id', userId)
      .single()

    if (existingResponse) {
      return NextResponse.json({ error: 'Quiz already submitted' }, { status: 409 })
    }

    // Get quiz details (verify quiz exists and is active)
    const { data: quiz, error: quizError } = await supabase
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
    const { data: questions, error: questionsError } = await supabase
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

    questions.forEach((question: any) => {
      totalPoints += question.points
      const userAnswer = answers[question.id]
      if (userAnswer === question.correct_answer) {
        correctAnswers += question.points
      }
    })

    const score = correctAnswers
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0

    const passed = percentage >= quiz.passing_score

    // Validate time limit on server side (security check)
    if (time_taken && quiz.time_limit && time_taken > quiz.time_limit * 60) {
      console.error(`Time limit exceeded for quiz ${id} by user ${userId}: ${time_taken}s vs limit ${quiz.time_limit * 60}s`)
      return NextResponse.json({ error: 'Time limit exceeded' }, { status: 403 })
    }

    // Insert quiz response
    const { data: response, error: responseError } = await supabase
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
