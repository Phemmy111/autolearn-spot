"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import { Link } from 'next/link';
import { Clock, CheckCircle, Play, Lock, ClipboardCheck } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  description: string;
  lesson_id: string | null;
  passing_score: number;
  created_at: string;
  lesson?: {
    title: string;
    uuid_id: string;
  };
  user_attempts?: number;
  best_score?: number;
  best_score_passed?: boolean;
}

export default function StudentQuizzesPage() {
  const { userId } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, [userId]);

  const fetchQuizzes = async () => {
    try {
      if (!userId) {
        setLoading(false);
        return;
      }

      console.log('[StudentQuizzesPage] Fetching quizzes for user:', userId);

      // Fetch only quizzes that the user has attempted
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quiz_responses')
        .select(`
          quiz_id,
          score,
          passed,
          quiz:quizzes(
            id,
            title,
            description,
            lesson_id,
            passing_score,
            created_at,
            lesson:lessons(id, title, uuid_id)
          )
        `)
        .eq('user_id', userId);

      if (quizzesError) {
        console.error('[StudentQuizzesPage] Error fetching quizzes:', quizzesError);
        throw quizzesError;
      }

      console.log('[StudentQuizzesPage] Quiz responses:', quizzesData);

      // Group by quiz_id and get best attempt for each quiz
      const quizMap = new Map<string, Quiz>();
      
      (quizzesData || []).forEach((response: any) => {
        const quiz = response.quiz;
        if (!quiz) return;

        const existing = quizMap.get(quiz.id);
        const currentScore = response.score;
        const existingBestScore = existing?.best_score || 0;

        if (!existing || currentScore > existingBestScore) {
          quizMap.set(quiz.id, {
            ...quiz,
            user_attempts: (existing?.user_attempts || 0) + 1,
            best_score: currentScore,
            best_score_passed: response.passed,
          });
        } else {
          quizMap.set(quiz.id, {
            ...existing,
            user_attempts: existing.user_attempts + 1,
          });
        }
      });

      const quizzes = Array.from(quizMap.values());
      console.log('[StudentQuizzesPage] Processed quizzes:', quizzes);
      setQuizzes(quizzes);
    } catch (err: any) {
      console.error('[StudentQuizzesPage] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-600">Loading quizzes...</div>
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-neutral-900 mb-2">
          My Quizzes
        </h1>
        <p className="text-neutral-600">
          View and take quizzes for your enrolled courses
        </p>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200">
          <div className="text-neutral-400 mb-4">
            <ClipboardCheck className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            No quizzes available
          </h3>
          <p className="text-neutral-600">
            Check back later for new quizzes
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-2xl border border-neutral-200 p-6 hover:border-neutral-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {quiz.best_score_passed && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Passed
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    {quiz.title}
                  </h3>
                  
                  <p className="text-sm text-neutral-600 mb-3">
                    {quiz.description || 'No description'}
                  </p>

                  {quiz.lesson && (
                    <p className="text-xs text-neutral-500 mb-3">
                      Lesson: {quiz.lesson.title}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-neutral-500">
                    <span>Attempts: {quiz.user_attempts || 0}</span>
                    {quiz.best_score !== null && (
                      <span>Best score: {quiz.best_score}%</span>
                    )}
                    <span>Passing: {quiz.passing_score}%</span>
                  </div>
                </div>

                <Link
                  href={`/dashboard/quiz/${quiz.id}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors whitespace-nowrap"
                >
                  {quiz.user_attempts > 0 ? (
                    <>
                      <Play className="w-4 h-4" />
                      Retake
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start
                    </>
                  )}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}