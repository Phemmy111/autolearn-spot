import React from 'react';
import { User, BookOpen, Calendar, CreditCard, Users } from 'lucide-react';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { ManualEnrollmentForm } from './ManualEnrollmentForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminStudentsPage() {
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

  return (
    <div className="min-h-screen p-8 text-brand-text bg-brand-bg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold capitalize">Product Purchasers</h1>
        <div className="flex items-center gap-2 text-sm text-brand-text/60">
          <Users className="h-4 w-4" />
          <span>{purchasers.length} total purchasers</span>
        </div>
      </div>
      
      <ManualEnrollmentForm />
      
      <div className="bg-[var(--card)] brightness-95 rounded-2xl p-6 shadow-sm border border-gray-100 overflow-x-auto">
        {purchasers.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="p-4 font-medium">Name &amp; Email</th>
                <th className="p-4 font-medium">Products</th>
                <th className="p-4 font-medium">Purchases</th>
                <th className="p-4 font-medium">Total Amount</th>
                <th className="p-4 font-medium">Latest Purchase</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {purchasers.map((item, idx) => (
                <tr key={item.id || idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <div className="flex flex-col">
                        <span className="text-sm">{item.courses.length} product{item.courses.length !== 1 ? 's' : ''}</span>
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">
                          {item.courses.slice(0, 2).join(', ')}
                          {item.courses.length > 2 && '...'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-gray-700">{item.purchases}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      <span>₦{item.totalAmount.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{new Date(item.latestPurchase).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${ 
                      item.status === 'PAID' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-brand-text/60 mb-2">No product purchasers found.</p>
            <p className="text-sm text-brand-text/40">
              Purchasers will appear here once they buy products.
              Use the form above to manually enroll students.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
