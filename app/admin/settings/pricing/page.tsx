"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Settings, DollarSign } from 'lucide-react';
import { requireAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';

export default function AdminPricingSettingsPage() {
  const [fee, setFee] = useState<number>(8000);
  const [newFee, setNewFee] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchCurrentFee();
  }, []);

  const fetchCurrentFee = async () => {
    try {
      const res = await fetch('/api/settings/direct-enrollment-fee');
      if (res.ok) {
        const data = await res.json();
        setFee(data.fee);
        setNewFee(data.fee.toString());
      } else {
        setError('Failed to fetch current fee');
      }
    } catch (e) {
      setError('Failed to fetch current fee');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const parsedFee = parseInt(newFee, 10);
    if (isNaN(parsedFee) || parsedFee <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (parsedFee > 1000000) {
      setError('Maximum amount is ₦1,000,000');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/direct-enrollment-fee', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fee: parsedFee }),
      });

      if (res.ok) {
        const data = await res.json();
        setFee(data.fee);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to update fee');
      }
    } catch (e) {
      setError('Failed to update fee');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#00f0ff] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-[#b9cacb] hover:text-white font-mono text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Link>
          <h1 className="font-heading text-4xl font-bold text-white mb-4 flex items-center gap-3">
            <Settings className="h-8 w-8 text-[#00f0ff]" />
            Pricing Settings
          </h1>
          <p className="font-mono text-sm text-[#b9cacb] max-w-2xl">
            Manage the Direct Enrollment course fee. Changes apply to new enrollments only.
          </p>
        </div>

        <div className="max-w-2xl">
          <div className="border border-[#1f2229] bg-[#0c0e12] p-8 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="h-6 w-6 text-[#00f0ff]" />
              <h2 className="font-heading text-2xl font-bold text-white">Direct Enrollment Fee</h2>
            </div>

            <div className="mb-6 p-4 bg-[#1a1c20] border border-[#1f2229] rounded-lg">
              <p className="text-sm text-[#b9cacb] mb-1">Current Price</p>
              <p className="text-3xl font-bold text-[#00f0ff]">₦{fee.toLocaleString()}</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">
                  New Price (₦)
                </label>
                <input
                  type="number"
                  value={newFee}
                  onChange={(e) => setNewFee(e.target.value)}
                  min="1"
                  max="1000000"
                  className="w-full bg-[#1a1c20] border border-[#1f2229] p-4 text-white text-lg focus:border-[#00f0ff] focus:outline-none transition-colors rounded-lg"
                  placeholder="Enter new price"
                />
                <p className="text-xs text-[#5d5f63] mt-2">
                  This change will only apply to new enrollments. Existing pending enrollments will remain at their original price.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 text-green-400 bg-green-400/10 border border-green-400/50 p-3 rounded-lg">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Price updated successfully!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 bg-[#00f0ff] text-black font-mono font-bold uppercase p-4 hover:bg-transparent hover:text-[#00f0ff] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] border border-[#00f0ff] transition-all disabled:opacity-50 rounded-lg"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save New Price'}
              </button>
            </form>
          </div>

          <div className="mt-6 p-4 bg-[#1a1c20]/50 border border-[#1f2229] rounded-lg">
            <h3 className="font-semibold text-[#e2e2e8] mb-2">Important Notes</h3>
            <ul className="text-sm text-[#b9cacb] space-y-1">
              <li>• Changes apply only to new enrollments</li>
              <li>• Existing pending enrollments keep their original price</li>
              <li>• Scholarship payments (₦5,000) are not affected</li>
              <li>• Webhook validation uses the pending enrollment's stored amount</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}