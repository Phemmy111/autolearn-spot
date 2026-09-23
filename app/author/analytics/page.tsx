import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { BarChart3, TrendingUp, Users, Package, DollarSign, Activity } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AuthorAnalyticsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  // 1. Fetch author ID first
  const { data: author } = await supabaseAdmin
    .from('authors')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (!author) {
    return (
      <div className="p-8 text-center text-brand-text/60">
        Author profile not found.
      </div>
    );
  }

  // 2. Fetch author's products
  const { data: products } = await supabaseAdmin
    .from('learning_products')
    .select('id, title, status, price')
    .eq('author_id', author.id);

  const productIds = (products || []).map(p => p.id);
  const totalProducts = productIds.length;
  const publishedProducts = (products || []).filter(p => p.status === 'PUBLISHED').length;

  // 2. Fetch sales data (order_items)
  let totalSales = 0;
  let totalRevenue = 0;
  let studentsCount = 0;
  let recentSales: any[] = [];
  
  // Product performance mapping
  const productPerformance: Record<string, { title: string; sales: number; revenue: number; status: string }> = {};
  
  (products || []).forEach(p => {
    productPerformance[p.id] = { title: p.title, sales: 0, revenue: 0, status: p.status };
  });

  if (productIds.length > 0) {
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('learning_product_id, price_snapshot, created_at, order_id')
      .in('learning_product_id', productIds);
      
    if (orderItems && orderItems.length > 0) {
      // Find valid paid orders
      const orderIds = [...new Set(orderItems.map(oi => oi.order_id))];
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('id, user_id')
        .in('id', orderIds)
        .eq('status', 'PAID');
        
      if (orders) {
        const validOrderIds = new Set(orders.map(o => o.id));
        studentsCount = new Set(orders.map(o => o.user_id)).size;
        
        // Filter items that belong to paid orders
        const paidItems = orderItems.filter(oi => validOrderIds.has(oi.order_id));
        
        totalSales = paidItems.length;
        
        paidItems.forEach(item => {
          totalRevenue += Number(item.price_snapshot || 0);
          if (productPerformance[item.learning_product_id]) {
            productPerformance[item.learning_product_id].sales += 1;
            productPerformance[item.learning_product_id].revenue += Number(item.price_snapshot || 0);
          }
        });
        
        recentSales = paidItems
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
      }
    }
  }

  const performanceList = Object.values(productPerformance).sort((a, b) => b.revenue - a.revenue);
  const topProduct = performanceList.length > 0 && performanceList[0].sales > 0 ? performanceList[0] : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-text mb-2">Analytics</h1>
        <p className="text-brand-text/70">
          Track your course performance, sales, and student engagement.
        </p>
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-brand-text/70">Total Revenue</span>
          </div>
          <p className="text-3xl font-bold text-brand-text">
            {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(totalRevenue)}
          </p>
        </div>
        
        <div className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-sky-600" />
            <span className="text-sm font-medium text-brand-text/70">Total Sales</span>
          </div>
          <p className="text-3xl font-bold text-brand-text">{totalSales}</p>
        </div>
        
        <div className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-sky-600" />
            <span className="text-sm font-medium text-brand-text/70">Unique Students</span>
          </div>
          <p className="text-3xl font-bold text-brand-text">{studentsCount}</p>
        </div>

        <div className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-sky-600" />
            <span className="text-sm font-medium text-brand-text/70">Published Courses</span>
          </div>
          <p className="text-3xl font-bold text-brand-text">{publishedProducts} <span className="text-lg text-brand-text/50 font-normal">/ {totalProducts}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Performance Table */}
        <div className="lg:col-span-2 p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
          <h2 className="text-lg font-semibold text-brand-text mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            Product Performance
          </h2>
          
          {performanceList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-brand-border text-sm text-brand-text/60">
                    <th className="pb-3 font-medium">Course</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                    <th className="pb-3 font-medium text-right">Sales</th>
                    <th className="pb-3 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border text-sm">
                  {performanceList.map((perf, idx) => (
                    <tr key={idx} className="hover:bg-brand-bg/50 transition-colors">
                      <td className="py-4 font-medium text-brand-text">{perf.title}</td>
                      <td className="py-4 text-center">
                        <span className={"px-2 py-1 text-[10px] uppercase font-bold rounded-full " + (perf.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')}>
                          {perf.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 text-right text-brand-text">{perf.sales}</td>
                      <td className="py-4 text-right font-medium text-emerald-600">
                        {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(perf.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-brand-text/60">No products created yet.</p>
              <Link href="/author/products/new" className="text-sky-600 font-medium text-sm hover:underline mt-2 inline-block">
                Create your first product
              </Link>
            </div>
          )}
        </div>

        {/* Highlights Sidebar */}
        <div className="space-y-6">
          <div className="p-6 bg-brand-bg border border-brand-border rounded-lg">
            <h3 className="text-sm font-semibold text-brand-text/60 uppercase tracking-wider mb-4">Top Performing Course</h3>
            {topProduct ? (
              <div>
                <p className="font-bold text-brand-text mb-2 line-clamp-2">{topProduct.title}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-brand-text/60 mb-1">Revenue</p>
                    <p className="text-xl font-bold text-emerald-600">
                      {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(topProduct.revenue)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-brand-text/60 mb-1">Sales</p>
                    <p className="text-xl font-bold text-brand-text">{topProduct.sales}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Activity className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-brand-text/60">No sales data yet</p>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-brand-bg border border-brand-border rounded-lg">
            <h3 className="text-sm font-semibold text-brand-text/60 uppercase tracking-wider mb-4">Student Completion</h3>
            <div className="text-center py-6">
              <p className="text-sm text-brand-text/60 mb-2">Detailed progress tracking</p>
              <span className="inline-block px-3 py-1 bg-sky-100 text-sky-700 text-xs font-semibold rounded-full">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
