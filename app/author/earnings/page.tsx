import React from 'react';
import FinanceCard from '@/components/FinanceCard';
import Link from 'next/link';

export default async function EarningsPage() {
  const res = await fetch('/api/author/financial-summary', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.success) {
    return <div className="p-6"><p className="text-red-500">Failed to load financial summary.</p></div>;
  }
  const { available_balance, withdrawable_amount, total_earnings, total_sales } = json;
  return (
    <div className="space-y-6 p-6">
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinanceCard title="Available Balance" value={`₦${available_balance}`} />
        <FinanceCard title="Withdrawable Amount" value={`₦${withdrawable_amount}`} />
        <FinanceCard title="Total Earnings" value={`₦${total_earnings}`} />
        <FinanceCard title="Total Sales" value={`₦${total_sales}`} />
      </section>
      <section className="mt-4">
        <Link
          href="/dashboard/withdrawals/request"
          className="inline-block bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
        >
          Withdraw Funds
        </Link>
      </section>
    </div>
  );
}
