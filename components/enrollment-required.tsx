"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, MessageCircle, LogOut, PlaySquare, Calendar, PenTool, CheckSquare, Award, LayoutDashboard, Zap, Mail, BookOpen, Clock } from 'lucide-react';
import Link from 'next/link';
import { useUser, useClerk } from '@clerk/nextjs';

export function EnrollmentRequired() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerifyInput, setShowVerifyInput] = useState(false);
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return;

    setIsVerifying(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: reference.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg('verified');
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        setError(data.error || 'Payment verification failed. Please check your reference.');
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const features = [
    { title: "AI Automation Lessons", icon: <PlaySquare className="h-5 w-5 text-[#00f0ff]" /> },
    { title: "Live Saturday Classes", icon: <Calendar className="h-5 w-5 text-[#00f0ff]" /> },
    { title: "Assignments", icon: <PenTool className="h-5 w-5 text-[#00f0ff]" /> },
    { title: "Practical Projects", icon: <Zap className="h-5 w-5 text-[#00f0ff]" /> },
    { title: "Quizzes", icon: <CheckSquare className="h-5 w-5 text-[#00f0ff]" /> },
    { title: "Certificate", icon: <Award className="h-5 w-5 text-[#00f0ff]" /> },
    { title: "Student Dashboard", icon: <LayoutDashboard className="h-5 w-5 text-[#00f0ff]" /> },
  ];

  const faqs = [
    {
      question: 'Do I need coding experience?',
      answer: 'No. AutoLearn Spot is 100% beginner-friendly. n8n is visual — no coding required. Many learners had zero technical background before joining.',
    },
    {
      question: 'What if I miss a session?',
      answer: 'All 12 sessions are recorded and available for lifetime access. You can catch up anytime, though live sessions offer real-time Q&A.',
    },
    {
      question: 'Is the certificate recognized?',
      answer: 'Yes. The certificate is issued by Moon Space Network, a trusted organization. You can display it on LinkedIn and professional profiles.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We use Paystack for secure payments — Visa, Mastercard, bank transfer, or USSD. All transactions are encrypted.',
    },
    {
      question: 'Can I get a refund?',
      answer: "We offer a full refund within the first 3 days if you're not satisfied. No questions asked.",
    },
    {
      question: 'How long do I have access?',
      answer: 'Lifetime. Once enrolled, you have access to all 12 recordings and any future updates to the curriculum.',
    },
  ];

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <div className="flex min-h-screen flex-col items-center p-4 sm:p-6 lg:p-10 bg-[#111317]">
      {/* Hero Section */}
      <div className="w-full max-w-5xl text-center mb-10 mt-6">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold uppercase text-white mb-4">
          Welcome to AutoLearn Spot 👋
        </h1>
        <p className="font-mono text-lg text-[#00f0ff] mb-2">
          Your account has been created successfully.
        </p>
        <p className="font-mono text-[#b9cacb] max-w-2xl mx-auto">
          To access the current training curriculum, you need an active enrollment.
        </p>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Enrollment Options */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Option 1 - Join Next Cohort */}
          <div className="group relative overflow-hidden rounded-xl border border-[#3b494b] bg-[#1a1d24]/80 backdrop-blur-sm p-6 sm:p-8 transition-all hover:border-[#00f0ff]/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.1)]">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap className="h-24 w-24" />
            </div>
            <div className="relative z-10">
              <h2 className="font-heading text-2xl font-bold uppercase text-white mb-2">Activate Your Enrollment</h2>
              <p className="font-mono text-sm text-[#b9cacb] mb-6">Unlock full access to our comprehensive curriculum.</p>
              
              <div className="mb-8">
                <h3 className="font-mono text-xs uppercase tracking-widest text-[#00f0ff] mb-4">Unlock:</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-sm text-[#e2e8e2]">
                  <li className="flex items-center gap-2"><span className="text-[#00f0ff]">✅</span> Complete Video Curriculum</li>
                  <li className="flex items-center gap-2"><span className="text-[#00f0ff]">✅</span> Saturday Live Classes</li>
                  <li className="flex items-center gap-2"><span className="text-[#00f0ff]">✅</span> Weekly Assignments</li>
                  <li className="flex items-center gap-2"><span className="text-[#00f0ff]">✅</span> Practical Quizzes</li>
                  <li className="flex items-center gap-2"><span className="text-[#00f0ff]">✅</span> Certificate of Completion</li>
                  <li className="flex items-center gap-2"><span className="text-[#00f0ff]">✅</span> Student Community</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#3b494b]/50 pt-6">
                <div>
                  <span className="block font-mono text-xs text-[#5d5f63] uppercase tracking-wider mb-1">One-time payment</span>
                  <span className="text-3xl font-bold text-white">₦3,000 <span className="text-sm font-normal text-[#b9cacb]">NGN</span></span>
                </div>
                <Link 
                  href="https://paystack.shop/pay/yoksvlq4xn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto text-center border border-[#00f0ff] bg-[#00f0ff]/10 px-8 py-4 font-mono text-sm font-bold uppercase text-[#00f0ff] transition-all hover:bg-[#00f0ff] hover:text-black hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] rounded"
                >
                  Pay ₦3,000
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Option 2 - Already Paid */}
            <div className="rounded-xl border border-[#3b494b] bg-[#1a1d24]/60 backdrop-blur-sm p-6 transition-colors hover:bg-[#1a1d24]">
              <h3 className="font-mono text-lg font-bold text-white mb-2">Already completed your payment?</h3>
              <p className="font-mono text-xs text-[#b9cacb] mb-6">Enter your Paystack payment reference below and we'll verify your payment instantly.</p>
              
              {!showVerifyInput ? (
                <button
                  onClick={() => setShowVerifyInput(true)}
                  className="flex w-full items-center justify-center gap-2 border border-[#3b494b] bg-[#111317] px-4 py-3 font-mono text-xs uppercase text-[#b9cacb] transition-colors hover:border-[#00f0ff] hover:text-[#00f0ff] rounded"
                >
                  <ShieldCheck className="h-4 w-4" /> Verify Payment
                </button>
              ) : (
                <form onSubmit={handleVerify} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Paystack Ref (e.g. T4891...)"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full border border-[#3b494b] bg-[#0a0c10] px-3 py-2 font-mono text-sm text-white placeholder-[#5d5f63] focus:border-[#00f0ff] focus:outline-none rounded"
                  />
                  <p className="font-mono text-[10px] text-[#5d5f63] mt-1">
                    Your reference usually starts with something like T123ABC... and can be found in your Paystack receipt.
                  </p>
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="flex w-full items-center justify-center gap-2 bg-[#e2e8e2] px-4 py-2 font-mono text-xs uppercase text-black hover:bg-white disabled:opacity-50 transition-colors rounded"
                  >
                    {isVerifying ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
                    ) : (
                      'Submit Reference'
                    )}
                  </button>
                  {error && (
                    <div className="border-l-2 border-red-500 bg-red-500/10 p-2 font-mono text-xs text-red-200">
                      {error}
                    </div>
                  )}
                  {successMsg && (
                    <div className="flex flex-col items-center justify-center p-4 border border-[#25D366]/30 bg-[#25D366]/10 rounded transition-opacity duration-500 opacity-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">✅</span>
                        <span className="font-mono text-sm font-bold text-[#25D366]">Payment Verified!</span>
                      </div>
                      <span className="font-mono text-xs text-[#25D366]/80 text-center animate-pulse">Unlocking your dashboard...</span>
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Option 3 - Manually Enrolled */}
            <div className="rounded-xl border border-[#3b494b] bg-[#1a1d24]/60 backdrop-blur-sm p-6 transition-colors hover:bg-[#1a1d24] flex flex-col">
              <h3 className="font-mono text-lg font-bold text-white mb-2">Manually Enrolled?</h3>
              <p className="font-mono text-xs text-[#b9cacb] mb-6 flex-grow">
                Were you enrolled by an administrator? If you've already been added manually but still cannot access your dashboard, contact support.
              </p>
              
              <a 
                href="https://wa.me/2348120934828" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 border border-[#25D366]/30 bg-[#25D366]/10 px-4 py-3 font-mono text-xs uppercase text-[#25D366] transition-all hover:bg-[#25D366] hover:text-[#25D366] hover:border-[#25D366] rounded mt-auto"
              >
                <MessageCircle className="h-4 w-4" /> Contact Support
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Feature Preview */}
        <div className="space-y-4">
          {/* Current Training Card */}
          <div className="rounded-xl border border-[#00f0ff]/30 bg-[#1a1d24]/60 p-6 backdrop-blur-sm relative overflow-hidden transition-all hover:border-[#00f0ff]/50">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[#00f0ff] mb-4 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f0ff] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f0ff]"></span>
              </span>
              Current Training
            </h3>
            
            <div className="space-y-1">
              <p className="font-heading text-xl font-bold text-white uppercase">Cohort 1</p>
              <p className="font-mono text-sm text-[#b9cacb]">Week 2 • Day 2</p>
              <p className="font-mono text-xs text-[#b9cacb] mt-2">Live Classes: Every Saturday</p>
            </div>
            
            <div className="mt-4 border-t border-[#3b494b]/50 pt-4">
              <p className="font-mono text-[10px] text-[#5d5f63]">
                Dashboard unlocks immediately after enrollment verification.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[#3b494b] bg-[#1a1d24]/40 p-6 backdrop-blur-sm">
            <h3 className="font-mono text-sm uppercase tracking-widest text-[#00f0ff] mb-6 border-b border-[#3b494b] pb-2">
              Feature Preview
            </h3>
            <div className="grid gap-3">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 rounded bg-[#111317] p-3 border border-[#3b494b]/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#00f0ff]/10">
                    {feature.icon}
                  </div>
                  <span className="font-mono text-sm text-[#e2e8e2]">{feature.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Option 4 - Sign Out Section */}
          <div className="rounded-xl border border-[#3b494b] bg-[#1a1d24]/40 p-6 backdrop-blur-sm text-center">
            <p className="font-mono text-sm font-bold text-white mb-2">Not your account?</p>
            <p className="font-mono text-xs text-[#b9cacb] mb-1">You are currently signed in as:</p>
            <p className="font-mono text-sm text-[#00f0ff] mb-4 truncate">
              {user?.primaryEmailAddress?.emailAddress || "Loading..."}
            </p>
            <p className="font-mono text-[10px] text-[#5d5f63] mb-4">
              If this isn't the email you used to register or make payment, sign out and log in with the correct account.
            </p>
            <button
              onClick={() => signOut({ redirectUrl: '/' })}
              className="inline-flex items-center justify-center gap-2 border border-[#3b494b] bg-[#111317] px-4 py-2 font-mono text-xs uppercase text-[#b9cacb] transition-colors hover:border-red-500 hover:text-red-500 rounded"
            >
              <LogOut className="h-3 w-3" /> Sign Out
            </button>
          </div>
        </div>

      </div>

      {/* Help Section */}
      <div className="w-full max-w-5xl mt-8">
        <div className="rounded-xl border border-[#3b494b] bg-[#1a1d24]/60 backdrop-blur-sm p-6 sm:p-8">
          <h3 className="font-heading text-2xl font-bold uppercase text-white mb-6 text-center">Need Help?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <a href="https://wa.me/2348120934828" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-3 rounded-lg border border-[#3b494b]/50 bg-[#111317] p-6 text-center transition-all hover:border-[#00f0ff]/50 hover:bg-[#1a1d24]">
              <MessageCircle className="h-6 w-6 text-[#00f0ff]" />
              <span className="font-mono text-xs text-[#e2e8e2] uppercase tracking-wider">WhatsApp Support</span>
              <span className="text-[10px] text-[#b9cacb]">+234 812 093 4828</span>
            </a>
            <a href="mailto:autolearnspot@gmail.com" className="flex flex-col items-center justify-center gap-3 rounded-lg border border-[#3b494b]/50 bg-[#111317] p-6 text-center transition-all hover:border-[#00f0ff]/50 hover:bg-[#1a1d24]">
              <Mail className="h-6 w-6 text-[#00f0ff]" />
              <span className="font-mono text-xs text-[#e2e8e2] uppercase tracking-wider">Email Support</span>
              <span className="text-[10px] text-[#b9cacb]">autolearnspot@gmail.com</span>
            </a>
          </div>

          <h3 className="font-heading text-xl font-bold uppercase text-white mb-6 text-center">Frequently Asked Questions</h3>
          <div className="space-y-4 max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-[#3b494b]/50 bg-[#111317] rounded-lg overflow-hidden transition-colors hover:border-[#00f0ff]/50">
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="flex w-full items-center justify-between p-4 text-left font-mono text-sm font-semibold text-[#e2e8e2] transition-colors focus:outline-none"
                >
                  <span>{faq.question}</span>
                  <span className="ml-4 flex-shrink-0 text-[#00f0ff]">
                    {openFaqIndex === index ? '−' : '+'}
                  </span>
                </button>
                {openFaqIndex === index && (
                  <div className="border-t border-[#3b494b]/30 p-4 text-sm text-[#b9cacb] bg-[#0a0c10]">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
