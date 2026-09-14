"use client";
import { useState, useEffect } from 'react';
import { Award, Download, Calendar, CheckCircle, Clock } from 'lucide-react';

interface Certificate {
  id: string;
  user_id: string;
  course_slug: string;
  completed_at: string;
  certificate_url?: string;
}

export default function AchievementsPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCertificates() {
      try {
        const res = await fetch('/api/certificate/status');
        if (!res.ok) throw new Error('Failed to fetch certificates');
        const data = await res.json();
        
        if (data.eligible && data.certificate) {
          setCertificates([data.certificate]);
        } else {
          setCertificates([]);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCertificates();
  }, []);

  const downloadCertificate = async () => {
    try {
      const res = await fetch('/api/certificate/download?format=pdf');
      if (!res.ok) throw new Error('Failed to download certificate');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'certificate.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-brand-text">Loading your certificates...</div>;
  }

  if (error) {
    return <div className="p-8 text-destructive">Error: {error}</div>;
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-brand-text mb-2 tracking-tight">
            Certificates
          </h1>
          <p className="text-lg text-brand-text/60">
            Your earned certificates and achievements.
          </p>
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-brand-border rounded-2xl">
          <Award className="w-12 h-12 text-brand-text/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-brand-text mb-2">No certificates yet</h3>
          <p className="text-brand-text/60 mb-6 max-w-md mx-auto">
            Complete a course to earn your certificate.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="flex flex-col overflow-hidden rounded-[20px] bg-[var(--card)] border border-brand-border/60 hover:border-[#10b981]/40 hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] transition-all duration-300"
            >
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-[#10b981]/10 rounded-xl">
                    <Award className="w-8 h-8 text-[#10b981]" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-[#10b981] bg-[#10b981]/10 px-2 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Completed
                  </div>
                </div>

                <h3 className="font-heading font-bold text-lg leading-tight mb-2 text-brand-text">
                  {cert.course_slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h3>

                <div className="space-y-2 text-sm text-brand-text/60">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Earned: {new Date(cert.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 mt-auto">
                <button
                  onClick={downloadCertificate}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#10b981] text-white font-bold py-2.5 rounded-xl hover:bg-[#0ea5e9] transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download Certificate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
