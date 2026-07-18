import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const quizId = 'f8ca1ede-a7a9-4d81-8a1b-d1df049ee7d5';
  const { data: questions } = await supabaseAdmin.from('questions').select('*').eq('quiz_id', quizId);
  const { data: responses } = await supabaseAdmin.from('quiz_responses').select('*').eq('quiz_id', quizId);
  
  return NextResponse.json({
    questions: questions?.map(q => ({ id: q.id, type: q.question_type, options: q.options, correct: q.correct_answer })),
    responses: responses?.map(r => ({ answers: r.answers, score: r.score, passed: r.passed, percentage: r.percentage }))
  });
}
