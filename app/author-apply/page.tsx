"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

/**
 * Author Application Page
 *
 * Form for users to apply to become authors on AutoLearn Spot.
 * Collects necessary information for admin review.
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
          <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-sky-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Sign In Required
          </h1>
          <p className="text-neutral-600 mb-6">
            Please sign in to apply to become an author
          </p>
          <button
            onClick={() => router.push('/sign-in')}
            className="inline-flex items-center justify-center px-6 py-3 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 transition-colors"
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
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-sky-600" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                Application Status
              </h1>
            </div>
            <div className="bg-neutral-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-neutral-600 mb-2">
                <strong>Status:</strong>{' '}
                <span className="capitalize">{existingApplication.status}</span>
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
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 transition-colors"
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
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
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
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 transition-colors"
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
    <div className="min-h-screen bg-neutral-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-sky-600" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Become an Author
            </h1>
            <p className="text-neutral-600">
              Share your expertise and earn by creating courses on AutoLearn Spot
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label htmlFor="expertiseArea" className="block text-sm font-medium text-neutral-700 mb-2">
                Area of Expertise *
              </label>
              <select
                id="expertiseArea"
                name="expertiseArea"
                value={formData.expertiseArea}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="https://yourportfolio.com"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-neutral-700 mb-2">
                Bio *
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                placeholder="Tell us about yourself and your experience"
              />
            </div>

            <div>
              <label htmlFor="whyBecomeAuthor" className="block text-sm font-medium text-neutral-700 mb-2">
                Why do you want to become an author? *
              </label>
              <textarea
                id="whyBecomeAuthor"
                name="whyBecomeAuthor"
                value={formData.whyBecomeAuthor}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                placeholder="Share your motivation for creating courses on AutoLearn Spot"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="text-sm text-neutral-600 hover:text-sky-600 transition-colors"
            >
              Cancel and return to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}