import Link from 'next/link';
import { Package, Users, DollarSign, Star, ArrowRight, Plus, TrendingUp, CreditCard, BarChart3, Wallet, ShoppingCart, Clock, MessageSquare, Award, BookOpen, FileText, Calendar, Upload, ArrowUpCircle } from 'lucide-react';
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
  let recentSales: { type: string; title: string; amount?: number; created_at: string; subtitle?: string }[] = [];

  if (userId) {
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .maybeSingle();
      
    if (!author) return null; // or handle empty state better? Wait, we can just use author.id safely if author exists
    
    const internalAuthorId = author.id;
    // 1. Fetch Products count
    const { count } = await supabaseAdmin
      .from('learning_products')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', internalAuthorId);
    productsCount = count || 0;

    // 2. Fetch author's product IDs (needed for students & sales)
    const { data: authorProducts } = await supabaseAdmin
      .from('learning_products')
      .select('id')
      .eq('author_id', internalAuthorId);
    
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

      // 4. Fetch Recent Activities (sales, certificates, product actions, etc.)
      const activities: any[] = [];

      // Sales
      const { data: recentOrderItems } = await supabaseAdmin
        .from('order_items')
        .select('product_title, price_snapshot, created_at, order_id')
        .in('learning_product_id', productIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentOrderItems) {
        recentOrderItems.forEach(item => {
          activities.push({
            type: 'sale',
            title: item.product_title,
            amount: item.price_snapshot,
            created_at: item.created_at,
          });
        });
      }

      // Product published/updated
      const { data: recentProducts } = await supabaseAdmin
        .from('learning_products')
        .select('id, title, created_at, updated_at, status')
        .eq('author_id', authorId)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (recentProducts) {
        recentProducts.forEach(product => {
          if (product.status === 'published') {
            activities.push({
              type: 'product_published',
              title: `Published: ${product.title}`,
              created_at: product.updated_at,
            });
          }
        });
      }

      // Withdrawal requests
      const { data: recentWithdrawals } = await supabaseAdmin
        .from('withdrawals')
        .select('id, amount, status, created_at')
        .eq('author_id', authorId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentWithdrawals) {
        recentWithdrawals.forEach(withdrawal => {
          activities.push({
            type: 'withdrawal',
            title: `Withdrawal request - ${withdrawal.status}`,
            amount: withdrawal.amount,
            created_at: withdrawal.created_at,
          });
        });
      }

      // Quizzes created
      const { data: recentQuizzes } = await supabaseAdmin
        .from('quizzes')
        .select('id, title, created_at')
        .eq('author_id', authorId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentQuizzes) {
        recentQuizzes.forEach(quiz => {
          activities.push({
            type: 'quiz',
            title: `Created quiz: ${quiz.title}`,
            created_at: quiz.created_at,
          });
        });
      }

      // Assignments created
      const { data: recentAssignments } = await supabaseAdmin
        .from('assignments')
        .select('id, title, created_at')
        .eq('author_id', authorId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentAssignments) {
        recentAssignments.forEach(assignment => {
          activities.push({
            type: 'assignment',
            title: `Created assignment: ${assignment.title}`,
            created_at: assignment.created_at,
          });
        });
      }

      // Live classes scheduled
      const { data: recentLiveClasses } = await supabaseAdmin
        .from('live_schedules')
        .select('id, title, scheduled_at, created_at')
        .eq('author_id', authorId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentLiveClasses) {
        recentLiveClasses.forEach(liveClass => {
          activities.push({
            type: 'live_class',
            title: `Scheduled live class: ${liveClass.title}`,
            created_at: liveClass.created_at,
          });
        });
      }

      // Certificates issued for author's products
      const { data: recentCertificates } = await supabaseAdmin
        .from('certificates')
        .select('id, user_name, user_email, issued_at, cohort_id, cohorts(learning_products(id, author_id))')
        .order('issued_at', { ascending: false })
        .limit(10);

      if (recentCertificates) {
        recentCertificates.forEach(cert => {
          const authorProduct = cert.cohorts?.learning_products?.author_id === authorId;
          if (authorProduct) {
            activities.push({
              type: 'certificate',
              title: `${cert.user_name || cert.user_email} earned a certificate`,
              created_at: cert.issued_at,
            });
          }
        });
      }

      // Sort all activities by date
      recentSales = activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);
    }

    // 5. Fetch Earnings from author_earnings ledger
    // author is already fetched at the top of the block
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
            {recentSales.map((activity, idx) => {
              const isSale = activity.type === 'sale';
              const isCertificate = activity.type === 'certificate';
              const isProductPublished = activity.type === 'product_published';
              const isWithdrawal = activity.type === 'withdrawal';
              const isQuiz = activity.type === 'quiz';
              const isAssignment = activity.type === 'assignment';
              const isLiveClass = activity.type === 'live_class';

              const getIconAndColor = () => {
                if (isSale) return { icon: ShoppingCart, color: 'bg-green-50', iconColor: 'text-green-600' };
                if (isCertificate) return { icon: Award, color: 'bg-yellow-50', iconColor: 'text-yellow-600' };
                if (isProductPublished) return { icon: Upload, color: 'bg-blue-50', iconColor: 'text-blue-600' };
                if (isWithdrawal) return { icon: ArrowUpCircle, color: 'bg-purple-50', iconColor: 'text-purple-600' };
                if (isQuiz) return { icon: BookOpen, color: 'bg-orange-50', iconColor: 'text-orange-600' };
                if (isAssignment) return { icon: FileText, color: 'bg-pink-50', iconColor: 'text-pink-600' };
                if (isLiveClass) return { icon: Calendar, color: 'bg-cyan-50', iconColor: 'text-cyan-600' };
                return { icon: TrendingUp, color: 'bg-gray-50', iconColor: 'text-gray-600' };
              };

              const { icon: Icon, color, iconColor } = getIconAndColor();

              return (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-brand-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className={`w-4 h-4 ${iconColor}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-brand-text">{activity.title}</p>
                      <div className="flex items-center gap-1.5 text-xs text-brand-text/50 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(activity.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  {isSale && (
                    <span className="text-sm font-bold text-green-600">
                      +{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(activity.amount)}
                    </span>
                  )}
                  {isWithdrawal && (
                    <span className="text-sm font-bold text-purple-600">
                      {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(activity.amount)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp className="w-12 h-12 text-neutral-300 mb-3" />
            <p className="text-brand-text/70 text-sm">
              No recent activity to show
            </p>
            <p className="text-brand-text/50 text-xs mt-1">
              Your sales, products, quizzes, and activities will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
