import Link from 'next/link';
import { Package, Users, DollarSign, Star, ArrowRight, Plus, TrendingUp, CreditCard, BarChart3, Wallet, ShoppingCart, Clock } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Author Dashboard Landing Page
 * Phase G: All cards use real backend data
 */
export default async function AuthorDashboardPage() {
  const { userId } = await auth();
  
  let productsCount = 0;
  let studentsCount = 0;
  let earnings = 0;
  let rating: number | null = null;
  let recentSales: { product_title: string; price_snapshot: number; created_at: string; buyer_email?: string }[] = [];

  if (userId) {
    // 1. Fetch Products count
    const { count } = await supabaseAdmin
      .from('learning_products')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', userId);
    productsCount = count || 0;

    // 2. Fetch author's product IDs (needed for students & sales)
    const { data: authorProducts } = await supabaseAdmin
      .from('learning_products')
      .select('id')
      .eq('author_id', userId);
    
    const productIds = (authorProducts || []).map(p => p.id);

    // 3. Fetch Students count — unique buyers of THIS author's products via order_items
    if (productIds.length > 0) {
      const { data: orderItems } = await supabaseAdmin
        .from('order_items')
        .select('order_id')
        .in('learning_product_id', productIds);
      
      if (orderItems && orderItems.length > 0) {
        const orderIds = [...new Set(orderItems.map(oi => oi.order_id))];
        const { data: orders } = await supabaseAdmin
          .from('orders')
          .select('user_id')
          .in('id', orderIds)
          .eq('status', 'PAID');
        
        if (orders) {
          studentsCount = new Set(orders.map(o => o.user_id)).size;
        }
      }

      // 4. Fetch Recent Sales (last 10) for activity feed
      const { data: recentOrderItems } = await supabaseAdmin
        .from('order_items')
        .select('product_title, price_snapshot, created_at, order_id')
        .in('learning_product_id', productIds)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (recentOrderItems && recentOrderItems.length > 0) {
        recentSales = recentOrderItems.map(item => ({
          product_title: item.product_title,
          price_snapshot: item.price_snapshot,
          created_at: item.created_at,
        }));
      }
    }

    // 5. Fetch Earnings from author_earnings ledger
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();
      
    if (author) {
      const { data: earningData } = await supabaseAdmin
        .from('author_earnings')
        .select('total_net')
        .eq('author_id', author.id)
        .single();
      earnings = earningData?.total_net || 0;
    }

    // 6. Rating — no reviews table exists yet, so leave as null (N/A)
    // When a reviews table is created, query average rating here
    rating = null;
  }

  const formattedEarnings = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(earnings);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/author/products" className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-sky-600" />
            <span className="text-sm font-medium text-brand-text/70">Products</span>
          </div>
          <p className="text-3xl font-bold text-brand-text">{productsCount}</p>
        </Link>

        <Link href="/author/students" className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-sky-600" />
            <span className="text-sm font-medium text-brand-text/70">Students</span>
          </div>
          <p className="text-3xl font-bold text-brand-text">{studentsCount}</p>
        </Link>

        <Link href="/author/earnings" className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-sky-600" />
            <span className="text-sm font-medium text-brand-text/70">Earnings</span>
          </div>
          <p className="text-3xl font-bold text-brand-text">{formattedEarnings}</p>
        </Link>

        <div className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium text-brand-text/70">Rating</span>
          </div>
          <p className="text-3xl font-bold text-brand-text">
            {rating !== null ? rating.toFixed(1) : 'N/A'}
          </p>
          {rating === null && (
            <p className="text-xs text-brand-text/50 mt-1">No reviews yet</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-brand-text mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/author/products/new"
            className="p-5 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <Plus className="w-5 h-5 text-sky-600" />
              <h3 className="font-semibold text-brand-text text-sm">Create New Product</h3>
            </div>
            <p className="text-xs text-brand-text/70 mb-2">
              Start creating a new course or learning product
            </p>
            <span className="text-sky-600 text-xs font-medium flex items-center gap-1">
              Create Product
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/author/products"
            className="p-5 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-sky-600" />
              <h3 className="font-semibold text-brand-text text-sm">Manage Products</h3>
            </div>
            <p className="text-xs text-brand-text/70 mb-2">
              View and edit your existing products
            </p>
            <span className="text-sky-600 text-xs font-medium flex items-center gap-1">
              Go to Products
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/author/students"
            className="p-5 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-sky-600" />
              <h3 className="font-semibold text-brand-text text-sm">View Students</h3>
            </div>
            <p className="text-xs text-brand-text/70 mb-2">
              See students enrolled in your courses
            </p>
            <span className="text-sky-600 text-xs font-medium flex items-center gap-1">
              Go to Students
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/author/earnings"
            className="p-5 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-5 h-5 text-sky-600" />
              <h3 className="font-semibold text-brand-text text-sm">View Earnings</h3>
            </div>
            <p className="text-xs text-brand-text/70 mb-2">
              Track your revenue and financial summary
            </p>
            <span className="text-sky-600 text-xs font-medium flex items-center gap-1">
              Go to Earnings
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/author/analytics"
            className="p-5 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-sky-600" />
              <h3 className="font-semibold text-brand-text text-sm">Analytics</h3>
            </div>
            <p className="text-xs text-brand-text/70 mb-2">
              View product performance and insights
            </p>
            <span className="text-sky-600 text-xs font-medium flex items-center gap-1">
              Go to Analytics
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/author/settings"
            className="p-5 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-5 h-5 text-sky-600" />
              <h3 className="font-semibold text-brand-text text-sm">Bank & Withdrawals</h3>
            </div>
            <p className="text-xs text-brand-text/70 mb-2">
              Manage payout details and request withdrawals
            </p>
            <span className="text-sky-600 text-xs font-medium flex items-center gap-1">
              Go to Settings
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
        <h2 className="text-lg font-semibold text-brand-text mb-4">
          Recent Activity
        </h2>
        {recentSales.length > 0 ? (
          <div className="space-y-3">
            {recentSales.map((sale, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-brand-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-text">{sale.product_title}</p>
                    <div className="flex items-center gap-1.5 text-xs text-brand-text/50">
                      <Clock className="w-3 h-3" />
                      {new Date(sale.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <span className="text-sm font-bold text-green-600">
                  +{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(sale.price_snapshot)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp className="w-12 h-12 text-neutral-300 mb-3" />
            <p className="text-brand-text/70 text-sm">
              No recent activity to show
            </p>
            <p className="text-brand-text/50 text-xs mt-1">
              Your sales and student activity will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
