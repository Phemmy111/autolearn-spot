"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, Loader2, ArrowRight, UserPlus, LogIn,
  Users, DollarSign, Zap, HeadphonesIcon, Star,
  Upload, FileText, Briefcase, Image as ImageIcon,
  Play, MessageSquare, GraduationCap
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
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsSubmitted(true);
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

  /* ───── Sign-in prompt ───── */
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto pt-32 px-4 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-10">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get Started</h2>
            <p className="text-gray-500 mb-8">Sign in or create an account to apply as an author.</p>
            <div className="space-y-3">
              <button onClick={() => router.push('/sign-up')} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                <UserPlus className="w-5 h-5" /> Create Account
              </button>
              <button onClick={() => router.push('/sign-in')} className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors">
                <LogIn className="w-5 h-5" /> Sign In
              </button>
            </div>
            <button onClick={() => router.push('/')} className="mt-6 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Status</h1>
            <div className="bg-gray-50 rounded-xl p-6 my-6 text-left">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Status:</strong>{' '}
                <span className="capitalize text-indigo-600 font-semibold">
                  {existingApplication.status?.replace('_', ' ')}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                <strong>Submitted:</strong>{' '}
                {new Date(existingApplication.submitted_at).toLocaleDateString()}
              </p>
            </div>
            <button onClick={() => router.push('/')} className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for your interest in becoming an instructor. We&apos;ll review your application and get back to you within 3–5 business days.
            </p>
            <button onClick={() => router.push('/')} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
              Return to Home <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ───── Main application form ───── */
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero Section ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10">
            {/* Left text */}
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-full mb-6">
                <GraduationCap className="w-4 h-4" />
                Become an Author
              </span>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
                Share Your Knowledge,<br />Build Your Income
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed">
                Join AutoLearn Spot as a content creator and reach thousands of learners while earning from your expertise. Fill out the application form below to get started.
              </p>
            </div>

            {/* Right illustration */}
            <div className="relative w-64 h-48 flex-shrink-0 hidden lg:block">
              <div className="absolute top-4 right-0 w-40 h-28 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl" />
              <div className="absolute top-8 right-4 w-32 h-24 bg-white rounded-xl shadow-lg flex items-center justify-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Play className="w-5 h-5 text-indigo-600 ml-0.5" />
                </div>
              </div>
              <div className="absolute -top-2 right-0 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="absolute bottom-4 left-4 w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Form + Sidebar ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── LEFT: Application Form Card ── */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-10">

              {/* Card header */}
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Author Application</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Tell us about yourself and your expertise. We&apos;ll review your application and get back to you within 3–5 business days.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-10">

                {/* ─── Section 1: Personal Information ─── */}
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                    <h3 className="text-base font-bold text-gray-900">Personal Information</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="Enter your full name" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                    </div>
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                    </div>
                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                      <div className="flex">
                        <select name="phoneCode" value={formData.phoneCode} onChange={handleChange} className="px-3 py-2.5 border border-gray-300 rounded-l-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 border-r-0 w-24">
                          <option value="+234">+234</option>
                          <option value="+233">+233</option>
                          <option value="+254">+254</option>
                          <option value="+27">+27</option>
                          <option value="+1">+1</option>
                          <option value="+44">+44</option>
                          <option value="+91">+91</option>
                        </select>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="Enter your phone number" className="flex-1 px-4 py-2.5 border border-gray-300 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                      </div>
                    </div>
                    {/* Location */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Location <span className="text-red-500">*</span></label>
                      <select name="location" value={formData.location} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white">
                        <option value="">Select your country</option>
                        {COUNTRY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* ─── Section 2: Professional Information ─── */}
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    <h3 className="text-base font-bold text-gray-900">Professional Information</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Professional Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Professional Title <span className="text-red-500">*</span></label>
                      <input type="text" name="professionalTitle" value={formData.professionalTitle} onChange={handleChange} required placeholder="e.g. Software Engineer, Digital Marketer, Designer" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                    </div>
                    {/* Years of Experience */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Years of Experience <span className="text-red-500">*</span></label>
                      <select name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white">
                        <option value="">Select years of experience</option>
                        {EXPERIENCE_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                    {/* LinkedIn */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">LinkedIn Profile (Optional)</label>
                      <input type="url" name="linkedinProfile" value={formData.linkedinProfile} onChange={handleChange} placeholder="https://linkedin.com/in/yourname" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                    </div>
                    {/* Website */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Website / Portfolio (Optional)</label>
                      <input type="url" name="websitePortfolio" value={formData.websitePortfolio} onChange={handleChange} placeholder="https://yourwebsite.com" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                    </div>
                  </div>
                </div>

                {/* ─── Section 3: Areas of Expertise ─── */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                    <h3 className="text-base font-bold text-gray-900">Areas of Expertise</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 ml-10">Select the skills or topics you can teach (you can choose multiple).</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-3 ml-10">
                    {EXPERTISE_OPTIONS.map(area => (
                      <label key={area} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 select-none">
                        <input
                          type="checkbox"
                          checked={formData.expertiseAreas.includes(area)}
                          onChange={() => toggleExpertise(area)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        {area}
                      </label>
                    ))}
                  </div>
                </div>

                {/* ─── Section 4: About You ─── */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                    <h3 className="text-base font-bold text-gray-900">About You</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 ml-10">
                    Tell us about your background, experience and what you plan to teach. <span className="text-red-500">*</span>
                  </p>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Share your story, expertise and teaching goals..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* ─── Section 5: Upload Supporting Documents ─── */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                    <h3 className="text-base font-bold text-gray-900">Upload Supporting Documents</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 ml-10">
                    Please upload relevant documents to help us verify your credentials (optional but recommended).
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* CV */}
                    <button
                      type="button"
                      onClick={() => cvRef.current?.click()}
                      className="flex flex-col items-center gap-2 p-5 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors text-center"
                    >
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{cvFile ? cvFile.name : 'CV / Resume'}</span>
                      <span className="text-xs text-gray-400">PDF, DOC, DOCX (Max 5MB)</span>
                    </button>
                    <input ref={cvRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setCvFile(e.target.files?.[0] || null)} />

                    {/* Portfolio */}
                    <button
                      type="button"
                      onClick={() => portfolioRef.current?.click()}
                      className="flex flex-col items-center gap-2 p-5 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors text-center"
                    >
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-indigo-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{portfolioFile ? portfolioFile.name : 'Portfolio / Work Samples'}</span>
                      <span className="text-xs text-gray-400">PDF, ZIP (Max 10MB)</span>
                    </button>
                    <input ref={portfolioRef} type="file" accept=".pdf,.zip" className="hidden" onChange={e => setPortfolioFile(e.target.files?.[0] || null)} />

                    {/* ID */}
                    <button
                      type="button"
                      onClick={() => idRef.current?.click()}
                      className="flex flex-col items-center gap-2 p-5 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors text-center"
                    >
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <Upload className="w-5 h-5 text-indigo-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{idFile ? idFile.name : 'ID Document'}</span>
                      <span className="text-xs text-gray-400">PDF, JPG, PNG (Max 5MB)</span>
                    </button>
                    <input ref={idRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setIdFile(e.target.files?.[0] || null)} />
                  </div>
                </div>

                {/* ─── Actions ─── */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => router.push('/')} className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    ) : (
                      <>Submit Application <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-6">

            {/* Why Become an Author */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Why Become an Author?</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Turn your skills into impact and income. As an AutoLearn Spot author, you&apos;ll get:
              </p>

              <div className="space-y-5">
                {[
                  { icon: Users, color: 'bg-indigo-100 text-indigo-600', title: 'Reach a Global Audience', desc: 'Teach learners from around the world and expand your impact.' },
                  { icon: DollarSign, color: 'bg-green-100 text-green-600', title: 'Earn Competitive Revenue', desc: 'Get paid for every enrolment and grow your income over time.' },
                  { icon: Zap, color: 'bg-blue-100 text-blue-600', title: 'Easy Course Creation', desc: 'Use our simple tools to create and manage your courses.' },
                  { icon: HeadphonesIcon, color: 'bg-purple-100 text-purple-600', title: 'Full Support', desc: 'Our team is here to support you every step of the way.' },
                ].map(({ icon: Icon, color, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">How It Works</h3>
              </div>

              <div className="space-y-5">
                {[
                  { step: '1', title: 'Submit Your Application', desc: 'Fill out the form with your details and expertise.' },
                  { step: '2', title: 'Review Process', desc: 'Our team will review your application and verify your credentials.' },
                  { step: '3', title: 'Get Approved', desc: "Once approved, you'll get access to the author dashboard." },
                  { step: '4', title: 'Create & Publish', desc: 'Start creating your courses and reach learners worldwide.' },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex items-start gap-3">
                    <span className="w-7 h-7 border-2 border-indigo-200 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{step}</span>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Already an Author? */}
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-800">Already an Author?</h4>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Log in to your author dashboard to manage your courses, students and earnings.
                  </p>
                  <Link href="/author" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 mt-2 transition-colors">
                    Go to Author Dashboard <ArrowRight className="w-3.5 h-3.5" />
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