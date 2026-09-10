"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2, ArrowRight, Sparkles, GraduationCap, Users, TrendingUp, Shield } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import Image from 'next/image';

/**
 * Professional Author Application Page
 *
 * Split-screen design with dark hero section and clean form area.
 * Matches professional design standards with proper contrast and visual hierarchy.
 */
export default function AuthorApplyPage() {
  const { isSignedIn, user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || user?.firstName || '',
    email: user?.emailAddresses?.[0]?.emailAddress || '',
    expertiseArea: '',
    portfolioLink: '',
    bio: '',
    whyBecomeAuthor: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/author-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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

  // Check for existing application on mount
  useState(() => {
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
  });

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="w-20 h-20 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10 text-sky-600" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-3">
            Sign In Required
          </h1>
          <p className="text-neutral-600 mb-8">
            Please sign in to apply to become an author
          </p>
          <button
            onClick={() => router.push('/sign-in')}
            className="inline-flex items-center justify-center px-8 py-4 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (existingApplication) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                Application Status
              </h1>
            </div>
            <div className="bg-neutral-50 rounded-xl p-6 mb-6">
              <p className="text-sm text-neutral-600 mb-2">
                <strong>Status:</strong>{' '}
                <span className="capitalize text-sky-600 font-semibold">
                  {existingApplication.status.replace('_', ' ')}
                </span>
              </p>
              <p className="text-sm text-neutral-600">
                <strong>Submitted:</strong>{' '}
                {new Date(existingApplication.submitted_at).toLocaleDateString()}
              </p>
            </div>
            <p className="text-sm text-neutral-600 text-center mb-6">
              {existingApplication.status === 'SUBMITTED' && 'Your application is under review. We will notify you of any status changes.'}
              {existingApplication.status === 'UNDER_REVIEW' && 'Your application is currently being reviewed by our team.'}
              {existingApplication.status === 'APPROVED' && 'Congratulations! Your application has been approved. Check your email for login details.'}
              {existingApplication.status === 'DECLINED' && 'Unfortunately, your application was not approved at this time.'}
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 transition-all duration-200"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                Application Submitted!
              </h1>
              <p className="text-neutral-600">
                Thank you for your interest in becoming an author. We will review your application and get back to you soon.
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 transition-all duration-200"
            >
              Return to Home
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="flex min-h-screen">
        {/* Left Hero Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex-col justify-between p-12 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 bg-sky-500 rounded-full filter blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl" />
          </div>

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center">
                <Image
                  src="/autolearn-brandmark.png"
                  alt="AutoLearn Spot"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <span className="text-2xl font-bold text-white">AutoLearn Spot</span>
            </div>

            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
              Join Our<br />
              <span className="text-sky-400">Creator Community</span>
            </h1>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              Share your expertise with thousands of learners worldwide. Create impactful courses and build your digital brand.
            </p>
          </div>

          {/* Benefits */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-sky-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Earn Revenue</h3>
                <p className="text-slate-400 text-sm">Monetize your expertise through course sales</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Global Reach</h3>
                <p className="text-slate-400 text-sm">Connect with learners from around the world</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Professional Tools</h3>
                <p className="text-slate-400 text-sm">Access powerful course creation and management tools</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-lg">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
                <Image
                  src="/autolearn-brandmark.png"
                  alt="AutoLearn Spot"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold text-neutral-900">AutoLearn Spot</span>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                  Become an Author
                </h1>
                <p className="text-neutral-600">
                  Start your journey as a course creator
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold text-neutral-900 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-neutral-50 focus:bg-white transition-all duration-200"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-neutral-900 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-neutral-50 focus:bg-white transition-all duration-200"
                    placeholder="Enter your email address"
                  />
                </div>

                <div>
                  <label htmlFor="expertiseArea" className="block text-sm font-semibold text-neutral-900 mb-2">
                    Area of Expertise *
                  </label>
                  <select
                    id="expertiseArea"
                    name="expertiseArea"
                    value={formData.expertiseArea}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-neutral-50 focus:bg-white transition-all duration-200"
                  >
                    <option value="">Select your expertise area</option>
                    <option value="Programming">Programming</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Business">Business</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Finance">Finance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="portfolioLink" className="block text-sm font-semibold text-neutral-900 mb-2">
                    Portfolio Link (Optional)
                  </label>
                  <input
                    type="url"
                    id="portfolioLink"
                    name="portfolioLink"
                    value={formData.portfolioLink}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-neutral-50 focus:bg-white transition-all duration-200"
                    placeholder="https://yourportfolio.com"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-semibold text-neutral-900 mb-2">
                    Bio *
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-neutral-50 focus:bg-white transition-all duration-200 resize-none"
                    placeholder="Tell us about yourself and your experience"
                  />
                </div>

                <div>
                  <label htmlFor="whyBecomeAuthor" className="block text-sm font-semibold text-neutral-900 mb-2">
                    Why do you want to become an author? *
                  </label>
                  <textarea
                    id="whyBecomeAuthor"
                    name="whyBecomeAuthor"
                    value={formData.whyBecomeAuthor}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-neutral-50 focus:bg-white transition-all duration-200 resize-none"
                    placeholder="Share your motivation for creating courses on AutoLearn Spot"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold rounded-xl hover:from-sky-600 hover:to-sky-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="text-sm text-neutral-600 hover:text-sky-600 transition-colors font-medium"
                >
                  Cancel and return to home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}