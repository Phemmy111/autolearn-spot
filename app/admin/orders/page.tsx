import React from 'react';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import OrdersTableClient from './OrdersTableClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminOrdersPage() {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/');
  }

  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, order_ref, provider_ref, customer_name, customer_email, currency, total, status, paid_at, created_at')
    .order('created_at', { ascending: false });

  const safeOrders = orders || [];

  return (
    <div className="min-h-screen p-8 text-brand-text bg-brand-bg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold capitalize">Orders & Payments</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review checkout transactions, verify Paystack bank transfers, and resend confirmation emails.
          </p>
        </div>
      </div>
      <OrdersTableClient initialOrders={safeOrders} />
    </div>
  );
}
