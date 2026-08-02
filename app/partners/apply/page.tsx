'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PartnerApplicationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      phone: formData.get('phone'),
      organization: formData.get('organization'),
      websiteOrSocial: formData.get('websiteOrSocial'),
      motivation: formData.get('motivation'),
      marketingPlan: formData.get('marketingPlan'),
    };

    try {
      const res = await fetch('/api/partners/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to submit application');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-white mb-6 font-heading">Application Submitted!</h1>
        <p className="text-[#b9cacb] mb-8">
          Thank you for applying to become a Community Partner. We will review your application and get back to you shortly.
        </p>
        <button onClick={() => router.push('/partners')} className="bg-[#00f0ff] text-black px-6 py-3 rounded font-bold hover:bg-white transition-colors">
          Return to Portal
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-4xl font-bold text-white mb-6 font-heading">Become a Community Partner</h1>
      <p className="text-[#b9cacb] mb-8">
        Join our Community Partner program and earn ₦1,000 for every successful student referral.
      </p>

      {error && <div className="bg-red-500/20 text-red-400 p-4 rounded mb-6 border border-red-500/50">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm text-[#b9cacb] mb-2">Phone Number *</label>
          <input required name="phone" type="tel" className="w-full bg-[#111317] border border-[#1f2229] text-white p-3 rounded" />
        </div>

        <div>
          <label className="block text-sm text-[#b9cacb] mb-2">Organization / School (Optional)</label>
          <input name="organization" type="text" className="w-full bg-[#111317] border border-[#1f2229] text-white p-3 rounded" />
        </div>

        <div>
          <label className="block text-sm text-[#b9cacb] mb-2">Website or Social Media Link (Optional)</label>
          <input name="websiteOrSocial" type="text" className="w-full bg-[#111317] border border-[#1f2229] text-white p-3 rounded" />
        </div>

        <div>
          <label className="block text-sm text-[#b9cacb] mb-2">Why do you want to partner with us? *</label>
          <textarea required name="motivation" rows={4} className="w-full bg-[#111317] border border-[#1f2229] text-white p-3 rounded"></textarea>
        </div>

        <div>
          <label className="block text-sm text-[#b9cacb] mb-2">How do you plan to refer students? (Optional)</label>
          <textarea name="marketingPlan" rows={4} className="w-full bg-[#111317] border border-[#1f2229] text-white p-3 rounded"></textarea>
        </div>

        <button disabled={loading} type="submit" className="w-full bg-[#00f0ff] text-black px-6 py-3 rounded font-bold hover:bg-white transition-colors disabled:opacity-50">
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}
