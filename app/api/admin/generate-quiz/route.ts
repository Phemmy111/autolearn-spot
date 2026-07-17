import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { AIProviderManager } from '@/lib/ai-provider'
import { AIPromptManager } from '@/lib/ai-prompt'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const { script, weekNumber, phase, providerId, model, promptId } = await request.json()

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
    const prompt = `${activePrompt.content}\n\nGenerate a quiz for Week ${weekNumber || '1'} (${phase || 'WEEK_1'}) based on this lesson script:\n\n${script}`
    
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
      quizData = JSON.parse(cleanedContent)
    } catch (parseError) {
      console.error('Failed to parse AI response:', result.content)
      return NextResponse.json({ error: 'Failed to parse generated quiz' }, { status: 500 })
    }

    // Validate the structure
    if (!quizData.title || !quizData.questions || !Array.isArray(quizData.questions)) {
      return NextResponse.json({ error: 'Invalid quiz structure generated' }, { status: 500 })
    }

    // Add week and phase to the quiz data
    quizData.week_number = weekNumber || 1
    quizData.phase = phase || 'WEEK_1'

    return NextResponse.json({ quiz: quizData })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    console.error('Quiz generation error:', error)
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}
