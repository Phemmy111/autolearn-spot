import Link from 'next/link';
import { Package, Users, DollarSign, BarChart3, ArrowRight, Plus } from 'lucide-react';

/**
 * Author Dashboard Landing Page
 * 
 * Clean author dashboard with navigation to management areas.
 * Will be connected to backend data in future phases.
 */
export default function AuthorDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-brand-text mb-2">
          Author Studio
        </h1>
        <p className="text-brand-text/70">
          Manage your courses and track your performance
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-sky-600" />
            <span className="text-sm font-medium text-brand-text/70">Products</span>
          </div>
          <p className="text-3xl font-bold text-brand-text">0</p>
        </div>

        <div className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-sky-600" />
            <span className="text-sm font-medium text-brand-text/70">Students</span>
          </div>
          <p className="text-3xl font-bold text-brand-text">0</p>
        </div>

        <div className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-sky-600" />
            <span className="text-sm font-medium text-brand-text/70">Earnings</span>
          </div>
          <p className="text-3xl font-bold text-brand-text">₦0</p>
        </div>

        <div className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            <span className="text-sm font-medium text-brand-text/70">Rating</span>
          </div>
          <p className="text-3xl font-bold text-brand-text">0.0</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-brand-text mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/author/products/new"
            className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <Plus className="w-6 h-6 text-sky-600" />
              <h3 className="font-semibold text-brand-text">Create New Product</h3>
            </div>
            <p className="text-sm text-brand-text/70 mb-3">
              Start creating a new course or learning product
            </p>
            <span className="text-sky-600 text-sm font-medium flex items-center gap-1">
              Create Product
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/author/products"
            className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-6 h-6 text-sky-600" />
              <h3 className="font-semibold text-brand-text">Manage Products</h3>
            </div>
            <p className="text-sm text-brand-text/70 mb-3">
              View and edit your existing products
            </p>
            <span className="text-sky-600 text-sm font-medium flex items-center gap-1">
              Go to Products
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>

      {/* Empty State for Recent Activity */}
      <div className="p-8 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
        <h2 className="text-lg font-semibold text-brand-text mb-4">
          Recent Activity
        </h2>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BarChart3 className="w-12 h-12 text-neutral-300 mb-3" />
          <p className="text-brand-text/70">
            No recent activity to show
          </p>
        </div>
      </div>
    </div>
  );
}
