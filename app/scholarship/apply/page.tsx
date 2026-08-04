"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { submitScholarshipApplication } from '../actions';
import { scholarshipConfig } from '@/config/scholarship';
import Navigation from '@/components/Navigation';

type FormState = {
  // Step 1
  full_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  country: string;
  state: string;
  occupation: string;
  
  // Step 2
  ai_experience: string;
  automation_experience: string;
  has_laptop: boolean;
  has_internet: boolean;
  
  // Step 3
  motivation: string;
  goals: string;
  impact: string;
  why_you: string;
  
  // Step 4
  commitment_confirmed: boolean;
  
  // Growth Engine
  referred_by_code?: string;
};

const INITIAL_STATE: FormState = {
  full_name: '', email: '', phone: '', whatsapp: '', country: '', state: '', occupation: '',
  ai_experience: '', automation_experience: '', has_laptop: false, has_internet: false,
  motivation: '', goals: '', impact: '', why_you: '',
  commitment_confirmed: false,
  referred_by_code: '',
};

export default function ScholarshipApplyPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormState>(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ referenceNumber: string } | null>(null);
  const [existingApplication, setExistingApplication] = useState<{ referenceNumber: string; status: string } | null>(null);

  const { fullValue, commitmentFee } = scholarshipConfig;
  const formattedFullValue = `₦${fullValue.toLocaleString()}`;
  const formattedCommitmentFee = `₦${commitmentFee.toLocaleString()}`;

  // Growth Engine: Extract referral code from URL
  const [refCode, setRefCode] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('ref');
      if (code) {
        setRefCode(code);
        // Track the click asynchronously (fire and forget)
        fetch('/api/referrals/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        }).catch(console.error);
      }
    } catch (e) {
      console.error('Error parsing referral code:', e);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const nextStep = () => {
    setError(null);
    if (step === 1) {
      if (!formData.full_name || !formData.email || !formData.phone || !formData.whatsapp || !formData.country || !formData.state || !formData.occupation) {
        return setError('Please fill in all personal information fields.');
      }
    } else if (step === 2) {
      if (!formData.ai_experience || !formData.automation_experience || !formData.has_laptop || !formData.has_internet) {
        return setError('Please complete all technology background fields. Note: A laptop and internet are required.');
      }
    } else if (step === 3) {
      if (!formData.motivation || !formData.goals || !formData.impact || !formData.why_you) {
        return setError('Please answer all motivation and goals questions.');
      }
    }
    setStep(s => s + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep(s => s - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.commitment_confirmed) {
      return setError('You must confirm the commitment to proceed.');
    }

    setIsSubmitting(true);
    
    try {
      // Inject referral code if present
      const submitData = { ...formData };
      if (refCode) submitData.referred_by_code = refCode;

      const result = await submitScholarshipApplication(submitData);
      
      if (result.success && result.referenceNumber) {
        setSuccessData({ referenceNumber: result.referenceNumber });
        setStep(5);
      } else if (result.requiresStatusCheck && result.existingReference) {
        setExistingApplication({ 
          referenceNumber: result.existingReference, 
          status: result.existingStatus || 'Unknown' 
        });
        setStep(6);
      } else {
        setError(result.error || 'Failed to submit application.');
      }
    } catch (err: any) {
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 5 && successData) {
    return (
      <main className="min-h-screen bg-[#111317] text-[#e2e2e8] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0c0e12] border border-[#1f2229] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00f0ff] to-[#00363a]" />
          
          <CheckCircle className="w-16 h-16 text-[#00f0ff] mx-auto mb-6" />
          
          <h2 className="font-heading text-2xl font-bold mb-4">Application Submitted!</h2>
          
          <p className="text-[#b9cacb] mb-6">
            We have received your application. A confirmation email has been sent to {formData.email}.
          </p>
          
          <div className="bg-[#1a1c20] border border-[#1f2229] p-4 mb-8">
            <p className="text-sm text-[#b9cacb] mb-1 uppercase tracking-widest">Your Reference Number</p>
            <p className="font-mono text-xl text-[#00f0ff] font-bold">{successData.referenceNumber}</p>
          </div>
          
          <Link
            href="/scholarship/status"
            className="w-full flex items-center justify-center gap-2 border border-[#00f0ff] bg-[#00f0ff]/10 px-6 py-3 font-mono text-sm font-bold uppercase text-[#00f0ff] transition-all hover:bg-[#00f0ff] hover:text-black hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]"
          >
            Check Status Page
          </Link>
        </div>
      </main>
    );
  }

  if (step === 6 && existingApplication) {
    return (
      <main className="min-h-screen bg-[#111317] text-[#e2e2e8] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0c0e12] border border-[#1f2229] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-400" />
          
          <h2 className="font-heading text-2xl font-bold mb-4">You already have an existing scholarship application.</h2>
          
          <p className="text-[#b9cacb] mb-6">
            Reference Number: <span className="text-white font-bold">{existingApplication.referenceNumber}</span>
          </p>
          
          <p className="text-[#b9cacb] mb-8">
            Please use the Check Application Status page to monitor your application.
          </p>
          
          <Link
            href="/scholarship/status"
            className="w-full flex items-center justify-center gap-2 border border-[#00f0ff] bg-[#00f0ff]/10 px-6 py-3 font-mono text-sm font-bold uppercase text-[#00f0ff] transition-all hover:bg-[#00f0ff] hover:text-black hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]"
          >
            Check Application Status
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#111317] text-[#e2e2e8] pb-24">
      <Navigation />
      <div className="pt-24">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Link className="flex items-center gap-2 font-mono text-sm font-bold uppercase text-white mb-8 hover:text-[#00f0ff] transition-colors" href="/scholarship">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Scholarship Info</span>
          </Link>
          <div className="mb-8">
            <div className="font-mono text-sm text-[#b9cacb] mb-2">
              Step {step} of 4
            </div>
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold mb-2">Scholarship Application</h1>
          <p className="text-[#b9cacb]">Complete all steps to be considered for the {formattedFullValue} scholarship.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-12">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-1 flex-1 ${i <= step ? 'bg-[#00f0ff]' : 'bg-[#1f2229]'}`} />
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 mb-8 font-mono text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in-up">
              <h2 className="font-heading text-xl font-bold border-b border-[#1f2229] pb-4 mb-6 text-[#00f0ff]">1. Personal Information</h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-mono text-[#b9cacb]">Full Name *</label>
                  <input required name="full_name" value={formData.full_name} onChange={handleChange} className="w-full bg-[#0c0e12] border border-[#1f2229] p-3 text-white focus:border-[#00f0ff] focus:outline-none transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-mono text-[#b9cacb]">Email Address *</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-[#0c0e12] border border-[#1f2229] p-3 text-white focus:border-[#00f0ff] focus:outline-none transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-mono text-[#b9cacb]">Phone Number *</label>
                  <input required name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-[#0c0e12] border border-[#1f2229] p-3 text-white focus:border-[#00f0ff] focus:outline-none transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-mono text-[#b9cacb]">WhatsApp Number *</label>
                  <input required name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="w-full bg-[#0c0e12] border border-[#1f2229] p-3 text-white focus:border-[#00f0ff] focus:outline-none transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-mono text-[#b9cacb]">Country *</label>
                  <input required name="country" value={formData.country} onChange={handleChange} className="w-full bg-[#0c0e12] border border-[#1f2229] p-3 text-white focus:border-[#00f0ff] focus:outline-none transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-mono text-[#b9cacb]">State/City *</label>
                  <input required name="state" value={formData.state} onChange={handleChange} className="w-full bg-[#0c0e12] border border-[#1f2229] p-3 text-white focus:border-[#00f0ff] focus:outline-none transition-colors" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-mono text-[#b9cacb]">Current Occupation/Role *</label>
                  <input required name="occupation" value={formData.occupation} onChange={handleChange} className="w-full bg-[#0c0e12] border border-[#1f2229] p-3 text-white focus:border-[#00f0ff] focus:outline-none transition-colors" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in-up">
              <h2 className="font-heading text-xl font-bold border-b border-[#1f2229] pb-4 mb-6 text-[#00f0ff]">2. Technology Background</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-mono text-[#b9cacb]">What is your experience with AI tools? *</label>
                  <select required name="ai_experience" value={formData.ai_experience} onChange={handleChange} className="w-full bg-[#0c0e12] border border-[#1f2229] p-3 text-white focus:border-[#00f0ff] focus:outline-none transition-colors appearance-none">
                    <option value="">Select experience level</option>
                    <option value="None">None - Complete beginner</option>
                    <option value="Beginner">Beginner - Used ChatGPT occasionally</option>
                    <option value="Intermediate">Intermediate - Use AI regularly for tasks</option>
                    <option value="Advanced">Advanced - Build AI tools or prompt engineer</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-mono text-[#b9cacb]">What is your experience with automation tools (Zapier, Make, n8n)? *</label>
                  <select required name="automation_experience" value={formData.automation_experience} onChange={handleChange} className="w-full bg-[#0c0e12] border border-[#1f2229] p-3 text-white focus:border-[#00f0ff] focus:outline-none transition-colors appearance-none">
                    <option value="">Select experience level</option>
                    <option value="None">None - Have never used them</option>
                    <option value="Beginner">Beginner - Have played around a bit</option>
                    <option value="Intermediate">Intermediate - Have built working automations</option>
                    <option value="Advanced">Advanced - Automations are part of my daily job</option>
                  </select>
                </div>

                <div className="space-y-4 pt-4 border-t border-[#1f2229]">
                  <label className="flex items-center gap-3 p-4 border border-[#1f2229] bg-[#0c0e12] hover:border-[#00f0ff]/50 cursor-pointer transition-colors">
                    <input type="checkbox" name="has_laptop" checked={formData.has_laptop} onChange={handleChange} className="w-5 h-5 accent-[#00f0ff]" />
                    <span className="text-sm text-[#e2e2e8]">I have access to a working laptop/computer for the next 4 weeks. *</span>
                  </label>
                  
                  <label className="flex items-center gap-3 p-4 border border-[#1f2229] bg-[#0c0e12] hover:border-[#00f0ff]/50 cursor-pointer transition-colors">
                    <input type="checkbox" name="has_internet" checked={formData.has_internet} onChange={handleChange} className="w-5 h-5 accent-[#00f0ff]" />
                    <span className="text-sm text-[#e2e2e8]">I have reliable internet access to join live sessions and complete assignments. *</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in-up">
              <h2 className="font-heading text-xl font-bold border-b border-[#1f2229] pb-4 mb-6 text-[#00f0ff]">3. Motivation & Goals</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-mono text-[#b9cacb]">Why do you want to learn AI Automation? *</label>
                  <textarea required name="motivation" value={formData.motivation} onChange={handleChange} rows={4} className="w-full bg-[#0c0e12] border border-[#1f2229] p-3 text-white focus:border-[#00f0ff] focus:outline-none transition-colors resize-none" placeholder="Share your main motivation..." />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-mono text-[#b9cacb]">What is your specific goal for the next 6 months? *</label>
                  <textarea required name="goals" value={formData.goals} onChange={handleChange} rows={3} className="w-full bg-[#0c0e12] border border-[#1f2229] p-3 text-white focus:border-[#00f0ff] focus:outline-none transition-colors resize-none" placeholder="e.g., Get a job, start an agency, automate my business..." />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-mono text-[#b9cacb]">How will this scholarship impact you? *</label>
                  <textarea required name="impact" value={formData.impact} onChange={handleChange} rows={3} className="w-full bg-[#0c0e12] border border-[#1f2229] p-3 text-white focus:border-[#00f0ff] focus:outline-none transition-colors resize-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-mono text-[#b9cacb]">Why should we select you out of hundreds of applicants? *</label>
                  <textarea required name="why_you" value={formData.why_you} onChange={handleChange} rows={3} className="w-full bg-[#0c0e12] border border-[#1f2229] p-3 text-white focus:border-[#00f0ff] focus:outline-none transition-colors resize-none" />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-fade-in-up">
              <h2 className="font-heading text-xl font-bold border-b border-[#1f2229] pb-4 mb-6 text-[#00f0ff]">4. Final Commitment</h2>
              
              <div className="space-y-4">
                <p className="text-[#b9cacb] mb-6">Please read and agree to the following conditions before submitting your application.</p>

                <div className="p-6 border border-[#3b494b] bg-[#1a1c20] space-y-4">
                  <h3 className="font-bold text-white mb-2">Scholarship Terms</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-[#b9cacb]">
                    <li>I understand that the full value of this training is {formattedFullValue}.</li>
                    <li>If selected, I agree to pay a non-refundable Commitment Fee of {formattedCommitmentFee}.</li>
                    <li>I commit to attending sessions, completing assignments, and finishing the capstone project.</li>
                    <li>I understand that failure to participate may result in my scholarship being revoked.</li>
                  </ul>
                </div>

                <label className="flex items-start gap-3 p-4 border border-[#00f0ff]/30 bg-[#0c0e12] mt-6 cursor-pointer">
                  <input type="checkbox" name="commitment_confirmed" checked={formData.commitment_confirmed} onChange={handleChange} className="w-5 h-5 accent-[#00f0ff] mt-0.5" />
                  <span className="text-sm text-white">I confirm that all information provided is accurate, and I agree to the Scholarship Terms stated above. *</span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8 border-t border-[#1f2229] mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-3 border border-[#3b494b] font-mono text-sm uppercase text-[#b9cacb] hover:bg-[#1a1c20] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
            ) : (
              <div />
            )}
            
            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 border border-[#00f0ff] bg-[#00f0ff]/10 font-mono text-sm font-bold uppercase text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black transition-colors shadow-[0_0_15px_rgba(0,240,255,0.2)]"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 border border-[#00f0ff] bg-[#00f0ff] font-mono text-sm font-bold uppercase text-black hover:bg-transparent hover:text-[#00f0ff] transition-colors shadow-[0_0_20px_rgba(0,240,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  'Submit Application'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
      </div>
    </main>
  );
}
