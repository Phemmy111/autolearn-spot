"use client";

import React, { useState } from 'react';
import { ShoppingCart, RefreshCw, CheckCircle2, AlertCircle, Mail, Send, Sparkles } from 'lucide-react';

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
  followup_sent?: boolean;
}

export default function OrdersTableClient({ initialOrders }: { initialOrders: OrderItem[] }) {
  const [orders, setOrders] = useState<OrderItem[]>(initialOrders);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [followupLoadingId, setFollowupLoadingId] = useState<string | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sentFollowups, setSentFollowups] = useState<Record<string, boolean>>({});

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
      setOrders(prev =>
        prev.map(o => (o.id === order.id ? { ...o, status: 'PAID', paid_at: new Date().toISOString() } : o))
      );
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error syncing order' });
    } finally {
      setSyncingId(null);
    }
  };

  const handleSendFollowup = async (order: OrderItem, force = false) => {
    if (!order.customer_email) {
      setMessage({ type: 'error', text: 'This order does not have a customer email address.' });
      return;
    }

    setFollowupLoadingId(order.id);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.alreadySent) {
          setMessage({
            type: 'error',
            text: `Follow-up already sent to ${order.customer_email}. Click again if you want to resend.`,
          });
          setSentFollowups(prev => ({ ...prev, [order.id]: true }));
          return;
        }
        throw new Error(data.error || 'Failed to send follow-up email');
      }

      setMessage({
        type: 'success',
        text: `Follow-up email successfully delivered to ${order.customer_name || 'student'} (${order.customer_email})!`,
      });
      setSentFollowups(prev => ({ ...prev, [order.id]: true }));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error sending follow-up email' });
    } finally {
      setFollowupLoadingId(null);
    }
  };

  const handleRunBatchRecovery = async () => {
    setBatchRunning(true);
    setMessage(null);

    try {
      const res = await fetch('/api/cron/abandoned-checkout');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to run recovery scan');
      }

      setMessage({
        type: 'success',
        text: `Automated recovery complete! Scanned: ${data.scanned || 0}, Follow-up emails sent: ${data.sent || 0}, Skipped/Already Sent: ${data.skipped || 0}.`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error running batch recovery scan' });
    } finally {
      setBatchRunning(false);
    }
  };

  const pendingCount = orders.filter(o => o.status === 'PENDING').length;

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[var(--card)] brightness-95 p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Pending Orders (Attempted to Pay):</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            {pendingCount}
          </span>
        </div>
        <button
          onClick={handleRunBatchRecovery}
          disabled={batchRunning}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm transition-all"
        >
          <Sparkles className={`h-4 w-4 ${batchRunning ? 'animate-spin' : ''}`} />
          {batchRunning ? 'Scanning & Sending...' : 'Auto-Follow Up Eligible Pending Orders'}
        </button>
      </div>

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
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {orders.map((item) => {
                const isPaid = item.status === 'PAID';
                const hasFollowup = sentFollowups[item.id];
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
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status || 'PENDING'}
                        </span>
                        {hasFollowup && (
                          <span className="inline-flex items-center text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            Follow-up Sent
                          </span>
                        )}
                      </div>
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
                      <div className="inline-flex items-center justify-end gap-2">
                        {/* If pending: provide Follow-up button */}
                        {!isPaid && item.customer_email && (
                          <button
                            onClick={() => handleSendFollowup(item, hasFollowup)}
                            disabled={followupLoadingId === item.id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              hasFollowup
                                ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-sm'
                            }`}
                            title={hasFollowup ? 'Resend follow-up email' : 'Send abandoned checkout recovery email'}
                          >
                            <Mail className={`h-3.5 w-3.5 ${followupLoadingId === item.id ? 'animate-bounce' : ''}`} />
                            {followupLoadingId === item.id
                              ? 'Sending...'
                              : hasFollowup
                              ? 'Resend Follow-up'
                              : 'Send Follow-up'}
                          </button>
                        )}

                        {/* Verify & Sync / Resend Button */}
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
                          {syncingId === item.id ? 'Verifying...' : isPaid ? 'Resend Receipt' : 'Verify & Sync'}
                        </button>
                      </div>
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
