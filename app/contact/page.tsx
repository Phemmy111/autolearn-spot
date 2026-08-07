"use client";

import Link from 'next/link';
import { MessageCircle, ArrowLeft } from 'lucide-react';

export default function ContactPage() {
  const handleWhatsAppContact = () => {
    const phoneNumber = "08120934828";
    const message = encodeURIComponent("Hello AutoLearn Spot Support. I need assistance.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-[#e2e2e8] mb-2">Contact Us</h1>
          <p className="text-[#b9cacb] mb-8">Get in touch with our support team</p>

          <button
            onClick={handleWhatsAppContact}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#25D366] text-white rounded-xl font-medium hover:bg-[#25D366]/90 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            Contact via WhatsApp
          </button>

          <div className="mt-6 text-center text-sm text-[#b9cacb]">
            <p>Or email us at:</p>
            <a href="mailto:support@autolearnspot.com" className="text-[#12E6F3] hover:underline">
              support@autolearnspot.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}