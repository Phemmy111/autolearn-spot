"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2, ArrowRight, GraduationCap, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import Image from 'next/image';

/**
 * Minimal Professional Author Application Page
 *
 * Clean, minimal split-screen design matching reference image.
 * Simple, professional, no heavy decorative elements.
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
      <div className="min-h-screen bg-white">
        <div className="flex min-h-screen">
          {/* Left Hero Section - Minimal */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 flex flex-col justify-center items-center p-16 relative">
            <div className="max-w-lg text-center">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                Become an Instructor
              </h1>
              <p className="text-lg text-white/90 leading-relaxed">
                Join our team of experts and start teaching on AutoLearn Spot
              </p>
            </div>
          </div>

          {/* Right Auth Section */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-neutral-50">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                  Get Started
                </h2>

                <div className="space-y-4">
                  <button
                    onClick={() => router.push('/sign-up')}
                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <UserPlus className="mr-2 w-5 h-5" />
                    Create Account
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-neutral-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-neutral-500">or</span>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push('/sign-in')}
                    className="w-full inline-flex items-center justify-center px-6 py-3 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    <LogIn className="mr-2 w-5 h-5" />
                    Sign In
                  </button>
                </div>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="text-sm text-neutral-600 hover:text-indigo-600 transition-colors"
                  >
                    Return to home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (existingApplication) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                Application Status
              </h1>
            </div>
            <div className="bg-neutral-50 rounded-xl p-6 mb-6">
              <p className="text-sm text-neutral-600 mb-2">
                <strong>Status:</strong>{' '}
                <span className="capitalize text-indigo-600 font-semibold">
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
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
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
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                Application Submitted!
              </h1>
              <p className="text-neutral-600">
                Thank you for your interest in becoming an instructor. We will review your application and get back to you soon.
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
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
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen">
        {/* Left Hero Section - Minimal */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 flex flex-col justify-center items-center p-16 relative">
          <div className="max-w-lg text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              Become an Instructor
            </h1>
            <p className="text-lg text-white/90 leading-relaxed">
              Join our team of experts and start teaching on AutoLearn Spot
            </p>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-neutral-50">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                Application Form
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="expertiseArea" className="block text-sm font-medium text-neutral-700 mb-2">
                    Area of Expertise
                  </label>
                  <select
                    id="expertiseArea"
                    name="expertiseArea"
                    value={formData.expertiseArea}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
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
                  <label htmlFor="portfolioLink" className="block text-sm font-medium text-neutral-700 mb-2">
                    Portfolio Link (Optional)
                  </label>
                  <input
                    type="url"
                    id="portfolioLink"
                    name="portfolioLink"
                    value={formData.portfolioLink}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    placeholder="https://yourportfolio.com"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-neutral-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none"
                    placeholder="Tell us about yourself and your experience"
                  />
                </div>

                <div>
                  <label htmlFor="whyBecomeAuthor" className="block text-sm font-medium text-neutral-700 mb-2">
                    Why do you want to become an instructor?
                  </label>
                  <textarea
                    id="whyBecomeAuthor"
                    name="whyBecomeAuthor"
                    value={formData.whyBecomeAuthor}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none"
                    placeholder="Share your motivation for creating courses on AutoLearn Spot"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="text-sm text-neutral-600 hover:text-indigo-600 transition-colors"
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