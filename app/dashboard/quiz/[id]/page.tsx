"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import { Link, useParams } from 'next/navigation';
import { Clock, CheckCircle, Play, ArrowLeft } from 'lucide-react';

interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer: string;
  points: number;
  order_index: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  lesson_id: string | null;
  lesson_uuid_id: string | null;
  time_limit_minutes: number | null;
  passing_score: number;
  created_at: string;
  lesson?: {
    title: string;
    uuid_id: string;
  };
}

export default function QuizDetailPage() {
  const { userId } = useAuth();
  const params = useParams();
  const quizId = params.id as string;
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizDetails();
  }, [quizId, userId]);

  const fetchQuizDetails = async () => {
    try {
      if (!userId) {
        throw new Error('Not authenticated');
      }

      // Fetch quiz details
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select(`
          *,
          lesson:lessons(id, title, uuid_id)
        `)
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;

      // Fetch quiz questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;

      setQuiz(quizData);
      setQuestions(questionsData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Loading quiz...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Quiz not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link 
          href="/dashboard/quizzes"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quizzes
        </Link>
        
        <h1 className="text-3xl font-heading font-bold text-neutral-900 mb-2">
          {quiz.title}
        </h1>
        
        <p className="text-neutral-600 mb-4">
          {quiz.description || 'No description'}
        </p>

        <div className="flex items-center gap-4 text-sm text-neutral-500">
          {quiz.time_limit_minutes && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {quiz.time_limit_minutes} minutes
            </span>
          )}
          <span>{questions.length} questions</span>
          <span>Passing score: {quiz.passing_score}%</span>
        </div>

        {quiz.lesson && (
          <p className="text-sm text-neutral-500 mt-2">
            Lesson: {quiz.lesson.title}
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Questions
        </h2>

        {questions.length === 0 ? (
          <p className="text-neutral-600">No questions available for this quiz.</p>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div 
                key={question.id}
                className="p-4 bg-neutral-50 rounded-lg border border-neutral-200"
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-200 text-neutral-700 text-sm font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900 mb-2">
                      {question.question_text}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Type: {question.question_type} • Points: {question.points}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Link
          href={`/dashboard/quiz/${quiz.id}/take`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors"
        >
          <Play className="w-5 h-5" />
          Start Quiz
        </Link>
      </div>
    </div>
  );
}