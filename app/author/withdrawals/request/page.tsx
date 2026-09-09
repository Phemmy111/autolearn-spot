import React from 'react';
import WithdrawalForm from '@/components/WithdrawalForm';
import Link from 'next/link';

export default async function WithdrawalRequestPage() {
  const res = await fetch('/api/author/financial-summary', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.success) {
    return <div className="p-6"><p className="text-red-500">Failed to load financial data.</p></div>;
  }
  const { available_balance } = json;
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-white">Request Withdrawal</h1>
      <p className="text-gray-300">Available Balance: <span className="font-medium">₦{available_balance}</span></p>
      <WithdrawalForm availableBalance={available_balance} />
      <Link href="/dashboard/earnings" className="inline-block text-primary-500 hover:underline">← Back to Earnings</Link>
    </div>
  );
}
