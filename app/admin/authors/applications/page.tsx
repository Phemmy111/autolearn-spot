import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { ArrowLeft, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getAuthorApplications() {
  const { data, error } = await supabaseAdmin
    .from('author_applications')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching author applications:', error);
    return [];
  }

  return data || [];
}

export default async function AuthorApplicationsPage() {
  await requireAdmin();
  const applications = await getAuthorApplications();

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Clock className="w-4 h-4" />;
      case 'UNDER_REVIEW':
        return <Eye className="w-4 h-4" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4" />;
      case 'DECLINED':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-[#b9cacb] hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="font-heading text-3xl font-bold text-white mb-2">
          Author Applications
        </h1>
        <p className="font-mono text-sm text-[#b9cacb]">
          Manage and review author applications
        </p>
      </div>

      <div className="border border-[#1f2229] bg-[#0c0e12] rounded-xl overflow-hidden">
        {applications.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[#b9cacb]">No author applications yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1f2229]">
                  <th className="text-left p-4 font-mono text-xs font-bold uppercase tracking-wider text-[#b9cacb]">
                    Submitted
                  </th>
                  <th className="text-left p-4 font-mono text-xs font-bold uppercase tracking-wider text-[#b9cacb]">
                    Name
                  </th>
                  <th className="text-left p-4 font-mono text-xs font-bold uppercase tracking-wider text-[#b9cacb]">
                    Email
                  </th>
                  <th className="text-left p-4 font-mono text-xs font-bold uppercase tracking-wider text-[#b9cacb]">
                    Expertise
                  </th>
                  <th className="text-left p-4 font-mono text-xs font-bold uppercase tracking-wider text-[#b9cacb]">
                    Status
                  </th>
                  <th className="text-left p-4 font-mono text-xs font-bold uppercase tracking-wider text-[#b9cacb]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id} className="border-b border-[#1f2229] hover:bg-[#1a1d24] transition-colors">
                    <td className="p-4 text-sm text-[#e2e8e2]">
                      {new Date(application.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-sm text-[#e2e8e2] font-medium">
                      {application.full_name}
                    </td>
                    <td className="p-4 text-sm text-[#b9cacb]">
                      {application.email}
                    </td>
                    <td className="p-4 text-sm text-[#e2e8e2]">
                      {application.expertise_area}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}
                      >
                        {getStatusIcon(application.status)}
                        {application.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/authors/applications/${application.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-[#00f0ff] text-black font-mono text-xs font-bold uppercase rounded hover:bg-white transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Review
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-4 gap-4">
        <div className="border border-[#1f2229] bg-[#0c0e12] p-4 rounded-lg">
          <p className="font-mono text-xs text-[#b9cacb] mb-1">Total Applications</p>
          <p className="font-heading text-2xl font-bold text-white">{applications.length}</p>
        </div>
        <div className="border border-[#1f2229] bg-[#0c0e12] p-4 rounded-lg">
          <p className="font-mono text-xs text-[#b9cacb] mb-1">Pending</p>
          <p className="font-heading text-2xl font-bold text-white">
            {applications.filter(a => a.status === 'SUBMITTED').length}
          </p>
        </div>
        <div className="border border-[#1f2229] bg-[#0c0e12] p-4 rounded-lg">
          <p className="font-mono text-xs text-[#b9cacb] mb-1">Under Review</p>
          <p className="font-heading text-2xl font-bold text-white">
            {applications.filter(a => a.status === 'UNDER_REVIEW').length}
          </p>
        </div>
        <div className="border border-[#1f2229] bg-[#0c0e12] p-4 rounded-lg">
          <p className="font-mono text-xs text-[#b9cacb] mb-1">Approved</p>
          <p className="font-heading text-2xl font-bold text-white">
            {applications.filter(a => a.status === 'APPROVED').length}
          </p>
        </div>
      </div>
    </div>
  );
}