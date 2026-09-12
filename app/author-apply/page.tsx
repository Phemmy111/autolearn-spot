"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, Loader2, ArrowRight, UserPlus, LogIn,
  Users, DollarSign, Zap, HeadphonesIcon, Star,
  Upload, FileText, Briefcase, GraduationCap, Sparkles
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

/* ───────── types ───────── */
interface FormData {
  fullName: string;
  email: string;
  phone: string;
  phoneCode: string;
  location: string;
  professionalTitle: string;
  yearsOfExperience: string;
  linkedinProfile: string;
  websitePortfolio: string;
  expertiseAreas: string[];
  bio: string;
}

const EXPERTISE_OPTIONS = [
  'AI & Automation',
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Digital Marketing',
  'Design & UX',
  'Business & Entrepreneurship',
  'Other',
];

const COUNTRY_OPTIONS = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'South Africa',
  'United States',
  'United Kingdom',
  'Canada',
  'India',
  'Other',
];

const EXPERIENCE_OPTIONS = [
  '0-1 years',
  '2-3 years',
  '4-5 years',
  '6-10 years',
  '10+ years',
];

/* ───────── component ───────── */
export default function AuthorApplyPage() {
  const { isSignedIn, userId } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(!isSignedIn);

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    phoneCode: '+234',
    location: '',
    professionalTitle: '',
    yearsOfExperience: '',
    linkedinProfile: '',
    websitePortfolio: '',
    expertiseAreas: [],
    bio: '',
  });

  // File upload refs
  const cvRef = useRef<HTMLInputElement>(null);
  const portfolioRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/author-applications')
        .then(res => res.json())
        .then(data => {
          if (data.application) {
            setExistingApplication(data.application);
          }
        })
        .catch(console.error);
    }
  }, [isSignedIn]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const toggleExpertise = (area: string) => {
    setFormData(prev => ({
      ...prev,
      expertiseAreas: prev.expertiseAreas.includes(area)
        ? prev.expertiseAreas.filter(a => a !== area)
        : [...prev.expertiseAreas, area],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Upload files first if they exist
      let cvUrl = null;
      let portfolioUrl = null;
      let idUrl = null;

      if (cvFile || portfolioFile || idFile) {
        const uploadFormData = new FormData();
        if (cvFile) uploadFormData.append('cvFile', cvFile);
        if (portfolioFile) uploadFormData.append('portfolioFile', portfolioFile);
        if (idFile) uploadFormData.append('idFile', idFile);

        const uploadResponse = await fetch('/api/author-applications/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'Failed to upload files');
        }

        cvUrl = uploadData.cvUrl || null;
        portfolioUrl = uploadData.portfolioUrl || null;
        idUrl = uploadData.idUrl || null;
      }

      const response = await fetch('/api/author-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: `${formData.phoneCode}${formData.phone}`,
          location: formData.location,
          professionalTitle: formData.professionalTitle,
          yearsOfExperience: formData.yearsOfExperience,
          linkedinProfile: formData.linkedinProfile,
          portfolioLink: formData.websitePortfolio,
          expertiseArea: formData.expertiseAreas.join(', '),
          bio: formData.bio,
          whyBecomeAuthor: formData.bio,
          cvUrl,
          portfolioUrl,
          idUrl,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsSubmitted(true);
        
        // If unauthenticated and requires auth, redirect to sign up
        if (data.requiresAuth) {
          setTimeout(() => {
            router.push('/sign-up?redirect=/author');
          }, 2000);
        }
      } else {
        alert(data.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ───── Sign-in prompt (modal style) ───── */
  if (showAuthPrompt && !isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-100">
              <GraduationCap className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get Started</h2>
            <p className="text-gray-500 mb-8 font-medium">You can apply as an author without signing in, or create an account to track your application status.</p>
            <div className="space-y-4">
              <button onClick={() => setShowAuthPrompt(false)} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                <Sparkles className="w-5 h-5" /> Apply Without Account
              </button>
              <button onClick={() => router.push('/sign-up')} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-indigo-600 text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors">
                <UserPlus className="w-5 h-5" /> Create Account
              </button>
              <button onClick={() => router.push('/sign-in')} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                <LogIn className="w-5 h-5" /> Sign In
              </button>
            </div>
            <button onClick={() => router.push('/')} className="mt-8 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
              Return to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ───── Existing application ───── */
  if (existingApplication) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-green-100 shadow-sm">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Status</h1>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 my-6 text-left shadow-inner">
              <p className="text-sm text-gray-600 mb-3">
                <strong className="text-gray-900">Status:</strong>{' '}
                <span className="capitalize text-indigo-700 font-bold bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                  {existingApplication.status?.replace('_', ' ')}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                <strong className="text-gray-900">Submitted:</strong>{' '}
                <span className="font-medium">{new Date(existingApplication.submitted_at).toLocaleDateString()}</span>
              </p>
            </div>
            <button onClick={() => router.push('/')} className="w-full px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg">
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ───── Submitted successfully ───── */
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-500"></div>
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-green-100 shadow-sm">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h1>
            <p className="text-gray-600 mb-8 font-medium leading-relaxed">
              Thank you for your interest in becoming an instructor. We&apos;ll review your application and get back to you within 3–5 business days.
              {!isSignedIn && (
                <span className="block mt-3 text-indigo-600">
                  Create an account to track your application status and get updates.
                </span>
              )}
            </p>
            <div className="space-y-3">
              {!isSignedIn && (
                <button onClick={() => router.push('/sign-up?redirect=/author')} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                  <UserPlus className="w-5 h-5" /> Create Account to Track Status
                </button>
              )}
              <button onClick={() => router.push('/')} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                Return to Home <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ───── Main application form ───── */
  return (
    <div className="min-h-screen bg-gray-50 selection:bg-indigo-100 selection:text-indigo-900 pb-20">

      {/* ── Custom Animations ── */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes gentle-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.95; transform: scale(0.99); }
        }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 6s ease-in-out infinite 2s; }
        .animate-gradient-x { animation: gradient-x 3s linear infinite; background-size: 200% 200%; }
        .animate-gentle-pulse { animation: gentle-pulse 4s ease-in-out infinite; }
      `}} />

      {/* ── Enhanced Hero Section ── */}
      <section className="relative overflow-hidden bg-gray-50 border-b border-gray-200">
        {/* Background Patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-50"></div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-200/40 blur-3xl opacity-60 pointer-events-none animate-gentle-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-purple-200/40 blur-3xl opacity-60 pointer-events-none animate-float-delayed"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white text-indigo-700 text-sm font-bold rounded-full mb-6 border border-indigo-100 shadow-sm animate-float">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Become an Author
            </span>
            
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 leading-tight mb-6 tracking-tight animate-float" style={{ animationDelay: '0.5s' }}>
              Share Your Knowledge,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 animate-gradient-x">
                Build Your Income
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-10 font-medium animate-gentle-pulse" style={{ animationDelay: '1s' }}>
              Join AutoLearn Spot as a content creator and reach thousands of learners while earning from your expertise. Fill out the application form below to get started.
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm font-bold text-gray-700 bg-white/70 py-4 px-8 rounded-2xl border border-gray-200 backdrop-blur-md shadow-sm animate-float-delayed">
              <div className="flex items-center gap-2 hover:scale-105 transition-transform cursor-default">
                <Users className="w-5 h-5 text-indigo-600"/> 
                <span>500+ <span className="font-medium text-gray-500">Active Authors</span></span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
              <div className="flex items-center gap-2 hover:scale-105 transition-transform cursor-default">
                <GraduationCap className="w-5 h-5 text-purple-600"/> 
                <span>10k+ <span className="font-medium text-gray-500">Learners</span></span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
              <div className="flex items-center gap-2 hover:scale-105 transition-transform cursor-default">
                <DollarSign className="w-5 h-5 text-emerald-600"/> 
                <span>Earn <span className="font-medium text-gray-500">on every enrolment</span></span>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* ── Form + Sidebar ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">

          {/* ── LEFT: Application Form Card ── */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              
              <div className="p-6 sm:p-10">
                {/* Card header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Users className="w-7 h-7 text-indigo-600" />
                  </div>
                  <div className="pt-1">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Author Application</h2>
                    <p className="text-base text-gray-500 mt-1.5 font-medium">
                      Tell us about yourself and your expertise. We&apos;ll review your application and get back to you within 3–5 business days.
                    </p>
                  </div>
                </div>

                <hr className="my-8 border-gray-100" />

                <form id="application-form" onSubmit={handleSubmit} className="space-y-12">

                  {/* ─── Section 1: Personal Information ─── */}
                  <div className="group">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">1</span>
                      <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 ml-0 lg:ml-11">
                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Full Name <span className="text-red-500">*</span></label>
                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="Enter your full name" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm" />
                      </div>
                      {/* Email */}
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Email Address <span className="text-red-500">*</span></label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm" />
                      </div>
                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Phone Number <span className="text-red-500">*</span></label>
                        <div className="flex shadow-sm rounded-xl">
                          <select name="phoneCode" value={formData.phoneCode} onChange={handleChange} className="px-3 py-3 border border-gray-300 rounded-l-xl text-sm font-medium text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 border-r-0 w-24 transition-all">
                            <option value="+234">+234</option>
                            <option value="+233">+233</option>
                            <option value="+254">+254</option>
                            <option value="+27">+27</option>
                            <option value="+1">+1</option>
                            <option value="+44">+44</option>
                            <option value="+91">+91</option>
                          </select>
                          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="Enter your phone number" className="flex-1 px-4 py-3 border border-gray-300 rounded-r-xl text-sm font-medium text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                        </div>
                      </div>
                      {/* Location */}
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Location <span className="text-red-500">*</span></label>
                        <select name="location" value={formData.location} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none transition-all shadow-sm">
                          <option value="" className="text-gray-400 font-normal">Select your country</option>
                          {COUNTRY_OPTIONS.map(c => <option key={c} value={c} className="text-gray-900">{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* ─── Section 2: Professional Information ─── */}
                  <div className="group">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">2</span>
                      <h3 className="text-xl font-bold text-gray-900">Professional Information</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 ml-0 lg:ml-11">
                      {/* Professional Title */}
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Professional Title <span className="text-red-500">*</span></label>
                        <input type="text" name="professionalTitle" value={formData.professionalTitle} onChange={handleChange} required placeholder="e.g. Software Engineer, Designer" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm" />
                      </div>
                      {/* Years of Experience */}
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Years of Experience <span className="text-red-500">*</span></label>
                        <select name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none transition-all shadow-sm">
                          <option value="" className="text-gray-400 font-normal">Select years of experience</option>
                          {EXPERIENCE_OPTIONS.map(e => <option key={e} value={e} className="text-gray-900">{e}</option>)}
                        </select>
                      </div>
                      {/* LinkedIn */}
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">LinkedIn Profile (Optional)</label>
                        <input type="url" name="linkedinProfile" value={formData.linkedinProfile} onChange={handleChange} placeholder="https://linkedin.com/in/yourname" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm" />
                      </div>
                      {/* Website */}
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Website / Portfolio (Optional)</label>
                        <input type="url" name="websitePortfolio" value={formData.websitePortfolio} onChange={handleChange} placeholder="https://yourwebsite.com" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm" />
                      </div>
                    </div>
                  </div>

                  {/* ─── Section 3: Areas of Expertise ─── */}
                  <div className="group">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">3</span>
                      <h3 className="text-xl font-bold text-gray-900">Areas of Expertise</h3>
                    </div>
                    <div className="ml-0 lg:ml-11">
                      <p className="text-sm font-medium text-gray-500 mb-5">Select the skills or topics you can teach (you can choose multiple).</p>
                      <div className="flex flex-wrap gap-3">
                        {EXPERTISE_OPTIONS.map(area => {
                          const isSelected = formData.expertiseAreas.includes(area);
                          return (
                            <label key={area} className={`flex items-center gap-2.5 cursor-pointer text-sm font-bold select-none px-4 py-2.5 border-2 rounded-xl transition-all shadow-sm ${isSelected ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'}`}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleExpertise(area)}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                              />
                              {area}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* ─── Section 4: About You ─── */}
                  <div className="group">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">4</span>
                      <h3 className="text-xl font-bold text-gray-900">About You</h3>
                    </div>
                    <div className="ml-0 lg:ml-11">
                      <p className="text-sm font-medium text-gray-500 mb-5">
                        Tell us about your background, experience and what you plan to teach. <span className="text-red-500">*</span>
                      </p>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        required
                        rows={5}
                        placeholder="Share your story, expertise and teaching goals..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  {/* ─── Section 5: Upload Supporting Documents ─── */}
                  <div className="group">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">5</span>
                      <h3 className="text-xl font-bold text-gray-900">Upload Supporting Documents</h3>
                    </div>
                    <div className="ml-0 lg:ml-11">
                      <p className="text-sm font-medium text-gray-500 mb-5">
                        Please upload relevant documents to help us verify your credentials (optional but recommended).
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* CV */}
                        <button
                          type="button"
                          onClick={() => cvRef.current?.click()}
                          className="flex flex-col items-center justify-center gap-2.5 p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-center group/btn cursor-pointer"
                        >
                          <div className="w-12 h-12 bg-white group-hover/btn:bg-indigo-100 rounded-xl flex items-center justify-center shadow-sm transition-colors">
                            <FileText className="w-6 h-6 text-gray-400 group-hover/btn:text-indigo-600 transition-colors" />
                          </div>
                          <div>
                            <span className="block text-sm font-bold text-gray-800">{cvFile ? cvFile.name : 'CV / Resume'}</span>
                            <span className="block text-xs font-medium text-gray-500 mt-1">PDF, DOC, DOCX (Max 5MB)</span>
                          </div>
                        </button>
                        <input ref={cvRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setCvFile(e.target.files?.[0] || null)} />

                        {/* Portfolio */}
                        <button
                          type="button"
                          onClick={() => portfolioRef.current?.click()}
                          className="flex flex-col items-center justify-center gap-2.5 p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-center group/btn cursor-pointer"
                        >
                          <div className="w-12 h-12 bg-white group-hover/btn:bg-indigo-100 rounded-xl flex items-center justify-center shadow-sm transition-colors">
                            <Briefcase className="w-6 h-6 text-gray-400 group-hover/btn:text-indigo-600 transition-colors" />
                          </div>
                          <div>
                            <span className="block text-sm font-bold text-gray-800">{portfolioFile ? portfolioFile.name : 'Work Samples'}</span>
                            <span className="block text-xs font-medium text-gray-500 mt-1">PDF, ZIP (Max 10MB)</span>
                          </div>
                        </button>
                        <input ref={portfolioRef} type="file" accept=".pdf,.zip" className="hidden" onChange={e => setPortfolioFile(e.target.files?.[0] || null)} />

                        {/* ID */}
                        <button
                          type="button"
                          onClick={() => idRef.current?.click()}
                          className="flex flex-col items-center justify-center gap-2.5 p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-center group/btn cursor-pointer"
                        >
                          <div className="w-12 h-12 bg-white group-hover/btn:bg-indigo-100 rounded-xl flex items-center justify-center shadow-sm transition-colors">
                            <Upload className="w-6 h-6 text-gray-400 group-hover/btn:text-indigo-600 transition-colors" />
                          </div>
                          <div>
                            <span className="block text-sm font-bold text-gray-800">{idFile ? idFile.name : 'ID Document'}</span>
                            <span className="block text-xs font-medium text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB)</span>
                          </div>
                        </button>
                        <input ref={idRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setIdFile(e.target.files?.[0] || null)} />
                      </div>
                    </div>
                  </div>

                  {/* ─── Actions ─── */}
                  <div className="flex flex-col-reverse sm:flex-row items-center justify-between pt-8 border-t border-gray-100 ml-0 lg:ml-11 gap-4">
                    <button type="button" onClick={() => router.push('/')} className="w-full sm:w-auto px-6 py-3.5 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors text-sm shadow-sm">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                      ) : (
                        <>Submit Application <ArrowRight className="w-5 h-5" /></>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="w-full lg:w-[22rem] xl:w-96 flex-shrink-0 space-y-6">

            {/* Why Become an Author */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none"></div>
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">Why Become an Author?</h3>
              </div>
              
              <p className="text-sm font-medium text-gray-600 mb-8 relative z-10 leading-relaxed">
                Turn your skills into impact and income. As an AutoLearn Spot author, you&apos;ll get:
              </p>

              <div className="space-y-6 relative z-10">
                {[
                  { icon: Users, color: 'bg-indigo-50 text-indigo-700 border-indigo-100', title: 'Reach a Global Audience', desc: 'Teach learners from around the world and expand your impact.' },
                  { icon: DollarSign, color: 'bg-emerald-50 text-emerald-700 border-emerald-100', title: 'Earn Competitive Revenue', desc: 'Get paid for every enrolment and grow your income over time.' },
                  { icon: Zap, color: 'bg-blue-50 text-blue-700 border-blue-100', title: 'Easy Course Creation', desc: 'Use our simple tools to create and manage your courses.' },
                  { icon: HeadphonesIcon, color: 'bg-purple-50 text-purple-700 border-purple-100', title: 'Full Support', desc: 'Our team is here to support you every step of the way.' },
                ].map(({ icon: Icon, color, title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${color} shadow-sm`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{title}</h4>
                      <p className="text-xs font-medium text-gray-500 mt-1 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none"></div>
              
              <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">How It Works</h3>
              </div>

              <div className="space-y-6 relative z-10">
                {[
                  { step: '1', title: 'Submit Your Application', desc: 'Fill out the form with your details and expertise.' },
                  { step: '2', title: 'Review Process', desc: 'Our team will review your application and verify your credentials.' },
                  { step: '3', title: 'Get Approved', desc: "Once approved, you'll get access to the author dashboard." },
                  { step: '4', title: 'Create & Publish', desc: 'Start creating your courses and reach learners worldwide.' },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex items-start gap-4 relative">
                    <span className="w-10 h-10 border-2 border-indigo-100 text-indigo-700 bg-indigo-50/50 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm relative z-10">{step}</span>
                    {/* Connecting line between steps */}
                    {step !== '4' && <div className="absolute top-10 left-5 w-px h-10 bg-indigo-50 -z-10"></div>}
                    <div className="pt-0.5">
                      <h4 className="text-sm font-bold text-gray-900">{title}</h4>
                      <p className="text-xs font-medium text-gray-500 mt-1 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Already an Author? */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-200/60 p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 border border-amber-100 shadow-sm">
                  <Star className="w-7 h-7 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-lg font-extrabold text-amber-900 tracking-tight">Already an Author?</h4>
                  <p className="text-xs font-semibold text-amber-700/80 mt-2 leading-relaxed">
                    Log in to your author dashboard to manage your courses, students and earnings.
                  </p>
                  <Link href="/author" className="inline-flex items-center justify-center gap-2 w-full mt-5 text-sm font-bold text-indigo-700 bg-white px-5 py-3 rounded-xl border border-amber-200/50 shadow-sm hover:shadow-md hover:text-indigo-800 transition-all">
                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}