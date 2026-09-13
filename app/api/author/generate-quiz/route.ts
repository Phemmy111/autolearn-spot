import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { AIProviderManager } from '@/lib/ai-provider'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { script, lessonId, questionCount, providerId, model, promptId } = await request.json()

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
      .single()

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Verify product ownership
    const { data: product } = await supabaseAdmin
      .from('learning_products')
      .select('author_id')
      .eq('id', lesson.product_id)
      .single()

    if (!product || product.author_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get the quiz generation prompt (use specific promptId if provided, otherwise get active for this author)
    let activePrompt
    if (promptId) {
      const { data: prompt } = await supabaseAdmin
        .from('ai_prompts')
        .select('*')
        .eq('id', promptId)
        .eq('author_id', userId)
        .single()
      activePrompt = prompt
    } else {
      const { data: prompt } = await supabaseAdmin
        .from('ai_prompts')
        .select('*')
        .eq('author_id', userId)
        .eq('prompt_type', 'quiz_generation')
        .eq('is_active', true)
        .single()
      activePrompt = prompt
    }
    
    if (!activePrompt) {
      return NextResponse.json({ error: 'No quiz generation prompt found. Please configure a prompt in your AI settings.' }, { status: 500 })
    }

    // Use AI Provider Manager to generate quiz
    const countText = questionCount ? `Generate exactly ${questionCount} questions.` : 'Generate 10 questions.'
    const prompt = `${activePrompt.content}\n\nGenerate a quiz for lesson "${lesson.title}" based on this lesson script:\n\n${script}\n\n${countText}`
    
    const result = await AIProviderManager.completion(prompt, {
      providerId,
      model,
      temperature: 0.7,
      maxTokens: 4000,
    })

    if (!result.success || !result.content) {
      return NextResponse.json({ error: result.error || 'Failed to generate quiz' }, { status: 500 })
    }

    // Parse the JSON response
    let quizData
    try {
      // Remove markdown code blocks if present (more robust pattern)
      let cleanedContent = result.content
        .replace(/```json\s*\n?/g, '')
        .replace(/```\s*\n?/g, '')
        .trim()
      
      // Try to extract JSON if mixed with other text
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanedContent = jsonMatch[0]
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

    return NextResponse.json({ quiz: quizData })
  } catch (error: any) {
    console.error('[POST /api/author/generate-quiz] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate quiz' }, { status: 500 })
  }
}
