"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Calendar, Star, ArrowRight, Loader2, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export function EnrollmentRequired() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerifyInput, setShowVerifyInput] = useState(false);
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return;

    setIsVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: reference.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Success! Reload to clear layout state and enter dashboard
        window.location.reload();
      } else {
        setError(data.error || 'Payment verification failed. Please check your reference.');
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 sm:p-6 bg-[#111317]">
      <div className="w-full max-w-2xl overflow-hidden border border-[#3b494b] bg-[#1a1d24] shadow-2xl">
        <div className="border-b border-[#3b494b] bg-[#1f2229] p-6 sm:p-8 text-center">
          <h1 className="font-heading text-3xl font-bold uppercase text-white mb-2">
            Welcome to AutoLearn Spot
          </h1>
          <p className="font-mono text-sm text-[#b9cacb]">
            You're logged in successfully, but an active enrollment is required to access the curriculum.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid gap-8 md:grid-cols-2">
            
            {/* Course Details */}
            <div className="space-y-6">
              <div>
                <h3 className="font-mono text-xs uppercase tracking-widest text-[#00f0ff] mb-1">Current Cohort</h3>
                <h2 className="text-xl font-bold text-[#e2e8e2]">AI Automation Bootcamp</h2>
                <div className="mt-2 flex items-center gap-2 font-mono text-sm text-[#b9cacb]">
                  <Calendar className="h-4 w-4 text-[#5d5f63]" />
                  <span>Cohort 1</span>
                </div>
              </div>

              <div>
                <h3 className="font-mono text-xs uppercase tracking-widest text-[#00f0ff] mb-2">What you get</h3>
                <ul className="space-y-3 font-mono text-sm text-[#b9cacb]">
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-[#00f0ff] mt-0.5 shrink-0" />
                    <span>Full access to all modules and live sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-[#00f0ff] mt-0.5 shrink-0" />
                    <span>Real-world n8n workflow templates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-[#00f0ff] mt-0.5 shrink-0" />
                    <span>Official Verified Certificate upon completion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-[#00f0ff] mt-0.5 shrink-0" />
                    <span>Private community & instructor feedback</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Area */}
            <div className="flex flex-col rounded bg-[#111317] p-6 border border-[#3b494b]">
              <div className="mb-6">
                <span className="font-mono text-sm text-[#5d5f63]">One-time Enrollment</span>
                <div className="mt-1 flex items-baseline gap-1 text-[#e2e8e2]">
                  <span className="text-3xl font-bold">₦3,000</span>
                  <span className="font-mono text-xs text-[#b9cacb]">NGN</span>
                </div>
              </div>

              <Link 
                href="https://paystack.shop/pay/yoksvlq4xn"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-full items-center justify-center gap-2 border border-[#00f0ff] bg-[#00f0ff]/10 px-4 py-3 font-mono text-sm font-bold uppercase text-[#00f0ff] transition-all hover:bg-[#00f0ff] hover:text-black mb-4"
              >
                Enroll Now <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#3b494b]"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#111317] px-2 font-mono text-xs text-[#5d5f63]">Already paid?</span>
                </div>
              </div>

              {!showVerifyInput ? (
                <button
                  onClick={() => setShowVerifyInput(true)}
                  className="flex w-full items-center justify-center gap-2 border border-[#3b494b] bg-transparent px-4 py-3 font-mono text-xs uppercase text-[#b9cacb] transition-colors hover:border-white hover:text-white"
                >
                  <ShieldCheck className="h-4 w-4" /> Verify Payment
                </button>
              ) : (
                <form onSubmit={handleVerify} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Paystack Reference (e.g. T489123...)"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full border border-[#3b494b] bg-[#0a0c10] px-3 py-2 font-mono text-sm text-white placeholder-[#5d5f63] focus:border-[#00f0ff] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="flex w-full items-center justify-center gap-2 bg-[#e2e8e2] px-4 py-2 font-mono text-xs uppercase text-black hover:bg-white disabled:opacity-50 transition-colors"
                  >
                    {isVerifying ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
                    ) : (
                      'Submit Reference'
                    )}
                  </button>
                </form>
              )}

              {error && (
                <div className="mt-4 border-l-2 border-red-500 bg-red-500/10 p-3 font-mono text-xs text-red-200">
                  {error}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-[#3b494b] text-center">
                <a 
                  href="https://wa.me/2347069176378" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-mono text-xs text-[#b9cacb] hover:text-[#25D366] transition-colors"
                >
                  <MessageCircle className="h-4 w-4" /> Need help? WhatsApp Support
                </a>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
