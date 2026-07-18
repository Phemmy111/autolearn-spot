import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { AIProviderManager } from '@/lib/ai-provider'
import { AIPromptManager } from '@/lib/ai-prompt'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const { script, weekNumber, phase, questionCount, providerId, model, promptId } = await request.json()

    if (!script) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 })
    }

    // Get the quiz generation prompt (use specific promptId if provided, otherwise get active)
    let activePrompt
    if (promptId) {
      const { data: prompt } = await supabase
        .from('ai_prompts')
        .select('*')
        .eq('id', promptId)
        .single()
      activePrompt = prompt
    } else {
      activePrompt = await AIPromptManager.getActivePrompt('quiz_generation')
    }
    
    if (!activePrompt) {
      return NextResponse.json({ error: 'No quiz generation prompt found. Please configure a prompt in the admin dashboard.' }, { status: 500 })
    }

    // Use AI Provider Manager to generate quiz
    const countText = questionCount ? `Generate exactly ${questionCount} questions.` : 'Generate 10 questions.'
    const prompt = `${activePrompt.content}\n\nGenerate a quiz for Week ${weekNumber || '1'} (${phase || 'WEEK_1'}) based on this lesson script:\n\n${script}\n\n${countText}`
    
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
      // Remove markdown code blocks if present
      const cleanedContent = result.content.replace(/```json\n?|\n?```/g, '').trim()
      console.log('AI response content:', cleanedContent.substring(0, 1000))
      quizData = JSON.parse(cleanedContent)
      console.log('Parsed quiz data:', JSON.stringify(quizData).substring(0, 500))
    } catch (parseError) {
      console.error('Failed to parse AI response:', result.content)
      console.error('Parse error:', parseError)
      return NextResponse.json({ error: 'Failed to parse generated quiz. AI response: ' + result.content.substring(0, 500) }, { status: 500 })
    }

    // Validate the structure
    console.log('Validation check - title:', !!quizData.title, 'questions:', !!quizData.questions, 'isArray:', Array.isArray(quizData.questions))
    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      console.error('Invalid quiz structure:', quizData)
      return NextResponse.json({ error: 'Invalid quiz structure generated. Expected { title: string, questions: array }. Got: ' + JSON.stringify(quizData).substring(0, 500) }, { status: 500 })
    }

    // Generate default title if missing
    if (!quizData.title) {
      quizData.title = `Week ${weekNumber || '1'} Quiz - ${phase || 'WEEK_1'}`
      console.log('Generated default title:', quizData.title)
    }

    // Transform AI response to match expected format
    const transformedQuestions = quizData.questions.map((q: any) => ({
      question_text: q.question || q.question_text,
      question_type: q.question_type || 'multiple_choice',
      options: q.options || [],
      correct_answer: q.correct_answer || q.correctAnswer,
      explanation: q.explanation || '',
      points: q.points || 10,
    }))

    quizData.questions = transformedQuestions

    // Add week and phase to the quiz data
    quizData.week_number = weekNumber || 1
    quizData.phase = phase || 'WEEK_1'
    quizData.description = quizData.description || `Quiz for Week ${weekNumber || '1'} - ${phase || 'WEEK_1'}`

    return NextResponse.json({ quiz: quizData })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    console.error('Quiz generation error:', error)
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}
