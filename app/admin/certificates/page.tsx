import React from 'react';
import { Award, Download } from 'lucide-react';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminCertificatesPage() {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/');
  }

  const { data: certificates, error } = await supabaseAdmin
    .from('certificates')
    .select('id, certificate_code, user_id, user_name, user_email, issued_at, cohort_id, cohorts(name, learning_products(title))')
    .order('issued_at', { ascending: false });

  const safeCertificates = certificates || [];

  return (
    <div className="min-h-screen p-8 text-brand-text bg-brand-bg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold capitalize">Certificates</h1>
      </div>
      <div className="bg-[var(--card)] brightness-95 rounded-2xl p-6 shadow-sm border border-gray-100 overflow-x-auto">
        {safeCertificates.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="p-4 font-medium">Student Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Certificate Code</th>
                <th className="p-4 font-medium">Issued At</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {safeCertificates.map((cert) => (
                <tr key={cert.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Award className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="font-medium text-gray-900">{cert.user_name || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="p-4 text-brand-text/70">
                    {cert.user_email || 'N/A'}
                  </td>
                  <td className="p-4 font-medium text-blue-600">
                    {cert.certificate_code}
                  </td>
                  <td className="p-4 text-brand-text/60">
                    {new Date(cert.issued_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    {(() => {
                      const lpTitle = cert.cohorts?.learning_products?.title;
                      const cName = cert.cohorts?.name;
                      const courseTitle = lpTitle || (cName === 'Cohort 1' ? 'n8n Automation Training' : cName) || 'AI Automation Training';
                      
                      return (
                        <a 
                          href={`/api/certificate/download?userId=${cert.user_id}&name=${encodeURIComponent(cert.user_name || 'Student')}&course=${encodeURIComponent(courseTitle)}&certificateId=${cert.id}`} 
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-brand-text/60">No certificates found.</p>
        )}
      </div>
    </div>
  );
}
