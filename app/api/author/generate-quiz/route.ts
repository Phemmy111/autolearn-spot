import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { AIEngine } from '@/lib/alex/ai-engine'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for AI generation

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { script, lessonId, questionCount } = await request.json()

    if (!script) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 })
    }

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 })
    }

    // Verify lesson ownership
    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('product_id, title')
      .eq('uuid_id', lessonId)
      .maybeSingle()

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Get internal author_id from clerk userId
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    if (!author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 403 })
    }

    // Verify product ownership
    const { data: product } = await supabaseAdmin
      .from('learning_products')
      .select('author_id')
      .eq('id', lesson.product_id)
      .maybeSingle()

    if (!product || product.author_id !== author.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get the global quiz generation prompt
    const { data: activePrompt } = await supabaseAdmin
      .from('ai_prompts')
      .select('*')
      .is('author_id', null)
      .eq('prompt_type', 'quiz_generation')
      .eq('is_active', true)
      .maybeSingle()
    
    if (!activePrompt) {
      return NextResponse.json({ error: 'No quiz generation prompt found. Please configure a prompt in your AI settings.' }, { status: 500 })
    }

    // Use AI Provider Manager to generate quiz
    const countText = questionCount ? `Generate exactly ${questionCount} questions.` : 'Generate 10 questions.'
    const prompt = `${activePrompt.content}\n\nGenerate a quiz for lesson "${lesson.title}" based on this lesson script:\n\n${script}\n\n${countText}`
    
    const providerManager = AIEngine.getProviderManager()
    let fullContent = ''
    
    for await (const chunk of providerManager.executeStreamingWithFallback({
      messages: [{ role: 'user', content: prompt }],
      // Let provider manager auto-select the appropriate model for each provider
      temperature: 0.7,
      maxTokens: 4000,
      stream: true,
      disableTools: true
    })) {
      if (chunk.type === 'delta') {
        fullContent += chunk.data?.content || chunk.data?.text || ''
      } else if (chunk.type === 'error') {
        throw new Error(chunk.data?.error || 'Streaming error')
      }
    }

    const result = {
      success: true,
      content: fullContent,
      error: null
    }

    if (!result.success || !result.content) {
      return NextResponse.json({ error: result.error || 'Failed to generate quiz' }, { status: 500 })
    }

    // Parse the JSON response
    let quizData
    try {
      // Remove markdown code blocks if present
      let cleanedContent = result.content
        .replace(/```json\s*\n?/g, '')
        .replace(/```\s*\n?/g, '')
        .trim()
      
      // Remove control characters that can break JSON parsing
      cleanedContent = cleanedContent.replace(/[\x00-\x1F\x7F]/g, '')
      
      // Extract the first complete JSON object (handle duplicate/malformed responses)
      const firstBrace = cleanedContent.indexOf('{')
      if (firstBrace !== -1) {
        let braceCount = 0
        let endIndex = -1
        for (let i = firstBrace; i < cleanedContent.length; i++) {
          if (cleanedContent[i] === '{') braceCount++
          if (cleanedContent[i] === '}') braceCount--
          if (braceCount === 0) {
            endIndex = i + 1
            break
          }
        }
        if (endIndex !== -1) {
          cleanedContent = cleanedContent.substring(firstBrace, endIndex)
        }
      }
      
      quizData = JSON.parse(cleanedContent)
    } catch (parseError) {
      console.error('Failed to parse AI response:', result.content)
      console.error('Parse error:', parseError)
      return NextResponse.json({ error: 'Failed to parse generated quiz. AI response: ' + result.content.substring(0, 500) }, { status: 500 })
    }

    // Validate the structure
    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      console.error('Invalid quiz structure:', quizData)
      return NextResponse.json({ error: 'Invalid quiz structure generated. Expected { title: string, questions: array }.' }, { status: 500 })
    }

    // Generate default title if missing
    if (!quizData.title) {
      quizData.title = `${lesson.title} Quiz`
    }

    // Transform AI response to match expected format
    const transformedQuestions = quizData.questions.map((q: { question?: string; question_text?: string; question_type?: string; options?: string[]; correct_answer: string; explanation?: string; points?: number }) => ({
      question_text: q.question || q.question_text,
      question_type: q.question_type || 'multiple_choice',
      options: q.options || [],
      correct_answer: q.correct_answer || q.correctAnswer,
      explanation: q.explanation || '',
      points: q.points || 10,
    }))

    quizData.questions = transformedQuestions
    quizData.lesson_id = lessonId
    quizData.description = quizData.description || `Quiz for lesson: ${lesson.title}`

    // Save the quiz to the database
    console.log('[POST /api/author/generate-quiz] Saving quiz to database with lesson_id:', lessonId)
    const { data: savedQuiz, error: saveError } = await supabaseAdmin
      .from('quizzes')
      .insert({
        title: quizData.title,
        description: quizData.description,
        lesson_id: lessonId,
        time_limit: null,
        passing_score: 70,
        is_active: true
      })
      .select()
      .single()

    if (saveError) {
      console.error('[POST /api/author/generate-quiz] Failed to save quiz:', saveError)
      return NextResponse.json({ error: 'Failed to save quiz to database' }, { status: 500 })
    }

    console.log('[POST /api/author/generate-quiz] Quiz saved successfully with ID:', savedQuiz.id)

    // Save the questions
    const questionsToInsert = quizData.questions.map((q: any, index: number) => ({
      quiz_id: savedQuiz.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      points: q.points,
      order_index: index // Add order_index for question ordering
    }))

    const { error: questionsError } = await supabaseAdmin
      .from('questions')
      .insert(questionsToInsert)

    if (questionsError) {
      console.error('[POST /api/author/generate-quiz] Failed to save questions:', questionsError)
      // Clean up the quiz if questions failed to save
      await supabaseAdmin.from('quizzes').delete().eq('id', savedQuiz.id)
      return NextResponse.json({ error: 'Failed to save quiz questions' }, { status: 500 })
    }

    return NextResponse.json({ quiz: { ...quizData, id: savedQuiz.id } })
  } catch (error: any) {
    console.error('[POST /api/author/generate-quiz] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate quiz' }, { status: 500 })
  }
}
