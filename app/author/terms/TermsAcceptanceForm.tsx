"use client";

import { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface TermsAcceptanceFormProps {
  authorId: string;
  hasAccepted: boolean;
  currentVersion: string;
}

export function TermsAcceptanceForm({ authorId, hasAccepted, currentVersion }: TermsAcceptanceFormProps) {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/author/accept-terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorId,
          termsVersion: currentVersion,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept terms');
      }

      setSuccess(true);
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (hasAccepted) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <div>
          <p className="font-medium text-green-900">Terms Accepted</p>
          <p className="text-sm text-green-700">
            You have accepted the Author Terms & Conditions (Version {currentVersion})
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700">Terms accepted successfully!</p>
        </div>
      )}

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-1 w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
          required
        />
        <span className="text-sm text-brand-text">
          I have read and agree to the Author Terms & Conditions.
        </span>
      </label>

      <button
        type="submit"
        disabled={!accepted || loading}
        className="w-full sm:w-auto px-6 py-3 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Processing...' : 'Accept Terms & Continue'}
      </button>
    </form>
  );
}