'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function WithdrawalForm({ availableBalance }: { availableBalance: number }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Enter a valid amount');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Withdrawal request failed');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-gray-50 p-6 shadow-lg space-y-4">
      <h2 className="text-lg font-medium text-neutral-900">Request Withdrawal</h2>
      {error && <p className="text-red-500">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-300">Amount (₦)</label>
        <input
          type="number"
          min={0}
          step={0.01}
          required
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="mt-1 w-full rounded border border-gray-600 bg-gray-50 p-2 text-neutral-900"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded bg-primary-600 px-4 py-2 text-neutral-900 hover:bg-primary-700 disabled:opacity-50"
      >
        {loading ? <LoadingSpinner message="Submitting..." /> : 'Submit Request'}
      </button>
    </form>
  );
}
