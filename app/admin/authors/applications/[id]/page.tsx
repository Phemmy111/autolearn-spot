import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { ArrowLeft, CheckCircle, XCircle, Clock, ExternalLink, Mail } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getApplicationDetails(id: string) {
  const { data, error } = await supabaseAdmin
    .from('author_applications')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching application details:', error);
    return null;
  }

  return data;
}

export default async function ApplicationReviewPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const application = await getApplicationDetails(params.id);

  if (!application) {
    return (
      <div className="p-8">
        <Link
          href="/admin/authors/applications"
          className="inline-flex items-center gap-2 text-[#b9cacb] hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </Link>
        <p className="text-[#b9cacb]">Application not found</p>
      </div>
    );
  }

  const updateApplicationStatus = async (status: string) => {
    'use server';
    const { error } = await supabaseAdmin
      .from('author_applications')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (error) {
      console.error('Error updating application status:', error);
      return { error: 'Failed to update status' };
    }

    // TODO: Send email notification to applicant
    // TODO: If approved, create author profile and send login details

    return { success: true };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800';
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'DECLINED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/admin/authors/applications"
          className="inline-flex items-center gap-2 text-[#b9cacb] hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </Link>
        <h1 className="font-heading text-3xl font-bold text-white mb-2">
          Application Review
        </h1>
        <p className="font-mono text-sm text-[#b9cacb]">
          Review and manage author application
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Application Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold text-white">
                Application Details
              </h2>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}
              >
                {application.status.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="font-mono text-xs text-[#b9cacb] mb-1">Full Name</p>
                <p className="text-[#e2e8e2]">{application.full_name}</p>
              </div>

              <div>
                <p className="font-mono text-xs text-[#b9cacb] mb-1">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#b9cacb]" />
                  <a
                    href={`mailto:${application.email}`}
                    className="text-[#e2e8e2] hover:text-[#00f0ff] transition-colors"
                  >
                    {application.email}
                  </a>
                </div>
              </div>

              <div>
                <p className="font-mono text-xs text-[#b9cacb] mb-1">Expertise Area</p>
                <p className="text-[#e2e8e2]">{application.expertise_area}</p>
              </div>

              {application.portfolio_link && (
                <div>
                  <p className="font-mono text-xs text-[#b9cacb] mb-1">Portfolio</p>
                  <a
                    href={application.portfolio_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#00f0ff] hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Portfolio
                  </a>
                </div>
              )}

              <div>
                <p className="font-mono text-xs text-[#b9cacb] mb-1">Bio</p>
                <p className="text-[#e2e8e2] whitespace-pre-wrap">{application.bio}</p>
              </div>

              <div>
                <p className="font-mono text-xs text-[#b9cacb] mb-1">Why Become an Author</p>
                <p className="text-[#e2e8e2] whitespace-pre-wrap">
                  {application.why_become_author}
                </p>
              </div>

              <div className="pt-4 border-t border-[#1f2229]">
                <p className="font-mono text-xs text-[#b9cacb] mb-1">Submitted</p>
                <p className="text-[#e2e8e2]">
                  {new Date(application.submitted_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-6">
          <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
            <h2 className="font-heading text-xl font-bold text-white mb-4">
              Actions
            </h2>

            <div className="space-y-3">
              <form action={async () => {
                'use server';
                await updateApplicationStatus('UNDER_REVIEW');
              }}>
                <button
                  type="submit"
                  disabled={application.status === 'UNDER_REVIEW' || application.status === 'APPROVED' || application.status === 'DECLINED'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1a1d24] border border-[#00f0ff] text-[#00f0ff] font-mono text-xs font-bold uppercase rounded hover:bg-[#00f0ff] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Clock className="w-4 h-4" />
                  Mark as Under Review
                </button>
              </form>

              <form action={async () => {
                'use server';
                await updateApplicationStatus('APPROVED');
              }}>
                <button
                  type="submit"
                  disabled={application.status === 'APPROVED' || application.status === 'DECLINED'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-mono text-xs font-bold uppercase rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Application
                </button>
              </form>

              <form action={async () => {
                'use server';
                await updateApplicationStatus('DECLINED');
              }}>
                <button
                  type="submit"
                  disabled={application.status === 'APPROVED' || application.status === 'DECLINED'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-mono text-xs font-bold uppercase rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-4 h-4" />
                  Decline Application
                </button>
              </form>
            </div>
          </div>

          <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
            <h2 className="font-heading text-lg font-bold text-white mb-4">
              Application Timeline
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#00f0ff] rounded-full mt-2" />
                <div>
                  <p className="text-sm text-[#e2e8e2]">Submitted</p>
                  <p className="font-mono text-xs text-[#b9cacb]">
                    {new Date(application.submitted_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {application.updated_at && application.updated_at !== application.submitted_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#b9cacb] rounded-full mt-2" />
                  <div>
                    <p className="text-sm text-[#e2e8e2]">Last Updated</p>
                    <p className="font-mono text-xs text-[#b9cacb]">
                      {new Date(application.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}