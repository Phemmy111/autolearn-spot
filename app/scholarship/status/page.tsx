"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail, KeyRound, Search, CheckCircle, Clock, XCircle, FileText, AlertCircle, Calendar, CreditCard } from 'lucide-react';
import { requestStatusOTP, verifyOTPAndGetStatus, markPaymentPending } from '../actions';
import { scholarshipConfig } from '@/config/scholarship';

type StatusType = 'Submitted' | 'Under Review' | 'Shortlisted' | 'Accepted' | 'Waitlisted' | 'Not Selected';

export default function ScholarshipStatusPage() {
  const [step, setStep] = useState<'request' | 'verify' | 'result'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [result, setResult] = useState<{ reference_number: string; status: StatusType; full_name: string; payment_status?: string } | null>(null);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) return setError('Please enter your email address.');
    
    setIsLoading(true);
    try {
      const res = await requestStatusOTP(email);
      if (res.success) {
        setStep('verify');
      } else {
        setError(res.error || 'Failed to send verification code.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp) return setError('Please enter the 6-digit code.');
    
    setIsLoading(true);
    try {
      const res = await verifyOTPAndGetStatus(email, otp);
      if (res.success && res.data) {
        setResult(res.data);
        setStep('result');
      } else {
        setError(res.error || 'Invalid verification code.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatusIcon = (status: StatusType) => {
    switch (status) {
      case 'Submitted':
        return <FileText className="w-16 h-16 text-[#b9cacb] mx-auto mb-6" />;
      case 'Under Review':
        return <Search className="w-16 h-16 text-[#00f0ff] mx-auto mb-6 animate-pulse" />;
      case 'Shortlisted':
        return <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-6" />;
      case 'Accepted':
        return <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />;
      case 'Waitlisted':
        return <Calendar className="w-16 h-16 text-orange-400 mx-auto mb-6" />;
      case 'Not Selected':
        return <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />;
      default:
        return <FileText className="w-16 h-16 text-[#b9cacb] mx-auto mb-6" />;
    }
  };

  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case 'Submitted': return 'text-[#b9cacb] border-[#3b494b]';
      case 'Under Review': return 'text-[#00f0ff] border-[#00f0ff]';
      case 'Shortlisted': return 'text-yellow-400 border-yellow-400';
      case 'Accepted': return 'text-green-400 border-green-400';
      case 'Waitlisted': return 'text-orange-400 border-orange-400';
      case 'Not Selected': return 'text-red-400 border-red-400';
      default: return 'text-[#b9cacb] border-[#3b494b]';
    }
  };

  return (
    <main className="min-h-screen bg-[#111317] text-[#e2e2e8] flex flex-col">
      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[#3b494b] bg-[#111317]/95 px-4 backdrop-blur sm:px-6">
        <Link className="flex items-center gap-2 font-mono text-sm font-bold uppercase text-white" href="/scholarship">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Scholarship Info</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 mb-6 font-mono text-sm text-center">
              {error}
            </div>
          )}

          {step === 'request' && (
            <div className="bg-[#0c0e12] border border-[#1f2229] p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00f0ff] to-[#00363a]" />
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-[#00f0ff]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-[#00f0ff]" />
                </div>
                <h1 className="font-heading text-2xl font-bold mb-2">Check Application Status</h1>
                <p className="text-sm text-[#b9cacb]">Enter your email to receive a secure verification code.</p>
              </div>

              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div>
                  <label className="sr-only">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1a1c20] border border-[#3b494b] p-4 text-white focus:border-[#00f0ff] focus:outline-none transition-colors text-center"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-[#00f0ff] text-black font-mono font-bold uppercase p-4 hover:bg-transparent hover:text-[#00f0ff] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] border border-[#00f0ff] transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Code'}
                </button>
              </form>
            </div>
          )}

          {step === 'verify' && (
            <div className="bg-[#0c0e12] border border-[#1f2229] p-8 relative overflow-hidden animate-fade-in-up">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00f0ff] to-[#00363a]" />
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-[#00f0ff]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-6 h-6 text-[#00f0ff]" />
                </div>
                <h1 className="font-heading text-2xl font-bold mb-2">Enter Verification Code</h1>
                <p className="text-sm text-[#b9cacb]">We sent a 6-digit code to {email}</p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="sr-only">Verification Code</label>
                  <input
                    type="text"
                    required
                    placeholder="------"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-[#1a1c20] border border-[#3b494b] p-4 text-white text-2xl tracking-[0.5em] focus:border-[#00f0ff] focus:outline-none transition-colors text-center font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || otp.length < 5}
                  className="w-full flex items-center justify-center gap-2 bg-[#00f0ff] text-black font-mono font-bold uppercase p-4 hover:bg-transparent hover:text-[#00f0ff] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] border border-[#00f0ff] transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & View Status'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="w-full text-sm text-[#b9cacb] hover:text-[#00f0ff] mt-4 transition-colors"
                >
                  Use a different email
                </button>
              </form>
            </div>
          )}

          {step === 'result' && result && (
            <div className="bg-[#0c0e12] border border-[#1f2229] p-8 text-center relative overflow-hidden animate-fade-in-up">
              <div className={`absolute top-0 left-0 w-full h-1 ${
                result.status === 'Accepted' ? 'bg-green-400' :
                result.status === 'Under Review' ? 'bg-[#00f0ff]' :
                result.status === 'Waitlisted' ? 'bg-orange-400' :
                result.status === 'Not Selected' ? 'bg-red-400' :
                result.status === 'Shortlisted' ? 'bg-yellow-400' :
                'bg-[#b9cacb]'
              }`} />
              
              {renderStatusIcon(result.status)}
              
              <h1 className="font-heading text-2xl font-bold mb-2">Hello, {result.full_name}</h1>
              <p className="text-sm text-[#b9cacb] mb-6">Here is the current status of your application.</p>
              
              <div className="bg-[#1a1c20] border border-[#1f2229] p-6 mb-8">
                <p className="text-xs text-[#b9cacb] uppercase tracking-widest mb-1">Status</p>
                <div className={`inline-block border px-4 py-1 rounded-full text-sm font-bold font-mono mb-6 ${getStatusColor(result.status)}`}>
                  {result.status}
                </div>
                
                <p className="text-xs text-[#b9cacb] uppercase tracking-widest mb-1">Reference Number</p>
                <p className="font-mono text-lg text-white">{result.reference_number}</p>
              </div>
              
              {result.status === 'Submitted' && (
                <p className="text-sm text-[#b9cacb]">Your application is in our queue and will be reviewed shortly.</p>
              )}
              {result.status === 'Under Review' && (
                <p className="text-sm text-[#00f0ff]">Our team is currently reviewing your application. You'll hear from us soon!</p>
              )}
              {result.status === 'Accepted' && (
                <div className="space-y-4">
                  <p className="text-sm text-green-400">Congratulations! You've been awarded a scholarship.</p>
                  
                  {result.payment_status === 'Waiting' && (
                    <div className="space-y-3">
                      <a
                        href={scholarshipConfig.paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full flex items-center justify-center gap-2 bg-[#00f0ff] text-black font-mono font-bold uppercase p-4 hover:bg-transparent hover:text-[#00f0ff] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] border border-[#00f0ff] transition-all"
                      >
                        <CreditCard className="w-5 h-5" />
                        Pay Commitment Fee (₦5,000)
                      </a>
                      <p className="text-xs text-[#b9cacb] text-center">
                        Payment verification is automatic. You'll receive a welcome email after successful payment.
                      </p>
                      <button
                        onClick={async () => {
                          setIsLoading(true);
                          const res = await markPaymentPending(email);
                          setIsLoading(false);
                          if (res.success) {
                            setResult({ ...result, payment_status: 'Pending Verification' });
                          } else {
                            setError(res.error || 'Failed to mark payment as pending');
                          }
                        }}
                        disabled={isLoading}
                        className="block w-full text-xs text-[#b9cacb] hover:text-[#00f0ff] border border-[#3b494b] py-2 transition-colors disabled:opacity-50"
                      >
                        Payment not automatically verified? Click here
                      </button>
                    </div>
                  )}
                  
                  {result.payment_status === 'Pending Verification' && (
                    <p className="text-sm text-yellow-400">Your payment is being verified. You'll receive access shortly.</p>
                  )}
                  
                  {result.payment_status === 'Verified' && (
                    <p className="text-sm text-green-400">Payment verified! Welcome to AutoLearn Spot.</p>
                  )}
                </div>
              )}
              
              <button
                onClick={() => {
                  setStep('request');
                  setEmail('');
                  setOtp('');
                  setResult(null);
                }}
                className="w-full text-sm text-[#b9cacb] hover:text-white mt-8 border border-[#3b494b] py-3 transition-colors"
              >
                Check Another Application
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
