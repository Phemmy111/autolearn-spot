'use client';
export const dynamic = "force-dynamic";
import React, { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowRight, ShoppingBag, Loader2 } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    // Give webhook a moment to process, then show success
    const timer = setTimeout(() => {
      setStatus('success');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Confirming your payment...</h2>
          <p className="text-muted-foreground">Please wait while we verify your transaction.</p>
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
          Thank you for your purchase. Your courses are now available in your dashboard.
        </p>

        {reference && (
          <p className="text-sm text-muted-foreground/60 mb-8 animate-in fade-in duration-500 delay-300">
            Transaction Reference: <span className="font-mono">{reference}</span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 transition-colors shadow-lg"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-card border border-border text-foreground font-semibold rounded-xl hover:bg-muted transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            Browse More Courses
          </Link>
        </div>
      </div>
    </div>
  );
}
