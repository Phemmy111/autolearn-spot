import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AlexChat } from '@/components/alex/AlexChat';
import { Bot, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Alex AI Tutor | AutoLearn Spot',
  description: 'Your autonomous AI assistant for learning, code debugging, and n8n automations.',
};

export default async function StudentAlexPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-neutral-900 flex items-center gap-2">
              Alex AI Tutor & Autonomous Agent
              <span className="text-xs bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-600" /> Smart Obey-Grade
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500">
              Ask questions about course lessons, build n8n workflows, practice quiz tests, or analyze code.
            </p>
          </div>
        </div>
      </div>

      <div className="h-[calc(100vh-12rem)] min-h-[500px] rounded-xl overflow-hidden border border-neutral-200 shadow-sm bg-white">
        <AlexChat userId={userId} />
      </div>
    </div>
  );
}
