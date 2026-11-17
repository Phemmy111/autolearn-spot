'use client';

import { useEffect } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export default function AdminPartnersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AdminPartnersError]', error);
  }, [error]);

  return (
    <div className="p-8 max-w-xl mx-auto my-12 bg-white border border-rose-200 rounded-2xl shadow-sm text-center space-y-4">
      <div className="w-12 h-12 mx-auto bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-900">Partners Dashboard Notice</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          {error?.message || 'An unexpected error occurred while loading the partners portal.'}
        </p>
      </div>
      <div className="pt-2 flex items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}
