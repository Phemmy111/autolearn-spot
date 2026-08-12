import { requireAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Metadata } from 'next';
import { ScholarshipSettingsClient } from './client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Scholarship Settings | AutoLearn Spot',
};

export default async function AdminScholarshipSettingsPage() {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-[#b9cacb] hover:text-white font-mono text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Link>
          <h1 className="font-heading text-4xl font-bold text-white mb-4 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-[#00f0ff]" /> Scholarship Settings
          </h1>
          <p className="font-mono text-sm text-[#b9cacb] max-w-2xl">
            Configure scholarship programme settings including commitment fee, payment link, and WhatsApp groups.
          </p>
        </div>

        <ScholarshipSettingsClient />
      </div>
    </div>
  );
}
