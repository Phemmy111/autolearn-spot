"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Settings, DollarSign } from 'lucide-react';
import { requireAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';

export default function AdminCommissionSettingsPage() {
  const [rates, setRates] = useState({
    student: 1500,
    community: 1500,
    influencer: 2500,
  });
  const [newRates, setNewRates] = useState({
    student: '',
    community: '',
    influencer: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchCurrentRates();
  }, []);

  const fetchCurrentRates = async () => {
    try {
      const res = await fetch('/api/settings/commission-rates');
      if (res.ok) {
        const data = await res.json();
        setRates(data);
        setNewRates({
          student: data.student.toString(),
          community: data.community.toString(),
          influencer: data.influencer.toString(),
        });
      } else {
        setError('Failed to fetch current commission rates');
      }
    } catch (e) {
      setError('Failed to fetch current commission rates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const parsedRates = {
      student: parseInt(newRates.student, 10),
      community: parseInt(newRates.community, 10),
      influencer: parseInt(newRates.influencer, 10),
    };

    // Validate all rates
    for (const [key, value] of Object.entries(parsedRates)) {
      if (isNaN(value) || value < 0) {
        setError(`Please enter a valid ${key} rate greater than or equal to 0`);
        return;
      }

      if (value > 100000) {
        setError(`Maximum ${key} rate is ₦100,000`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/commission-rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedRates),
      });

      if (res.ok) {
        const data = await res.json();
        setRates(data.rates);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to update commission rates');
      }
    } catch (e) {
      setError('Failed to update commission rates');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#10b981] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 font-mono text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Link>
          <h1 className="font-heading text-4xl font-bold text-neutral-900 mb-4 flex items-center gap-3">
            <Settings className="h-8 w-8 text-[#10b981]" />
            Commission Settings
          </h1>
          <p className="font-mono text-sm text-neutral-600 max-w-2xl">
            Manage default commission rates for partner types. Changes apply to new commissions only.
          </p>
        </div>

        <div className="max-w-2xl">
          <div className="border border-neutral-200 bg-gray-100 p-8 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="h-6 w-6 text-[#10b981]" />
              <h2 className="font-heading text-2xl font-bold text-neutral-900">Partner Commission Rates</h2>
            </div>

            <div className="space-y-6 mb-6">
              <div className="p-4 bg-gray-50 border border-neutral-200 rounded-lg">
                <p className="text-sm text-neutral-600 mb-1">Student Partner Rate</p>
                <p className="text-3xl font-bold text-[#10b981]">₦{rates.student.toLocaleString()}</p>
              </div>

              <div className="p-4 bg-gray-50 border border-neutral-200 rounded-lg">
                <p className="text-sm text-neutral-600 mb-1">Community Partner Rate</p>
                <p className="text-3xl font-bold text-[#10b981]">₦{rates.community.toLocaleString()}</p>
              </div>

              <div className="p-4 bg-gray-50 border border-neutral-200 rounded-lg">
                <p className="text-sm text-neutral-600 mb-1">Influencer Partner Rate</p>
                <p className="text-3xl font-bold text-[#10b981]">₦{rates.influencer.toLocaleString()}</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-2">
                  New Student Partner Rate (₦)
                </label>
                <input
                  type="number"
                  value={newRates.student}
                  onChange={(e) => setNewRates({ ...newRates, student: e.target.value })}
                  min="0"
                  max="100000"
                  className="w-full bg-gray-50 border border-neutral-200 p-4 text-neutral-900 text-lg focus:border-[#10b981] focus:outline-none transition-colors rounded-lg"
                  placeholder="Enter new rate"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-2">
                  New Community Partner Rate (₦)
                </label>
                <input
                  type="number"
                  value={newRates.community}
                  onChange={(e) => setNewRates({ ...newRates, community: e.target.value })}
                  min="0"
                  max="100000"
                  className="w-full bg-gray-50 border border-neutral-200 p-4 text-neutral-900 text-lg focus:border-[#10b981] focus:outline-none transition-colors rounded-lg"
                  placeholder="Enter new rate"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-2">
                  New Influencer Partner Rate (₦)
                </label>
                <input
                  type="number"
                  value={newRates.influencer}
                  onChange={(e) => setNewRates({ ...newRates, influencer: e.target.value })}
                  min="0"
                  max="100000"
                  className="w-full bg-gray-50 border border-neutral-200 p-4 text-neutral-900 text-lg focus:border-[#10b981] focus:outline-none transition-colors rounded-lg"
                  placeholder="Enter new rate"
                />
                <p className="text-xs text-neutral-500 mt-2">
                  Influencer partners can also have custom commission rates set individually during creation.
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
                  <span className="text-sm">Commission rates updated successfully!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 bg-gray-50 text-black font-mono font-bold uppercase p-4 hover:bg-transparent hover:text-[#10b981] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] border border-[#10b981] transition-all disabled:opacity-50 rounded-lg"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save New Rates'}
              </button>
            </form>
          </div>

          <div className="mt-6 p-4 bg-gray-50/50 border border-neutral-200 rounded-lg">
            <h3 className="font-semibold text-[#e2e2e8] mb-2">Important Notes</h3>
            <ul className="text-sm text-neutral-600 space-y-1">
              <li>• Changes apply only to new commissions</li>
              <li>• Existing commission records remain at their original rates</li>
              <li>• New partners will receive the current default rates</li>
              <li>• Influencer custom rates override the default when set</li>
              <li>• Scholarship payments (₦5,000) are not eligible for commissions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
