import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { EnrollmentsTable } from '@/components/admin/EnrollmentsTable';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminEnrollmentsPage() {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/');
  }

  // Fetch product purchasers from orders and order_items
  const { data: orderItems, error } = await supabaseAdmin
    .from('order_items')
    .select(`
      id,
      product_title,
      price_snapshot,
      created_at,
      order_id,
      orders!inner(
        id,
        user_id,
        customer_name,
        customer_email,
        status
      )
    `)
    .eq('orders.status', 'PAID')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching orders:', error);
  }

  const safeOrderItems = orderItems || [];

  // Get unique purchasers (by user_id or customer_email)
  const purchasersMap = new Map();
  
  safeOrderItems.forEach(item => {
    const userId = item.orders.user_id || item.orders.customer_email;
    const userName = item.orders.customer_name || 'Unknown';
    const userEmail = item.orders.customer_email || item.orders.user_id || 'Unknown';
    
    if (!purchasersMap.has(userId)) {
      purchasersMap.set(userId, {
        id: userId,
        name: userName,
        email: userEmail,
        courses: [item.product_title],
        totalAmount: item.price_snapshot || 0,
        purchases: 1,
        latestPurchase: item.created_at,
        status: item.orders.status
      });
    } else {
      // Add additional courses to existing purchaser
      const purchaser = purchasersMap.get(userId);
      
      if (!purchaser.courses.includes(item.product_title)) {
        purchaser.courses.push(item.product_title);
      }
      purchaser.totalAmount += (item.price_snapshot || 0);
      purchaser.purchases += 1;
      
      // Update to latest purchase date
      if (item.created_at > purchaser.latestPurchase) {
        purchaser.latestPurchase = item.created_at;
      }
    }
  });

  const purchasers = Array.from(purchasersMap.values());

  const summary = {
    total: purchasers.length,
    revenue: purchasers.reduce((sum, p) => sum + p.totalAmount, 0) / 100
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-brand-text/70 hover:text-brand-text font-mono text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-[#10b981]" />
            <h1 className="font-heading text-4xl font-bold text-brand-text">Product Purchasers</h1>
          </div>
          <p className="font-mono text-sm text-brand-text/70 max-w-2xl mt-4">
            View all product purchasers and their purchase history.
          </p>
        </div>

        <EnrollmentsTable 
          initialEnrollments={purchasers.map(p => ({
            ...p,
            is_pending: false,
            display_status: p.status === 'PAID' ? 'Paid' : p.status,
            amount_paid: p.totalAmount
          }))} 
          summary={summary}
        />
      </div>
    </div>
  );
}
