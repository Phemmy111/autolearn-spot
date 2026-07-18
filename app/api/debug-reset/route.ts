import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Delete all quiz responses
    const { error: err1 } = await supabaseAdmin
      .from('quiz_responses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      
    if (err1) {
      console.error('Failed to delete responses:', err1)
      return NextResponse.json({ error: 'Failed to delete responses', details: err1 })
    }

    // Delete all questions (just in case they don't cascade, though quizzes might)
    const { error: err2 } = await supabaseAdmin
      .from('questions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    // Delete all quizzes
    const { error: err3 } = await supabaseAdmin
      .from('quizzes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (err3) {
      console.error('Failed to delete quizzes:', err3)
      return NextResponse.json({ error: 'Failed to delete quizzes', details: err3 })
    }

    return NextResponse.json({ success: true, message: 'Database reset successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
