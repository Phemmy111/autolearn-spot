import React from 'react';
import Link from 'next/link';
import BankAccountForm from '@/components/BankAccountForm';

export default async function BankProfilePage() {
  const res = await fetch('/api/authors/me/bank-profile', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.success) {
    return <div className="p-6"><p className="text-red-500">Failed to load bank profile.</p></div>;
  }
  const { bank_name, masked_account_number, verified } = json;
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-white">Bank Profile</h1>
      <div className="rounded-2xl bg-[#1a1d23] p-6 shadow-lg">
        <p className="text-gray-300">Bank: {bank_name}</p>
        <p className="text-gray-300">Account: {masked_account_number}</p>
        <p className="text-gray-300">Verified: {verified ? 'Yes' : 'No'}</p>
      </div>
      <BankAccountForm />
      <Link href="/dashboard/withdrawals/request" className="inline-block bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
        Request Withdrawal
      </Link>
    </div>
  );
}
