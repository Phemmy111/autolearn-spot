"use client";

import React, { useState } from 'react';
import { ShoppingCart, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface OrderItem {
  id: string;
  order_ref: string;
  provider_ref?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  currency?: string | null;
  total?: number | null;
  status: string;
  paid_at?: string | null;
  created_at: string;
}

export default function OrdersTableClient({ initialOrders }: { initialOrders: OrderItem[] }) {
  const [orders, setOrders] = useState<OrderItem[]>(initialOrders);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResync = async (order: OrderItem) => {
    const ref = order.provider_ref || order.order_ref;
    if (!ref) {
      setMessage({ type: 'error', text: 'No reference found for this order.' });
      return;
    }

    setSyncingId(order.id);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/payments/resync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: ref }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to verify payment with Paystack');
      }

      setMessage({ type: 'success', text: `Order ${order.order_ref} verified and synced successfully! Confirmation emails sent.` });
      // Update local status
      setOrders(prev =>
        prev.map(o => (o.id === order.id ? { ...o, status: 'PAID', paid_at: new Date().toISOString() } : o))
      );
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error syncing order' });
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-[var(--card)] brightness-95 rounded-2xl p-6 shadow-sm border border-gray-100 overflow-x-auto">
        {orders.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Order</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {orders.map((item) => {
                const isPaid = item.status === 'PAID';
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 font-mono text-xs">{item.order_ref}</div>
                          {item.provider_ref && (
                            <div className="text-xs text-gray-400 font-mono">Paystack: {item.provider_ref}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{item.customer_name || 'Guest / Unset'}</div>
                      <div className="text-xs text-gray-500">{item.customer_email || 'No email provided'}</div>
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      {item.currency === 'NGN' || !item.currency ? '₦' : '$'}
                      {(item.total || 0).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleResync(item)}
                        disabled={syncingId === item.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          isPaid
                            ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-sm'
                        }`}
                        title={isPaid ? 'Re-verify with Paystack & Resend Emails' : 'Verify payment with Paystack & Fulfill'}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${syncingId === item.id ? 'animate-spin' : ''}`} />
                        {syncingId === item.id ? 'Verifying...' : isPaid ? 'Resend' : 'Verify & Sync'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-center py-8">No orders found.</p>
        )}
      </div>
    </div>
  );
}
