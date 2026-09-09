import React from 'react';
import TransactionRow from '@/components/TransactionRow';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default async function TransactionsPage() {
  const res = await fetch('/api/author/transactions', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.success) {
    return <div className="p-6"><p className="text-red-500">Failed to load transactions.</p></div>;
  }
  const { transactions } = json;
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Transaction History</h1>
      <div className="overflow-x-auto rounded-2xl shadow-lg">
        <table className="min-w-full bg-[#1a1d23]">
          <thead>
            <tr className="bg-[#111317]">
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Type</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Amount</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Date</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t:any) => (
              <TransactionRow key={t.id} type={t.type} amount={t.amount} date={t.date} status={t.status} />
            ))}
          </tbody>
        </table>
      </div>
      <Link href="/dashboard/withdrawals/request" className="inline-block bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition mt-4">Request Withdrawal</Link>
    </div>
  );
}
