import Link from 'next/link';
import { ShoppingBag, BookOpen, Users, TrendingUp, ArrowRight } from 'lucide-react';

/**
 * Public Landing Page
 * 
 * Clean, premium landing page for the new AutoLearn Spot marketplace.
 * Modern design with clear navigation to all areas.
 */
export default function PublicLandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-white py-20 lg:py-32">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-6xl font-bold text-neutral-900 mb-6 leading-tight">
              Master Digital Skills with Premium Courses
            </h1>
            <p className="text-lg text-neutral-600 mb-8 leading-relaxed">
              Learn from industry experts and advance your career with our curated marketplace of digital skills courses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Browse Marketplace
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/skills"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-primary-600 text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
              >
                Explore Skills
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Why Choose AutoLearn Spot?
            </h2>
            <p className="text-lg text-neutral-600">
              Premium learning experience designed for your success
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-neutral-50 rounded-lg">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Expert-Led Courses
              </h3>
              <p className="text-neutral-600">
                Learn from industry professionals with real-world experience
              </p>
            </div>

            <div className="p-6 bg-neutral-50 rounded-lg">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Active Community
              </h3>
              <p className="text-neutral-600">
                Connect with fellow learners and instructors
              </p>
            </div>

            <div className="p-6 bg-neutral-50 rounded-lg">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Career Growth
              </h3>
              <p className="text-neutral-600">
                Build skills that employers value and advance your career
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="container mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-lg text-primary-100 mb-8">
            Join thousands of students already learning on AutoLearn Spot
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Get Started Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Portal Links */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Access Your Portal
            </h2>
            <p className="text-lg text-neutral-600">
              Already have an account? Access your learning or author portal
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link
              href="/student"
              className="p-8 bg-white border border-neutral-200 rounded-lg hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900">
                  Student Portal
                </h3>
              </div>
              <p className="text-neutral-600 mb-4">
                Access your courses, track progress, and manage your learning journey
              </p>
              <span className="text-primary-600 font-medium flex items-center gap-2">
                Go to Student Portal
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <Link
              href="/author"
              className="p-8 bg-white border border-neutral-200 rounded-lg hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900">
                  Author Studio
                </h3>
              </div>
              <p className="text-neutral-600 mb-4">
                Create and manage your courses, track earnings, and engage with students
              </p>
              <span className="text-primary-600 font-medium flex items-center gap-2">
                Go to Author Studio
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}