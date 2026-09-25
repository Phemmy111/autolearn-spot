"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MarketplaceNavigation } from "@/components/MarketplaceNavigation";
import { WhatsAppChatModal } from "@/components/whatsapp-chat-modal";
import { AutolearnBot } from "@/components/autolearn-bot";
import { getPublicSettings } from "@/lib/public-settings";
import { 
  CheckCircle, 
  Loader2, 
  Sparkles,
  DollarSign,
  Globe,
  FileText,
  TrendingUp,
  ShieldCheck,
  Mail,
  ArrowRight
} from "lucide-react";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", 
  "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", 
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", 
  "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT", "International"
];

const OCCUPATIONS = [
  "Content Creator / Influencer", "Digital Marketer", "Student", "Educator / Teacher", 
  "Tech Professional", "Freelancer", "Community Lead", "Entrepreneur", "Other"
];

function StandardSiteFooter() {
  const [settings, setSettings] = useState<any>({
    siteName: 'AutoLearn Spot',
    siteTagline: 'Learn without limits. Accelerate your growth with premium courses and AI automation.',
    footerCopyrightText: `© ${new Date().getFullYear()} AutoLearn Spot. All rights reserved.`,
  });

  useEffect(() => {
    async function load() {
      try {
        const loaded = await getPublicSettings([
          'footerCopyrightText',
          'siteName',
          'footerPrivacyLink',
          'footerTermsLink',
          'footerDescription',
          'siteTagline',
          'footerContactLink',
          'facebookUrl',
          'instagramUrl',
          'twitterUrl',
          'linkedinUrl',
          'youtubeUrl',
          'supportEmail'
        ]);
        if (loaded) setSettings((prev: any) => ({ ...prev, ...loaded }));
      } catch (e) {
        // use default
      }
    }
    load();
  }, []);

  return (
    <footer className="relative z-20 border-t border-brand-border/50 bg-brand-bg">
      <div className="container mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 flex items-center justify-center">
                <Image
                  src="/autolearn-brandmark.png"
                  alt={settings.siteName || "AutoLearn Spot"}
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-brand-text">{settings.siteName || "AutoLearn Spot"}</h3>
            </div>
            <p className="text-brand-text/70 text-sm leading-relaxed">
              {settings.siteTagline || "Elevate your career with premium courses, curated digital products, and communities led by industry experts."}
            </p>
          </div>

          {/* Learning */}
          <div>
            <h4 className="text-sm font-bold text-brand-text mb-4">Learning</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/courses" className="text-brand-text/70 hover:text-brand-primary text-sm transition-colors">
                  All Courses
                </Link>
              </li>
              <li>
                <Link href="/skills" className="text-brand-text/70 hover:text-brand-primary text-sm transition-colors">
                  Skills
                </Link>
              </li>
              <li>
                <Link href="/authors" className="text-brand-text/70 hover:text-brand-primary text-sm transition-colors">
                  Authors
                </Link>
              </li>
              <li>
                <Link href="/autolearn-ai" className="text-brand-text/70 hover:text-brand-primary text-sm transition-colors">
                  ALEX AI
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-bold text-brand-text mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-brand-text/70 hover:text-brand-primary text-sm transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/partners" className="text-brand-text/70 hover:text-brand-primary text-sm transition-colors">
                  Affiliate Program
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-brand-text/70 hover:text-brand-primary text-sm transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/career" className="text-brand-text/70 hover:text-brand-primary text-sm transition-colors">
                  Career
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-sm font-bold text-brand-text mb-4">Connect</h4>
            <div className="flex gap-3 flex-wrap">
              {settings.facebookUrl && (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-brand-border/50 bg-brand-bg flex items-center justify-center text-brand-text/70 hover:text-brand-primary hover:border-brand-primary transition-all"
                >
                  <span className="font-bold text-xs">FB</span>
                </a>
              )}
              {settings.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-brand-border/50 bg-brand-bg flex items-center justify-center text-brand-text/70 hover:text-brand-primary hover:border-brand-primary transition-all"
                >
                  <span className="font-bold text-xs">IG</span>
                </a>
              )}
              {settings.twitterUrl && (
                <a
                  href={settings.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-brand-border/50 bg-brand-bg flex items-center justify-center text-brand-text/70 hover:text-brand-primary hover:border-brand-primary transition-all"
                >
                  <span className="font-bold text-xs">X</span>
                </a>
              )}
              {settings.linkedinUrl && (
                <a
                  href={settings.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-brand-border/50 bg-brand-bg flex items-center justify-center text-brand-text/70 hover:text-brand-primary hover:border-brand-primary transition-all"
                >
                  <span className="font-bold text-xs">IN</span>
                </a>
              )}
              {settings.supportEmail && (
                <a
                  href={`mailto:${settings.supportEmail}`}
                  className="w-10 h-10 rounded-full border border-brand-border/50 bg-brand-bg flex items-center justify-center text-brand-text/70 hover:text-brand-primary hover:border-brand-primary transition-all"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-brand-border/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-brand-text/60 text-sm">
            {settings.footerCopyrightText || `© ${new Date().getFullYear()} ${settings.siteName || 'AutoLearn Spot'}. All rights reserved.`}
          </p>
          <div className="flex gap-6">
            <Link href={settings.footerPrivacyLink || '/privacy'} className="text-brand-text/60 hover:text-brand-primary text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href={settings.footerTermsLink || '/terms'} className="text-brand-text/60 hover:text-brand-primary text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function PartnerApplicationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const full_name = formData.get("full_name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const whatsapp = formData.get("whatsapp") as string;
    const state = formData.get("state") as string;
    const occupation = formData.get("occupation") as string;
    const motivation = formData.get("motivation") as string;
    const promotion_method = formData.get("promotion_method") as string;

    if (!agreed) {
      setError("Please accept the affiliate partnership terms to continue.");
      return;
    }

    if (!full_name || !email || !phone || !whatsapp || !state || !occupation || !motivation || !promotion_method) {
      setError("Please fill in all required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please provide a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const data = {
      full_name,
      email,
      phone,
      whatsapp,
      state,
      occupation,
      motivation,
      promotion_method,
      organization: formData.get("organization") || "",
      website: formData.get("website") || "",
      facebook: formData.get("facebook") || "",
      instagram: formData.get("instagram") || "",
      tiktok: formData.get("tiktok") || "",
      linkedin: formData.get("linkedin") || "",
      youtube: formData.get("youtube") || "",
      experience: formData.get("experience") || "",
    };

    try {
      const formDataToSend = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value as string);
        }
      });

      const res = await fetch("/api/partners/apply", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await res.json();
      
      if (res.ok && result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to submit application. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col">
        <MarketplaceNavigation />
        <div className="flex-1 flex items-center justify-center p-6 my-12">
          <div className="max-w-lg w-full bg-brand-bg border border-brand-border rounded-3xl p-8 sm:p-10 text-center shadow-lg">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand-primary/10 text-brand-primary mx-auto mb-6">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-text mb-3">Application Received!</h2>
            <p className="text-sm sm:text-base text-brand-text/70 mb-8 leading-relaxed">
              Thank you for applying to become an Affiliate Partner with AutoLearn Spot. Our team reviews all applications and will notify you via email within 2–3 business days with your dashboard login access.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-primary text-white font-semibold rounded-full hover:bg-brand-primary-hover transition-all"
              >
                Browse Marketplace
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3.5 border border-brand-border text-brand-text font-semibold rounded-full hover:bg-brand-primary/5 transition-all"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
        <StandardSiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <MarketplaceNavigation />
      <WhatsAppChatModal variant="floating" />
      <AutolearnBot />

      {/* Header Banner */}
      <section className="relative pt-12 pb-10 overflow-hidden bg-brand-bg border-b border-brand-border/40">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-semibold mb-4 border border-brand-primary/20">
            <Sparkles className="w-4 h-4" />
            Affiliate Partner Program
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-extrabold text-brand-text mb-4">
            Join as an Affiliate Partner
          </h1>
          <p className="text-base sm:text-lg text-brand-text/70 max-w-2xl mx-auto leading-relaxed">
            Promote world-class AI and tech courses in our marketplace. Generate trackable referral links and earn 10% to 70% custom commission on every enrollment.
          </p>

          {/* Quick Perks Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-left">
            <div className="bg-brand-bg/60 border border-brand-border/60 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0 text-brand-primary">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-brand-text">10% – 70% Commission</p>
                <p className="text-xs text-brand-text/60">Set directly by authors</p>
              </div>
            </div>
            <div className="bg-brand-bg/60 border border-brand-border/60 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0 text-brand-primary">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-brand-text">30-Day Cookie Window</p>
                <p className="text-xs text-brand-text/60">Track all conversions</p>
              </div>
            </div>
            <div className="bg-brand-bg/60 border border-brand-border/60 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0 text-brand-primary">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-brand-text">Partner Wallet</p>
                <p className="text-xs text-brand-text/60">Reliable direct withdrawals</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-brand-bg border border-brand-border rounded-3xl p-6 sm:p-10 shadow-sm">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 mb-8 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Personal Information */}
            <div>
              <div className="border-b border-brand-border/60 pb-3 mb-6">
                <h2 className="text-lg font-bold text-brand-text flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs flex items-center justify-center font-bold">1</span>
                  Personal & Contact Information
                </h2>
                <p className="text-xs text-brand-text/60 mt-1">We'll use these details to contact you about your application and payouts.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-brand-text">Full Name *</label>
                  <input
                    required
                    type="text"
                    name="full_name"
                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary transition-colors text-brand-text text-sm"
                    placeholder="e.g. Samuel David"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-brand-text">Email Address *</label>
                  <input
                    required
                    type="email"
                    name="email"
                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary transition-colors text-brand-text text-sm"
                    placeholder="you@domain.com"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-brand-text">Phone Number *</label>
                    <input
                      required
                      type="tel"
                      name="phone"
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary transition-colors text-brand-text text-sm"
                      placeholder="0801 234 5678"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-brand-text">WhatsApp Number *</label>
                    <input
                      required
                      type="tel"
                      name="whatsapp"
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary transition-colors text-brand-text text-sm"
                      placeholder="0801 234 5678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-brand-text">Location (State / Region) *</label>
                    <select
                      required
                      name="state"
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary transition-colors text-brand-text text-sm"
                    >
                      <option value="">Select your state</option>
                      {NIGERIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-brand-text">Primary Role / Occupation *</label>
                    <select
                      required
                      name="occupation"
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary transition-colors text-brand-text text-sm"
                    >
                      <option value="">Select your primary role</option>
                      {OCCUPATIONS.map((occupation) => (
                        <option key={occupation} value={occupation}>
                          {occupation}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Promotional Channels */}
            <div>
              <div className="border-b border-brand-border/60 pb-3 mb-6">
                <h2 className="text-lg font-bold text-brand-text flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs flex items-center justify-center font-bold">2</span>
                  Promotion Channels & Social Handles
                </h2>
                <p className="text-xs text-brand-text/60 mt-1">Provide links to platforms where you plan to share courses (optional but helps fast approval).</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-brand-text/70">Instagram Profile</label>
                  <input
                    type="url"
                    name="instagram"
                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-primary transition-colors text-brand-text text-sm"
                    placeholder="https://instagram.com/handle"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-brand-text/70">TikTok Profile</label>
                  <input
                    type="url"
                    name="tiktok"
                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-primary transition-colors text-brand-text text-sm"
                    placeholder="https://tiktok.com/@handle"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-brand-text/70">YouTube Channel</label>
                  <input
                    type="url"
                    name="youtube"
                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-primary transition-colors text-brand-text text-sm"
                    placeholder="https://youtube.com/@channel"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-brand-text/70">Website or Blog</label>
                  <input
                    type="url"
                    name="website"
                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-primary transition-colors text-brand-text text-sm"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Promotion Strategy */}
            <div>
              <div className="border-b border-brand-border/60 pb-3 mb-6">
                <h2 className="text-lg font-bold text-brand-text flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs flex items-center justify-center font-bold">3</span>
                  Strategy & Motivation
                </h2>
                <p className="text-xs text-brand-text/60 mt-1">Tell us how you intend to connect students with courses.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-brand-text">How do you plan to promote AutoLearn Spot courses? *</label>
                  <textarea
                    required
                    name="promotion_method"
                    rows={3}
                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary transition-colors text-brand-text text-sm resize-none"
                    placeholder="e.g. WhatsApp status & broadcast groups, Telegram AI community, TikTok short videos, email newsletter..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-brand-text">Why do you want to join our affiliate program? *</label>
                  <textarea
                    required
                    name="motivation"
                    rows={3}
                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary transition-colors text-brand-text text-sm resize-none"
                    placeholder="Tell us what excites you about partnering with AutoLearn Spot..."
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Terms & Agreement */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/20">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-brand-primary rounded"
                />
                <span className="text-xs text-brand-text/70 leading-relaxed">
                  I agree to the AutoLearn Spot Affiliate Partner terms. I understand that affiliate commissions (10%–70%) are earned on confirmed course sales via my unique referral link and are credited to my partner wallet for withdrawal.
                </span>
              </label>
            </div>

            <button
              disabled={isSubmitting || !agreed}
              type="submit"
              className="w-full py-4 rounded-full bg-brand-primary text-white font-bold hover:bg-brand-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5" />
                  Submit Affiliate Application
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <StandardSiteFooter />
    </div>
  );
}
