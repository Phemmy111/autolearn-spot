'use client';
export const dynamic = "force-dynamic";

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertCircle, ArrowRight, ShoppingBag, Loader2 } from 'lucide-react';
import { fbqPurchase } from '@/lib/meta-pixel';

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-brand-primary mx-auto mb-4" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
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
          // Webhook might still be completing; poll again after 1.5 seconds
          pollCount++;
          setTimeout(verifyPayment, 1500);
        } else {
          // Exceeded polling; payment could still be processing or failed
          setStatus('pending');
        }
      } catch (err: any) {
        if (!isMounted) return;
        if (pollCount < maxPolls) {
          pollCount++;
          setTimeout(verifyPayment, 1500);
        } else {
          setStatus('error');
          setErrorMessage('Could not verify transaction status. Please check your dashboard or email.');
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
          <h2 className="text-xl font-bold text-foreground mb-2">Verifying your payment...</h2>
          <p className="text-muted-foreground">Please wait a moment while we confirm your transaction with Paystack.</p>
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
          <h1 className="text-2xl font-bold text-foreground mb-3">Verification Issue</h1>
          <p className="text-muted-foreground mb-6">{errorMessage || 'We could not verify this transaction.'}</p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard" className="px-6 py-3 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 transition-colors">
              Go to Dashboard
            </Link>
            <Link href="/marketplace" className="px-6 py-3 bg-card border border-border text-foreground font-semibold rounded-xl hover:bg-muted transition-colors">
              Marketplace
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
          <h1 className="text-2xl font-bold text-foreground mb-3">Payment Processing</h1>
          <p className="text-muted-foreground mb-6">
            Your payment is currently being confirmed by Paystack. Your access will be automatically unlocked within a few moments.
          </p>
          {reference && (
            <p className="text-xs text-muted-foreground/60 mb-6 font-mono">Reference: {reference}</p>
          )}
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-8 py-3.5 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 transition-colors">
            Check Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-50 mb-8 animate-in zoom-in duration-500">
          <CheckCircle className="w-14 h-14 text-green-500" />
        </div>

        <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-foreground mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          Payment Successful!
        </h1>

        <p className="text-lg text-muted-foreground mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          Thank you for your purchase. Your course access is activated and available in your dashboard.
        </p>

        {reference && (
          <p className="text-sm text-muted-foreground/60 mb-8 animate-in fade-in duration-500 delay-300">
            Transaction Reference: <span className="font-mono">{reference}</span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 transition-colors shadow-lg">
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link href="/marketplace" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-card border border-border text-foreground font-semibold rounded-xl hover:bg-muted transition-colors">
            <ShoppingBag className="w-5 h-5" />
            Browse More Courses
          </Link>
        </div>
      </div>
    </div>
  );
}
