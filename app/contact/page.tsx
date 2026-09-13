"use client";

import Link from 'next/link';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getPublicSettings } from '@/lib/public-settings';

export default function ContactPage() {
  const [settings, setSettings] = useState({ supportEmail: 'support@autolearnspot.com', supportWhatsApp: '+234' });

  useEffect(() => {
    async function loadSettings() {
      try {
        const loadedSettings = await getPublicSettings(['support_email', 'support_whatsapp']);
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
    loadSettings();
  }, []);

  const handleWhatsAppContact = () => {
    const phoneNumber = settings.supportWhatsApp.replace(/[^0-9]/g, '');
    const message = encodeURIComponent("Hello AutoLearn Spot Support. I need assistance.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[var(--card)] brightness-95 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-brand-text/60 hover:text-[#12E6F3] mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-[#e2e2e8] mb-2">Contact Us</h1>
          <p className="text-brand-text/60 mb-8">Get in touch with our support team</p>

          <button
            onClick={handleWhatsAppContact}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-brand-bg text-brand-text rounded-xl font-medium hover:bg-brand-bg/90 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            Contact via WhatsApp
          </button>

          <div className="mt-6 text-center text-sm text-brand-text/60">
            <p>Or email us at:</p>
            <a href={`mailto:${settings.supportEmail}`} className="text-[#12E6F3] hover:underline">
              {settings.supportEmail}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
