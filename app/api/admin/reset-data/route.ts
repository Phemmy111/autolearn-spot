import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    await requireSuperAdmin()

    const body = await request.json()
    const { action } = body

    if (action === 'delete_history') {
      // Delete all quiz responses
      const { error: err1 } = await supabaseAdmin
        .from('quiz_responses')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (err1) throw err1

      return NextResponse.json({ success: true, message: 'Leaderboard and history cleared successfully.' })
    } 
    
    if (action === 'delete_quizzes') {
      // Delete all questions first (if no cascade)
      const { error: err2 } = await supabaseAdmin
        .from('questions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
        
      if (err2) throw err2

      // Delete all quizzes
      const { error: err3 } = await supabaseAdmin
        .from('quizzes')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (err3) throw err3

      return NextResponse.json({ success: true, message: 'All quizzes and questions deleted successfully.' })
    }

    if (action === 'delete_all') {
      // Delete history
      await supabaseAdmin.from('quiz_responses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      // Delete questions
      await supabaseAdmin.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      // Delete quizzes
      await supabaseAdmin.from('quizzes').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      return NextResponse.json({ success: true, message: 'All quizzes, questions, and history deleted successfully.' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Error in reset-data API:', error)
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
