import React from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default async function WithdrawalHistoryPage() {
  // Fetch withdrawals for the authenticated author
  const res = await fetch('/api/withdrawals', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  const data = await res.json();
  if (!data.success) {
    return (
      <div className="p-6">
        <p className="text-red-500">Failed to load withdrawals.</p>
      </div>
    );
  }

  const { withdrawals } = data;
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-white">Withdrawal History</h1>
      {withdrawals.length === 0 ? (
        <p className="text-gray-300">No withdrawals yet.</p>
      ) : (
        <table className="min-w-full bg-[#1a1d23] rounded-2xl shadow-lg">
          <thead>
            <tr className="text-left">
              <th className="px-4 py-2 text-gray-400">Reference ID</th>
              <th className="px-4 py-2 text-gray-400">Amount (₦)</th>
              <th className="px-4 py-2 text-gray-400">Date</th>
              <th className="px-4 py-2 text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((w: any) => (
              <tr key={w.request_ref} className="border-b border-gray-700">
                <td className="px-4 py-2 text-gray-200">{w.request_ref}</td>
                <td className="px-4 py-2 text-gray-200">{w.amount}</td>
                <td className="px-4 py-2 text-gray-200">
                  {new Date(w.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded ${
                      w.status === 'APPROVED'
                        ? 'bg-green-600 text-white'
                        : w.status === 'REJECTED'
                        ? 'bg-red-600 text-white'
                        : w.status === 'PENDING'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-600 text-white'
                    }`}
                  >
                    {w.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Link
        href="/dashboard/earnings"
        className="inline-block text-primary-500 hover:underline"
      >
        ← Back to Earnings
      </Link>
    </div>
  );
}
