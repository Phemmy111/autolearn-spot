'use client';
export const dynamic = "force-dynamic";

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertCircle, ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { fbqPurchase } from '@/lib/meta-pixel';

export default function EnrollSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-brand-primary mx-auto mb-4" />
      </div>
    }>
      <EnrollSuccessContent />
    </Suspense>
  );
}

function EnrollSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const purchaseTrackedRef = useRef(false);

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      setErrorMessage('No payment reference found in URL.');
      return;
    }

    let isMounted = true;
    let pollCount = 0;
    const maxPolls = 5;

    async function verifyPayment() {
      try {
        const res = await fetch(`/api/checkout/order-status?reference=${encodeURIComponent(reference!)}`);
        const data = await res.json().catch(() => ({}));

        if (!isMounted) return;

        if (data.verified) {
          setStatus('success');

          // Track Meta Pixel Purchase ONLY once when verified
          if (!purchaseTrackedRef.current) {
            purchaseTrackedRef.current = true;
            fbqPurchase({
              event_id: data.eventId,
              value: data.total,
              currency: data.currency || 'NGN',
              content_ids: data.contentIds,
              contents: data.contents,
              num_items: data.numItems,
            });
          }
        } else if (pollCount < maxPolls) {
          pollCount++;
          setTimeout(verifyPayment, 1500);
        } else {
          setStatus('pending');
        }
      } catch (err: any) {
        if (!isMounted) return;
        if (pollCount < maxPolls) {
          pollCount++;
          setTimeout(verifyPayment, 1500);
        } else {
          setStatus('error');
          setErrorMessage('Could not verify enrollment payment. Please check your dashboard.');
        }
      }
    }

    verifyPayment();

    return () => {
      isMounted = false;
    };
  }, [reference]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Verifying your enrollment...</h2>
          <p className="text-muted-foreground">Please wait a moment while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 text-red-600 mb-6">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Enrollment Pending Verification</h1>
          <p className="text-muted-foreground mb-6">{errorMessage || 'Your transaction could not be automatically confirmed.'}</p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard" className="px-6 py-3 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 transition-colors">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 text-amber-600 mb-6">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Confirming Enrollment</h1>
          <p className="text-muted-foreground mb-6">
            Your payment is being confirmed. Your training access is being activated.
          </p>
          {reference && (
            <p className="text-xs text-muted-foreground/60 mb-6 font-mono">Reference: {reference}</p>
          )}
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-8 py-3.5 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 transition-colors">
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-50 mb-8 animate-in zoom-in duration-500">
          <CheckCircle className="w-14 h-14 text-green-500" />
        </div>

        <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-foreground mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          Enrollment Successful!
        </h1>

        <p className="text-lg text-muted-foreground mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          Welcome to AutoLearn Spot! Your enrollment in the 4-week n8n Automation Training is active.
        </p>

        {reference && (
          <p className="text-sm text-muted-foreground/60 mb-8 animate-in fade-in duration-500 delay-300">
            Payment Reference: <span className="font-mono">{reference}</span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 transition-colors shadow-lg">
            Access Dashboard & Lessons
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
