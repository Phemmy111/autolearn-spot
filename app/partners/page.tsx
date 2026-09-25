"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MarketplaceNavigation } from "@/components/MarketplaceNavigation";
import { WhatsAppChatModal } from "@/components/whatsapp-chat-modal";
import { AutolearnBot } from "@/components/autolearn-bot";
import { getPublicSettings } from "@/lib/public-settings";
import {
  ArrowRight,
  DollarSign,
  Link2,
  TrendingUp,
  Users,
  Star,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  BarChart3,
  Globe,
  Award,
  Mail,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Users,
    title: "Apply & Get Approved",
    description:
      "Submit your affiliate partner application. Our team reviews it and approves you within 2–3 business days.",
  },
  {
    step: "02",
    icon: Globe,
    title: "Browse the Affiliate Marketplace",
    description:
      "Log in to your partner dashboard and discover courses whose authors have opted in. Each course shows its custom commission rate.",
  },
  {
    step: "03",
    icon: Link2,
    title: "Generate Your Unique Link",
    description:
      'Click "Get My Link" on any course to instantly generate a trackable affiliate link with your personal referral code.',
  },
  {
    step: "04",
    icon: DollarSign,
    title: "Earn Your Commission",
    description:
      "When a student purchases through your link, your commission (set by the course author, 10–70%) is automatically credited to your wallet.",
  },
];

const BENEFITS = [
  {
    icon: TrendingUp,
    title: "Custom Commissions",
    description:
      "No fixed rate. Earn 10% to 70% per sale — set directly by each course author.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Tracking",
    description:
      "Monitor clicks, conversions, and earnings for every link from your partner dashboard.",
  },
  {
    icon: DollarSign,
    title: "Partner Wallet",
    description:
      "All commissions land in your partner wallet. Request weekly withdrawals anytime.",
  },
  {
    icon: Globe,
    title: "Multiple Courses",
    description:
      "Promote as many opted-in courses as you want. Multiple links mean multiple income streams.",
  },
  {
    icon: Award,
    title: "Marketing Kit",
    description:
      "Access professionally designed flyers, captions, and reels to boost your promotions.",
  },
  {
    icon: Sparkles,
    title: "Leaderboard & Perks",
    description:
      "Top affiliates get featured on our public leaderboard and receive exclusive perks and bonuses.",
  },
];

const PARTNER_TESTIMONIALS = [
  {
    name: "Marvellous Olaoluwa",
    school: "University of Ibadan",
    image: "/Partners/Ola.png",
    review:
      "The new affiliate marketplace is a game changer. I now promote three different courses and each one pays a different rate. My income has multiplied.",
    rating: 5,
  },
  {
    name: "Oluwapelumi Samson",
    school: "University of Ibadan",
    image: "/Partners/Samson.png",
    review:
      "Generating my unique link takes literally two clicks. The dashboard shows me exactly which link is converting and how much I've earned.",
    rating: 5,
  },
  {
    name: "Isaac Moon",
    school: "Data Analyst – LAUTECH Graduate",
    image: "/Partners/Isaac.png",
    review:
      "What impressed me most is the transparency. I can see the commission rate before I even generate a link. No surprises, just clean earnings.",
    rating: 5,
  },
  {
    name: "Beloved Justina",
    school: "Data Analyst – University of Ilorin Graduate",
    image: "/Partners/Beloved.png",
    review:
      "I partnered because the model is honest. Authors choose their own rates, I pick courses I believe in, and students get real value. Everyone wins.",
    rating: 5,
  },
];

const FAQS = [
  {
    q: "How do I become an affiliate partner?",
    a: "Apply through our partner application form. Once approved (2–3 business days), you'll receive dashboard access and can start generating affiliate links immediately.",
  },
  {
    q: "How much can I earn per sale?",
    a: "Each course author sets their own commission rate, ranging from 10% to 70% of the course price. You'll see the exact rate before generating a link.",
  },
  {
    q: "How does the tracking work?",
    a: "Each link you generate contains your unique referral code. When a student clicks it, it's stored in their browser for 30 days. Any purchase within that window is credited to you.",
  },
  {
    q: "When and how do I get paid?",
    a: "Commissions land in your Partner Wallet automatically after a successful purchase. You can request a withdrawal at any time from your dashboard.",
  },
  {
    q: "Can I promote more than one course?",
    a: "Yes! You can browse the entire Affiliate Marketplace and generate unique links for as many courses as you want.",
  },
];

// ─── Sections ─────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative pt-8 pb-16 md:pt-16 md:pb-24 overflow-hidden bg-brand-bg">
      {/* Dot grid background */}
      <div className="absolute inset-0 z-0 bg-brand-bg bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />
      {/* Accent glows */}
      <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-brand-primary/10 blur-[120px] rounded-full pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none mix-blend-multiply" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left – Text */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-semibold mb-6 border border-brand-primary/20 shadow-sm">
              <Sparkles className="w-4 h-4" />
              Affiliate Partner Programme
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[60px] font-heading font-extrabold text-brand-text tracking-tight mb-6 leading-[1.08]">
              Turn Your Audience{" "}
              <span className="text-brand-primary">Into Income.</span>
            </h1>

            <p className="text-lg text-brand-text/70 mb-8 max-w-xl leading-relaxed">
              Join AutoLearn Spot's Affiliate Marketplace. Pick courses, share
              unique links, and earn custom commissions of up to{" "}
              <strong className="text-brand-text">70%</strong> per sale —
              set by each course author.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
              <Link
                href="/partners/apply"
                className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-brand-primary text-white font-semibold rounded-full hover:bg-brand-primary-hover transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                Apply as Affiliate Partner
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/partners/dashboard"
                className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-brand-primary text-brand-primary font-semibold rounded-full hover:bg-brand-primary/5 transition-all duration-300 text-center"
              >
                Partner Dashboard
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {["/Partners/Ola.png", "/Partners/Samson.png", "/Partners/Isaac.png", "/Partners/Beloved.png"].map(
                  (src, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white bg-brand-bg overflow-hidden relative shadow-sm"
                    >
                      <Image src={src} alt="Partner" fill className="object-cover" />
                    </div>
                  )
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-brand-text">Join our growing affiliate network</p>
                <p className="text-xs text-brand-text/60">Partners earning every day</p>
              </div>
            </div>
          </div>

          {/* Right – Stats card */}
          <div className="relative hidden md:flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-700">
            <div className="bg-brand-bg border border-brand-border/60 rounded-3xl p-8 shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-text/50 mb-6">
                Partner Dashboard Preview
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: "Available Balance", value: "₦24,500", highlight: true },
                  { label: "Pending Earnings", value: "₦7,500", highlight: false },
                  { label: "Total Conversions", value: "89", highlight: false },
                  { label: "Active Links", value: "12", highlight: false },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-brand-bg rounded-2xl p-4 border border-brand-border/40 shadow-sm"
                  >
                    <p className="text-xs text-brand-text/50 mb-1">{stat.label}</p>
                    <p
                      className={`text-xl font-extrabold ${
                        stat.highlight ? "text-brand-primary" : "text-brand-text"
                      }`}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Mini bar chart */}
              <div className="bg-brand-bg rounded-2xl p-4 border border-brand-border/40">
                <p className="text-xs text-brand-text/50 mb-3">Monthly Earnings</p>
                <div className="flex items-end gap-1.5 h-16">
                  {[30, 50, 35, 70, 45, 60, 40, 80, 55, 75, 50, 90].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-brand-primary/20 rounded-t hover:bg-brand-primary/40 transition-colors"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
              Up to 70% commission
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="py-16 md:py-24 bg-brand-bg border-t border-brand-border/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-semibold mb-4 border border-brand-primary/20">
            Simple Process
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-brand-text mb-4">
            How It Works
          </h2>
          <p className="text-brand-text/70 max-w-xl mx-auto">
            From application to your first payout in four straightforward steps.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative bg-brand-bg border border-brand-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="absolute top-4 right-4 text-5xl font-extrabold text-brand-primary/10 leading-none select-none">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-4 group-hover:bg-brand-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-brand-primary" />
                </div>
                <h3 className="font-bold text-brand-text mb-2">{item.title}</h3>
                <p className="text-sm text-brand-text/60 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="py-16 md:py-24 bg-brand-bg border-t border-brand-border/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-semibold mb-4 border border-brand-primary/20">
            Why Join
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-brand-text mb-4">
            Everything You Need to Earn
          </h2>
          <p className="text-brand-text/70 max-w-xl mx-auto">
            Built from the ground up for high converting affiliates.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="bg-brand-bg border border-brand-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-4 group-hover:bg-brand-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-brand-primary" />
                </div>
                <h3 className="font-bold text-brand-text mb-2">{b.title}</h3>
                <p className="text-sm text-brand-text/60 leading-relaxed">
                  {b.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CommissionExplainerSection() {
  return (
    <section className="py-16 md:py-24 bg-brand-bg border-t border-brand-border/50">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-semibold mb-4 border border-brand-primary/20">
              Commission Model
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-brand-text mb-4">
              Authors Set the Rate. You Keep It.
            </h2>
            <p className="text-brand-text/70 mb-6 leading-relaxed">
              Every course author on AutoLearn Spot sets their own affiliate commission rate — between 10% and 70%. You see the exact rate before generating a link, so you always know your exact payout.
            </p>
            <ul className="space-y-3">
              {[
                "No hidden fees or deductions",
                "Commissions auto-credited instantly upon verified payment",
                "Withdraw to your bank account anytime your wallet qualifies",
                "Independent link metrics for granular conversion tracking",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-brand-text/80">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0" />
                  <span className="text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Example calculation card */}
          <div className="bg-brand-bg border border-brand-border/50 rounded-3xl p-8 shadow-md">
            <p className="text-sm font-semibold text-brand-text/60 mb-6 uppercase tracking-wide">
              Example Calculation
            </p>
            <div className="space-y-4">
              {[
                { label: "Course Price", value: "₦20,000" },
                { label: "Author Commission Rate", value: "25%" },
                { label: "Your Affiliate Earnings", value: "₦5,000", primary: true },
              ].map((row) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    row.primary
                      ? "bg-brand-primary/10 border border-brand-primary/20"
                      : "bg-brand-bg border border-brand-border/40"
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      row.primary ? "text-brand-primary font-bold" : "text-brand-text/70"
                    }`}
                  >
                    {row.label}
                  </span>
                  <span
                    className={`font-bold ${
                      row.primary ? "text-brand-primary text-xl" : "text-brand-text"
                    }`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-brand-text/40 mt-4 text-center">
              * Actual earnings depend on the specific course price and author-set rate
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24 bg-brand-bg border-t border-brand-border/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-brand-text mb-4">
            What Our Partners Say
          </h2>
          <p className="text-brand-text/70">Real feedback from active affiliate partners.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PARTNER_TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-brand-bg border border-brand-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full border-2 border-brand-primary/30 overflow-hidden flex-shrink-0 relative">
                  <Image src={t.image} alt={t.name} fill className="object-cover" />
                </div>
                <div>
                  <p className="font-bold text-brand-text text-sm">{t.name}</p>
                  <p className="text-xs text-brand-text/50">{t.school}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-3">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-brand-primary fill-current" />
                ))}
              </div>
              <p className="text-sm text-brand-text/70 leading-relaxed italic">
                "{t.review}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="py-16 md:py-24 bg-brand-bg border-t border-brand-border/50">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-brand-text mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-brand-text/70">Everything you need to know about the affiliate program.</p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="bg-brand-bg border border-brand-border/50 rounded-2xl overflow-hidden shadow-sm"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-brand-primary/5 transition-colors"
              >
                <span className="font-semibold text-brand-text text-sm sm:text-base">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-brand-primary flex-shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-sm text-brand-text/70 leading-relaxed border-t border-brand-border/40 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-brand-bg border-t border-brand-border/50">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-semibold mb-6 border border-brand-primary/20">
          <Sparkles className="w-4 h-4" />
          Ready to Start?
        </div>
        <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-brand-text mb-4">
          Join the Affiliate Programme Today
        </h2>
        <p className="text-brand-text/70 mb-8 leading-relaxed">
          Pick courses in the marketplace, share your links, and start generating earnings with every enrollment.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/partners/apply"
            className="group flex items-center justify-center gap-2 px-8 py-4 bg-brand-primary text-white font-semibold rounded-full hover:bg-brand-primary-hover transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            Apply Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/partners/dashboard"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-brand-primary text-brand-primary font-semibold rounded-full hover:bg-brand-primary/5 transition-all duration-300"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}

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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PartnersPage() {
  return (
    <main className="min-h-screen bg-brand-bg">
      <MarketplaceNavigation />
      <WhatsAppChatModal variant="floating" />
      <AutolearnBot />
      <HeroSection />
      <HowItWorksSection />
      <BenefitsSection />
      <CommissionExplainerSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <StandardSiteFooter />
    </main>
  );
}
