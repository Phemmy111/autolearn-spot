import { requireAdmin, isSuperAdmin } from '@/lib/admin';
import { getScholarshipApplications } from './actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, FileText, Search, Clock, CheckCircle, Calendar, AlertCircle } from 'lucide-react';
import { ScholarshipClientTable } from './client-table';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Scholarship Admin | AutoLearn Spot',
};

export default async function AdminScholarshipPage() {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/');
  }

  const applications = await getScholarshipApplications();
  const isSuper = await isSuperAdmin();

  // Calculate summaries
  const total = applications.length;
  const submitted = applications.filter(a => a.status === 'Submitted').length;
  const underReview = applications.filter(a => a.status === 'Under Review').length;
  const shortlisted = applications.filter(a => a.status === 'Shortlisted').length;
  const accepted = applications.filter(a => a.status === 'Accepted').length;
  const waitlisted = applications.filter(a => a.status === 'Waitlisted').length;
  const notSelected = applications.filter(a => a.status === 'Not Selected').length;

  return (
    <div className="min-h-screen bg-[bg-[var(--background)]]">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 flex justify-between items-end">
          <div>
            <Link
              href="/admin"
              className="flex items-center gap-2 text-[text-[var(--text-muted)]] hover:text-[var(--text-primary)] font-mono text-sm mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin Dashboard
            </Link>
            <h1 className="font-heading text-4xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-[text-[var(--primary)]]" /> Scholarship Applications
            </h1>
            <p className="font-mono text-sm text-[text-[var(--text-muted)]] max-w-2xl">
              Review and manage applicants for the AutoLearn Spot AI Automation Scholarship Programme.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="border border-[border-[var(--border-default)]] bg-[bg-[var(--card)]] p-4 text-center">
            <p className="text-xs text-[text-[var(--text-muted)]] uppercase tracking-wider mb-2 font-mono">Total</p>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{total}</p>
          </div>
          <div className="border border-[border-[var(--border-default)]] bg-[bg-[var(--card)]] p-4 text-center">
            <FileText className="w-5 h-5 text-[text-[var(--text-muted)]] mx-auto mb-2" />
            <p className="text-xs text-[text-[var(--text-muted)]] uppercase tracking-wider mb-2 font-mono">Submitted</p>
            <p className="text-xl font-bold text-[text-[var(--text-muted)]]">{submitted}</p>
          </div>
          <div className="border border-[border-[var(--border-default)]] bg-[bg-[var(--card)]] p-4 text-center">
            <Search className="w-5 h-5 text-[text-[var(--primary)]] mx-auto mb-2" />
            <p className="text-xs text-[text-[var(--text-muted)]] uppercase tracking-wider mb-2 font-mono">Under Review</p>
            <p className="text-xl font-bold text-[text-[var(--primary)]]">{underReview}</p>
          </div>
          <div className="border border-[border-[var(--border-default)]] bg-[bg-[var(--card)]] p-4 text-center">
            <Clock className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
            <p className="text-xs text-[text-[var(--text-muted)]] uppercase tracking-wider mb-2 font-mono">Shortlisted</p>
            <p className="text-xl font-bold text-yellow-400">{shortlisted}</p>
          </div>
          <div className="border border-[border-[var(--border-default)]] bg-[bg-[var(--card)]] p-4 text-center">
            <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-2" />
            <p className="text-xs text-[text-[var(--text-muted)]] uppercase tracking-wider mb-2 font-mono">Accepted</p>
            <p className="text-xl font-bold text-green-400">{accepted}</p>
          </div>
          <div className="border border-[border-[var(--border-default)]] bg-[bg-[var(--card)]] p-4 text-center">
            <Calendar className="w-5 h-5 text-orange-400 mx-auto mb-2" />
            <p className="text-xs text-[text-[var(--text-muted)]] uppercase tracking-wider mb-2 font-mono">Waitlisted</p>
            <p className="text-xl font-bold text-orange-400">{waitlisted}</p>
          </div>
          <div className="border border-[border-[var(--border-default)]] bg-[bg-[var(--card)]] p-4 text-center">
            <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
            <p className="text-xs text-[text-[var(--text-muted)]] uppercase tracking-wider mb-2 font-mono">Not Selected</p>
            <p className="text-xl font-bold text-red-400">{notSelected}</p>
          </div>
        </div>

        {/* Data Table */}
        <ScholarshipClientTable initialData={applications} isSuperAdmin={isSuper} />
      </div>
    </div>
  );
}
