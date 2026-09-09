import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';

/**
 * Author Application Page
 * 
 * Landing page for users who want to become authors.
 * Will be connected to backend application flow in future phases.
 */
export default function AuthorApplyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="max-w-2xl w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Become an Author
            </h1>
            <p className="text-neutral-600">
              Share your expertise and earn by creating courses on AutoLearn Spot
            </p>
          </div>

          <div className="space-y-6 mb-8">
            <div className="p-4 bg-neutral-50 rounded-lg">
              <h3 className="font-semibold text-neutral-900 mb-2">
                Why Become an Author?
              </h3>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>• Earn revenue from your courses</li>
                <li>• Reach a global audience of learners</li>
                <li>• Build your personal brand</li>
                <li>• Access powerful author tools</li>
              </ul>
            </div>

            <div className="p-4 bg-neutral-50 rounded-lg">
              <h3 className="font-semibold text-neutral-900 mb-2">
                Requirements
              </h3>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>• Expertise in your field</li>
                <li>• Ability to create high-quality content</li>
                <li>• Commitment to student success</li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <p className="text-neutral-600 mb-4">
              Author applications are currently under review. Check back soon to apply.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Return to Home
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}