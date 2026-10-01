"use client";
import { useState, useEffect } from 'react';
import { Award, Download, Calendar, CheckCircle, Clock, Lock } from 'lucide-react';

interface Certificate {
  id: string;
  cohort_id: string;
  course_title: string;
  course_slug: string;
  progress: number;
  is_unlocked: boolean;
  issued_at: string | null;
  has_certificate_record: boolean;
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
        
        if (data.certificates) {
          setCertificates(data.certificates);
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

  const downloadCertificate = async (cert: Certificate, format: 'pdf' | 'png') => {
    try {
      const res = await fetch(`/api/certificate/download?format=${format}&cohortId=${cert.cohort_id}`);
      if (!res.ok) throw new Error(`Failed to download certificate as ${format.toUpperCase()}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate_${cert.course_slug}.${format}`;
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
          <h3 className="text-lg font-bold text-brand-text mb-2">No enrollments found</h3>
          <p className="text-brand-text/60 mb-6 max-w-md mx-auto">
            Enroll in a course to start earning certificates.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className={`flex flex-col overflow-hidden rounded-[20px] bg-[var(--card)] border border-brand-border/60 transition-all duration-300 relative ${
                cert.is_unlocked 
                  ? "hover:border-[#10b981]/40 hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)]" 
                  : "opacity-80"
              }`}
            >
              {!cert.is_unlocked && (
                <div className="absolute inset-0 bg-brand-bg/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
                  <div className="p-4 bg-brand-bg rounded-full shadow-lg mb-4">
                    <Lock className="w-8 h-8 text-brand-text/60" />
                  </div>
                  <h4 className="font-bold text-brand-text mb-2">Certificate Locked</h4>
                  <p className="text-sm text-brand-text/80 mb-4">Complete course to unlock</p>
                  <div className="w-full max-w-[200px] h-2 bg-brand-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-primary transition-all duration-500"
                      style={{ width: \`\${cert.progress}%\` }}
                    />
                  </div>
                  <span className="text-xs text-brand-text/60 mt-2 font-medium">{cert.progress}% Complete</span>
                </div>
              )}

              <div className="flex-1 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={\`p-3 rounded-xl \${cert.is_unlocked ? 'bg-[#10b981]/10' : 'bg-brand-border/40'}\`}>
                    <Award className={\`w-8 h-8 \${cert.is_unlocked ? 'text-[#10b981]' : 'text-brand-text/40'}\`} />
                  </div>
                  {cert.is_unlocked ? (
                    <div className="flex items-center gap-1 text-xs font-medium text-[#10b981] bg-[#10b981]/10 px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Unlocked
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs font-medium text-brand-text/60 bg-brand-border/40 px-2 py-1 rounded-full">
                      <Clock className="w-3 h-3" />
                      In Progress
                    </div>
                  )}
                </div>

                <h3 className="font-heading font-bold text-lg leading-tight mb-2 text-brand-text">
                  {cert.course_title}
                </h3>

                <div className="space-y-2 text-sm text-brand-text/60">
                  {cert.is_unlocked ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Earned: {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : new Date().toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-full h-1.5 bg-brand-border rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-brand-primary"
                          style={{ width: \`\${cert.progress}%\` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 pt-0 mt-auto flex flex-col gap-2 relative z-20">
                <button
                  disabled={!cert.is_unlocked}
                  onClick={() => downloadCertificate(cert, 'pdf')}
                  className={\`w-full inline-flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition-all \${
                    cert.is_unlocked 
                      ? 'bg-[#10b981] text-white hover:bg-[#0ea5e9]' 
                      : 'bg-brand-border text-brand-text/40 cursor-not-allowed pointer-events-none'
                  }\`}
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  disabled={!cert.is_unlocked}
                  onClick={() => downloadCertificate(cert, 'png')}
                  className={\`w-full inline-flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition-all \${
                    cert.is_unlocked 
                      ? 'bg-transparent border border-[#10b981] text-[#10b981] hover:bg-[#10b981]/10' 
                      : 'bg-transparent border border-brand-border text-brand-text/40 cursor-not-allowed pointer-events-none'
                  }\`}
                >
                  <Download className="w-4 h-4" />
                  Download PNG
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
