import { BookOpen, Tag } from 'lucide-react';

/**
 * Skills Landing Page
 * 
 * Clean skills listing page with placeholder for skill categories.
 * Will be connected to backend data in future phases.
 */
export default function SkillsPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gray-100 border-b border-neutral-200">
        <div className="container mx-auto px-6 lg:px-12 py-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Skills
          </h1>
          <p className="text-neutral-600">
            Browse digital skills by category
          </p>
        </div>
      </div>

      {/* Empty State */}
      <div className="container mx-auto px-6 lg:px-12 py-12">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
            <Tag className="w-8 h-8 text-neutral-400" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            Skills Categories Coming Soon
          </h2>
          <p className="text-neutral-600 max-w-md">
            We're organizing skills into helpful categories. Check back soon to explore our comprehensive skill library.
          </p>
        </div>
      </div>
    </div>
  );
}
