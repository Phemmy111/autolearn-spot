import Link from 'next/link';
import { Sparkles, Trophy, CheckCircle, GraduationCap, ChevronRight, Clock, ShieldCheck, Zap } from 'lucide-react';
import { scholarshipConfig } from '@/config/scholarship';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scholarship Programme | AutoLearn Spot',
  description: 'Apply for the AutoLearn Spot AI Automation Scholarship Programme. Learn n8n and AI automation for a fraction of the cost.',
};

export default function ScholarshipLandingPage() {
  const { fullValue, commitmentFee } = scholarshipConfig;
  
  const formattedFullValue = `₦${fullValue.toLocaleString()}`;
  const formattedCommitmentFee = `₦${commitmentFee.toLocaleString()}`;

  return (
    <main className="min-h-screen bg-[#111317] text-[#e2e2e8] pb-24">
      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[#3b494b] bg-[#111317]/95 px-4 backdrop-blur sm:px-6">
        <Link className="flex items-center gap-2 font-mono text-sm font-bold uppercase text-white" href="/">
          <span className="text-[#00f0ff]">//</span>
          <span className="underline decoration-[#b9cacb] decoration-2 underline-offset-2">AutoLearn Spot</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/scholarship/status"
            className="font-mono text-xs uppercase text-[#b9cacb] hover:text-[#00f0ff] transition-colors"
          >
            Check Status
          </Link>
          <Link
            href="/scholarship/apply"
            className="border border-[#00f0ff] bg-[#00f0ff]/10 px-4 py-2 font-mono text-xs font-bold uppercase text-[#00f0ff] transition-all hover:bg-[#00f0ff] hover:text-black hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]"
          >
            Apply Now
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-16 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00f0ff]/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
        
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00f0ff]/30 bg-[#00f0ff]/10 text-[#00f0ff] font-mono text-xs mb-6">
            <Sparkles className="w-3 h-3" />
            <span>2026 Scholarship Applications Open</span>
          </div>
          
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Master AI Automation.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#00363a] inline-block mt-2">
              Scholarship Supported.
            </span>
          </h1>
          
          <p className="text-lg text-[#b9cacb] mb-10 max-w-2xl mx-auto">
            The full value of this hands-on n8n and AI automation training is <strong className="text-white">{formattedFullValue}</strong>. 
            Selected scholars only pay a <strong className="text-[#00f0ff]">{formattedCommitmentFee} Commitment Fee</strong>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/scholarship/apply"
              className="w-full sm:w-auto flex items-center justify-center gap-2 border border-[#00f0ff] bg-[#00f0ff] px-8 py-4 font-mono text-sm font-bold uppercase text-black transition-all hover:bg-transparent hover:text-[#00f0ff] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              Apply For Scholarship
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="#details"
              className="w-full sm:w-auto flex items-center justify-center gap-2 border border-[#3b494b] bg-transparent px-8 py-4 font-mono text-sm font-bold uppercase text-[#e2e2e8] transition-all hover:bg-[#1a1c20]"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Details Section */}
      <section id="details" className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#1f2229]">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-[#0c0e12] border border-[#1f2229] p-8 relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Trophy className="w-24 h-24 text-[#00f0ff]" />
            </div>
            <div className="relative z-10">
              <h3 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-[#00f0ff]">//</span> The Value
              </h3>
              <p className="text-[#b9cacb] mb-4">
                This is our premier 4-week training program, normally priced at {formattedFullValue}. It covers everything from n8n basics to deploying production AI agents.
              </p>
            </div>
          </div>

          <div className="bg-[#0c0e12] border border-[#1f2229] p-8 relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="w-24 h-24 text-[#00f0ff]" />
            </div>
            <div className="relative z-10">
              <h3 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-[#00f0ff]">//</span> The Commitment
              </h3>
              <p className="text-[#b9cacb] mb-4">
                The training is scholarship-supported. If selected, you pay only a {formattedCommitmentFee} commitment fee to cover onboarding, administration, and your MSN certificate.
              </p>
            </div>
          </div>

          <div className="bg-[#0c0e12] border border-[#1f2229] p-8 relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-24 h-24 text-[#00f0ff]" />
            </div>
            <div className="relative z-10">
              <h3 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-[#00f0ff]">//</span> The Process
              </h3>
              <ul className="space-y-3 text-[#b9cacb] font-mono text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#00f0ff] mt-0.5" />
                  <span>Submit application</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#00f0ff] mt-0.5" />
                  <span>Review within 3 days</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#00f0ff] mt-0.5" />
                  <span>Receive decision & next steps</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <h2 className="font-heading text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          <div className="border border-[#1f2229] bg-[#0c0e12] p-6">
            <h4 className="font-bold text-lg mb-2">Is the {formattedCommitmentFee} a tuition fee?</h4>
            <p className="text-[#b9cacb]">No. The training itself is scholarship-supported (valued at {formattedFullValue}). The commitment fee covers onboarding logistics, platform administration, and your final certification.</p>
          </div>
          
          <div className="border border-[#1f2229] bg-[#0c0e12] p-6">
            <h4 className="font-bold text-lg mb-2">When will I hear back?</h4>
            <p className="text-[#b9cacb]">Our team reviews applications on a rolling basis. You can expect an update via email and on our status checking portal within 3 days of submission.</p>
          </div>
          
          <div className="border border-[#1f2229] bg-[#0c0e12] p-6">
            <h4 className="font-bold text-lg mb-2">What happens if I'm accepted?</h4>
            <p className="text-[#b9cacb]">You will receive an acceptance email with instructions on how to pay the commitment fee and complete your enrollment to secure your spot.</p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/scholarship/apply"
            className="inline-flex items-center justify-center gap-2 border border-[#00f0ff] bg-[#00f0ff]/10 px-8 py-4 font-mono text-sm font-bold uppercase text-[#00f0ff] transition-all hover:bg-[#00f0ff] hover:text-black hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
          >
            Start Your Application Now
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[#b9cacb] mb-3">Join our WhatsApp community for updates:</p>
          <a
            href={scholarshipConfig.generalWhatsAppGroup}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white px-6 py-3 font-mono text-sm font-bold uppercase transition-all hover:bg-[#128C7E] hover:shadow-[0_0_15px_rgba(37,211,102,0.4)]"
          >
            Join WhatsApp Group
          </a>
        </div>
      </section>
    </main>
  );
}
