'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function BankAccountForm() {
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/authors/me/bank-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bank_name: bankName, account_number: accountNumber, routing_number: routingNumber }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to save bank details');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-[#1a1d23] p-6 shadow-lg space-y-4">
      <h2 className="text-lg font-medium text-white">Update Bank Details</h2>
      {error && <p className="text-red-500">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-300">Bank Name</label>
        <input type="text" required value={bankName} onChange={e => setBankName(e.target.value)} className="mt-1 w-full rounded border border-gray-600 bg-[#111317] p-2 text-white" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300">Account Number</label>
        <input type="text" required value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="mt-1 w-full rounded border border-gray-600 bg-[#111317] p-2 text-white" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300">Routing Number</label>
        <input type="text" required value={routingNumber} onChange={e => setRoutingNumber(e.target.value)} className="mt-1 w-full rounded border border-gray-600 bg-[#111317] p-2 text-white" />
      </div>
      <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50">
        {loading ? <LoadingSpinner message="Saving..." /> : 'Save'}
      </button>
    </form>
  );
}
