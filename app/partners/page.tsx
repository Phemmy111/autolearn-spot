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
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Wallet,
  ExternalLink,
  Zap,
  MousePointerClick,
  Building,
  ArrowUpRight,
  Calculator,
  Layers,
  Flame,
  BadgePercent
} from "lucide-react";

// ─── Data & Constants ─────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Users,
    title: "Apply in 2 Minutes",
    description:
      "Fill out our straightforward affiliate form. Tell us how you plan to promote, and get onboarded quickly.",
    badge: "Fast Approval",
  },
  {
    step: "02",
    icon: Globe,
    title: "Pick Any Course",
    description:
      "Browse our live marketplace. Authors configure their own affiliate rates from 10% up to 70% per enrollment.",
    badge: "10%–70% Rates",
  },
  {
    step: "03",
    icon: Link2,
    title: "Get Your 1-Click Link",
    description:
      "Generate trackable affiliate links with your unique referral code. Every click is tracked with a 30-day cookie window.",
    badge: "30-Day Cookie",
  },
  {
    step: "04",
    icon: Wallet,
    title: "Direct Bank Payouts",
    description:
      "Commissions are automatically credited to your partner balance upon student payment. Withdraw to your bank anytime.",
    badge: "24–48h SLA",
  },
];

const BENEFITS = [
  {
    icon: BadgePercent,
    title: "Author-Set Commissions",
    description:
      "No generic flat rates. Earn anywhere between 10% and 70% per sale, configured transparently by course authors.",
  },
  {
    icon: BarChart3,
    title: "Live Conversion Analytics",
    description:
      "Track every click, referral visit, and completed course purchase in real-time from your dedicated partner dashboard.",
  },
  {
    icon: Wallet,
    title: "Direct Nigerian Bank Transfers",
    description:
      "Zero hassle withdrawals. Receive your earnings directly into Opay, PalmPay, GTBank, Kuda, Access, or any Nigerian bank.",
  },
  {
    icon: Layers,
    title: "Multiple Income Streams",
    description:
      "Promote multiple courses simultaneously. Each product gets its own independent link and customized payout.",
  },
  {
    icon: Award,
    title: "Ready-to-Use Marketing Kit",
    description:
      "Access high-converting flyers, social banners, WhatsApp broadcast scripts, and promo copy curated by top creators.",
  },
  {
    icon: ShieldCheck,
    title: "Guaranteed Attribution",
    description:
      "Our dual cookie and localStorage tracking ensures you never lose a referral, even if the student enrolls weeks later.",
  },
];

const FEATURED_COURSES = [
  {
    id: "c1e11cc7-d8f6-4c2d-8a3b-1bb204892921",
    title: "AI Automation with n8n",
    author: "Femi Adeleke",
    price: 3000,
    rate: 20,
    commission: 600,
    category: "AI & Workflow Automation",
    badge: "High Conversion • Advert Ready",
    highlight: true,
  },
  {
    id: "fullstack-nextjs-pro",
    title: "Modern Fullstack Next.js & TypeScript Mastery",
    author: "AutoLearn Engineering",
    price: 25000,
    rate: 30,
    commission: 7500,
    category: "Software Engineering",
    badge: "High-Ticket Payout",
    highlight: false,
  },
  {
    id: "meta-ads-growth",
    title: "High-Impact Paid Advertising & Funnel Mastery",
    author: "Growth Labs",
    price: 15000,
    rate: 25,
    commission: 3750,
    category: "Digital Marketing",
    badge: "Popular Course",
    highlight: false,
  },
  {
    id: "python-data-automation",
    title: "Python Automation & Data Engineering Cohort",
    author: "Dr. Alex Omokaro",
    price: 20000,
    rate: 35,
    commission: 7000,
    category: "Data & Automation",
    badge: "Top Commission Rate",
    highlight: false,
  },
];

const PARTNER_TESTIMONIALS = [
  {
    name: "Marvellous Olaoluwa",
    school: "University of Ibadan • Tech Creator",
    image: "/Partners/Ola.png",
    review:
      "The product-based affiliate marketplace changed everything for me. I promote courses directly to my WhatsApp tech community, and every sale lands straight into my wallet. Withdrawals to my Opay take under 24 hours.",
    rating: 5,
    earningsBadge: "Over ₦180,000 Earned",
  },
  {
    name: "Oluwapelumi Samson",
    school: "University of Ibadan • Student Advocate",
    image: "/Partners/Samson.png",
    review:
      "Generating unique links for specific courses takes literally two clicks. The dashboard shows clicks and conversions in real time, so I always know which marketing strategy is working best.",
    rating: 5,
    earningsBadge: "Top Converting Partner",
  },
  {
    name: "Isaac Moon",
    school: "Data Analyst & Content Creator",
    image: "/Partners/Isaac.png",
    review:
      "What impressed me most is total transparency. I see the exact author commission before generating my link. The 30-day tracking cookie ensures I get credited even if students return later to complete checkout.",
    rating: 5,
    earningsBadge: "100% On-Time Payouts",
  },
  {
    name: "Beloved Justina",
    school: "Digital Growth Marketer",
    image: "/Partners/Beloved.png",
    review:
      "I partnered because the model is honest and empowering. Authors choose their own reward rates, I pick courses I believe in, and students get world-class African education. Everyone wins.",
    rating: 5,
    earningsBadge: "Verified Partner",
  },
];

const FAQS = [
  {
    q: "How do I become an affiliate partner?",
    a: "Click 'Apply as Affiliate Partner' and submit your details. Our team reviews your application quickly (typically within 24–48 hours) and sends onboarding access directly to your email.",
  },
  {
    q: "How much commission do I earn per course sale?",
    a: "Course authors set their own commission rate, usually between 10% and 70% of the course price. For example, a ₦20,000 course with a 30% rate pays you ₦6,000 for every single student enrollment.",
  },
  {
    q: "How does the product-based tracking work?",
    a: "Instead of generic codes, you generate product-specific links (e.g. /marketplace/ai-automation-with-n8n?ref=YOUR_CODE). When someone clicks your link, their browser saves your referral tag for 30 days. Any purchase made within that window is credited directly to you.",
  },
  {
    q: "When and how do I receive my money?",
    a: "Once a student's payment is verified, your commission is credited to your available balance. You can request a withdrawal at any time directly into your Nigerian bank account (Opay, GTBank, Kuda, Access, etc.) with payouts processed within 24–48 hours.",
  },
  {
    q: "Are there any fees or hidden costs to join?",
    a: "None. Joining the AutoLearn Spot Affiliate Partner Program is 100% free. There are zero registration fees, zero maintenance charges, and no platform deductions from your approved commissions.",
  },
  {
    q: "Can I promote courses on social media and paid ads?",
    a: "Yes! Many of our highest-earning affiliates drive traffic through Facebook and Instagram paid ads, TikTok reels, YouTube tutorials, LinkedIn posts, and dedicated WhatsApp educational groups.",
  },
];

const SUPPORTED_BANKS = [
  "Opay",
  "PalmPay",
  "GTBank",
  "Kuda Bank",
  "Access Bank",
  "Zenith Bank",
  "First Bank",
  "UBA",
];

// ─── Sections ─────────────────────────────────────────────────────────────────

function HeroSection() {
  const [copiedLink, setCopiedLink] = useState(false);
  const sampleRefUrl = "autolearnspot.com/marketplace/ai-automation-with-n8n?ref=1361EDEB";

  const handleCopySample = () => {
    navigator.clipboard.writeText(`https://${sampleRefUrl}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <section className="relative pt-6 pb-16 md:pt-14 md:pb-24 overflow-hidden bg-brand-bg">
      {/* Subtle modern dot-grid background */}
      <div className="absolute inset-0 z-0 bg-brand-bg bg-[radial-gradient(#10b981_0.8px,transparent_0.8px)] [background-size:20px_20px] opacity-40 dark:opacity-20" />

      {/* Radiant ambient glow accents */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column – Persuasive Copy & CTAs (7 cols) */}
          <div className="lg:col-span-7 max-w-2xl">
            
            {/* Live Program Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-semibold mb-6 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Official Affiliate Partner Network</span>
            </div>

            {/* High-Impact Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-heading font-black text-brand-text tracking-tight mb-6 leading-[1.08]">
              Turn Your Audience{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
                Into Daily Income.
              </span>
            </h1>

            {/* Informative Subtitle */}
            <p className="text-base sm:text-lg text-brand-text/75 mb-8 max-w-xl leading-relaxed">
              Join AutoLearn Spot’s product-based affiliate marketplace. Choose high-converting tech courses, share your personal trackable link in 1-click, and earn up to <strong className="text-brand-text font-bold">70% commission</strong> per enrollment — paid directly to your Nigerian bank.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-10">
              <Link
                href="/partners/apply"
                className="group flex items-center justify-center gap-2.5 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all duration-200 shadow-md hover:shadow-emerald-500/20 hover:-translate-y-0.5 text-sm sm:text-base text-center"
              >
                <span>Apply as Affiliate Partner</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/partners/dashboard"
                className="flex items-center justify-center gap-2 px-7 py-4 bg-transparent border-2 border-brand-border hover:border-emerald-500/50 hover:bg-emerald-500/5 text-brand-text font-bold rounded-2xl transition-all duration-200 text-sm sm:text-base text-center"
              >
                <span>Partner Dashboard</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              </Link>
            </div>

            {/* Core Trust Pillars */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-brand-border/60 max-w-lg mb-8">
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-black text-brand-text flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 30-Day
                </span>
                <span className="text-[11px] sm:text-xs text-brand-text/60">Cookie Window</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-black text-brand-text flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" /> 24–48h
                </span>
                <span className="text-[11px] sm:text-xs text-brand-text/60">Direct Bank SLA</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-black text-brand-text flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" /> 100% Free
                </span>
                <span className="text-[11px] sm:text-xs text-brand-text/60">Zero Signup Fees</span>
              </div>
            </div>

            {/* Community Social Proof */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2.5">
                {["/Partners/Ola.png", "/Partners/Samson.png", "/Partners/Isaac.png", "/Partners/Beloved.png"].map(
                  (src, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 bg-brand-bg overflow-hidden relative shadow-xs"
                    >
                      <Image src={src} alt="Verified Partner" fill className="object-cover" />
                    </div>
                  )
                )}
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-brand-text">Join 15+ community advocates & creators</p>
                <p className="text-[11px] sm:text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> ₦100,000+ total commissions earned
                </p>
              </div>
            </div>
          </div>

          {/* Right Column – High-Fidelity Modern Dashboard Preview (5 cols) */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0">
            
            {/* Top Floating Badge */}
            <div className="absolute -top-4 -right-2 sm:-right-4 z-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-white/20">
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>Up to 70% commission</span>
            </div>

            {/* Dashboard Mock Card Container */}
            <div className="relative rounded-3xl border border-brand-border/80 bg-[var(--card)]/90 backdrop-blur-xl p-5 sm:p-7 shadow-2xl transition-all duration-300 hover:border-emerald-500/40">
              
              {/* Header inside preview */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-brand-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    FA
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-text leading-tight">Femi Adeleke</p>
                    <p className="text-[10px] text-emerald-600 font-medium">Partner ID: ALS0002</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active Partner
                </div>
              </div>

              {/* KPI Stat Cards Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-3.5 rounded-2xl bg-brand-bg/80 border border-brand-border/60">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-brand-text/60 mb-1">
                    <span>Available Balance</span>
                    <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-emerald-600">
                    ₦24,500
                  </div>
                  <p className="text-[10px] text-emerald-600/80 font-medium mt-0.5">Ready for withdrawal</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-brand-bg/80 border border-brand-border/60">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-brand-text/60 mb-1">
                    <span>Pending Earnings</span>
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-brand-text">
                    ₦7,500
                  </div>
                  <p className="text-[10px] text-brand-text/50 font-medium mt-0.5">Clears in 5 days</p>
                </div>
              </div>

              {/* Active Course Link Spotlight with Interactive Copy */}
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-brand-text flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" /> Active Course Promotion
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 font-bold text-[10px]">
                    20% Comm (₦600/sale)
                  </span>
                </div>
                <p className="text-xs font-semibold text-brand-text mb-2.5 truncate">
                  AI Automation with n8n
                </p>

                {/* Simulated Link Bar with 1-Click Interactive Copy */}
                <div className="flex items-center gap-1.5 bg-brand-bg border border-brand-border/70 rounded-xl p-1.5">
                  <input
                    type="text"
                    readOnly
                    value={sampleRefUrl}
                    className="flex-1 bg-transparent text-[11px] font-mono text-brand-text/80 px-2 outline-none select-all truncate"
                  />
                  <button
                    onClick={handleCopySample}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                      copiedLink
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600"
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* High-Contrast Monthly Earnings Trend Chart */}
              <div className="p-4 rounded-2xl bg-brand-bg/80 border border-brand-border/60">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-bold text-brand-text flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Monthly Earnings Trend
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-600">Total: ₦52,000</span>
                </div>

                <div className="flex items-end gap-1.5 h-20 pt-2 px-1">
                  {[20, 30, 25, 45, 40, 55, 50, 70, 65, 80, 100, 35].map((height, i) => {
                    const isCurrent = i === 10;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                        <div
                          className={`w-full rounded-t-md transition-all ${
                            isCurrent
                              ? "bg-gradient-to-t from-emerald-600 to-teal-400 shadow-xs"
                              : "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
                          }`}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between text-[10px] font-semibold text-brand-text/40 pt-2 border-t border-brand-border/40 mt-2">
                  <span>Jan</span>
                  <span>Apr</span>
                  <span>Jul</span>
                  <span className="text-emerald-600 font-bold">Nov (Active)</span>
                  <span>Dec</span>
                </div>
              </div>

              {/* Bottom Verified Payout Toast */}
              <div className="mt-4 flex items-center justify-between text-[11px] text-brand-text/70 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>₦24,500 Payout Approved</span>
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                  Sent to Bank • 2h ago
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InteractiveEarningsCalculator() {
  const [coursePrice, setCoursePrice] = useState(15000);
  const [commissionRate, setCommissionRate] = useState(30);
  const [monthlySales, setMonthlySales] = useState(15);

  const commissionPerSale = Math.round(coursePrice * (commissionRate / 100));
  const estimatedMonthly = commissionPerSale * monthlySales;
  const estimatedAnnual = estimatedMonthly * 12;

  const presets = [
    { label: "Starter (5 sales/mo)", sales: 5, price: 10000, rate: 25 },
    { label: "Active Marketer (15 sales/mo)", sales: 15, price: 15000, rate: 30 },
    { label: "Top Community Leader (50 sales/mo)", sales: 50, price: 20000, rate: 35 },
  ];

  return (
    <section className="py-16 md:py-24 bg-brand-bg border-t border-brand-border/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs sm:text-sm font-semibold mb-4 border border-emerald-500/20">
            <Calculator className="w-4 h-4" />
            <span>Interactive Profit Estimator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-brand-text mb-4">
            How Much Can You Earn?
          </h2>
          <p className="text-base text-brand-text/70 leading-relaxed">
            Move the sliders below to calculate your projected monthly and annual affiliate earnings based on course price, author commission rates, and your audience reach.
          </p>
        </div>

        {/* Calculator Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          
          {/* Sliders Card (7 cols) */}
          <div className="lg:col-span-7 bg-[var(--card)]/90 backdrop-blur-xl border border-brand-border rounded-3xl p-6 sm:p-8 shadow-lg">
            
            {/* Quick Presets */}
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-text/50 mb-2.5">
                Quick Preset Scenarios
              </p>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setMonthlySales(p.sales);
                      setCoursePrice(p.price);
                      setCommissionRate(p.rate);
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-brand-border hover:border-emerald-500/50 hover:bg-emerald-500/5 text-brand-text transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 1: Course Price */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-brand-text">Average Course Price</label>
                <span className="font-mono text-base font-black text-emerald-600">
                  ₦{coursePrice.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={3000}
                max={50000}
                step={1000}
                value={coursePrice}
                onChange={(e) => setCoursePrice(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[11px] text-brand-text/40 mt-1">
                <span>₦3,000</span>
                <span>₦25,000</span>
                <span>₦50,000</span>
              </div>
            </div>

            {/* Slider 2: Author Commission Rate */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-brand-text">Author Commission Rate</label>
                <span className="font-mono text-base font-black text-emerald-600">
                  {commissionRate}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={70}
                step={5}
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[11px] text-brand-text/40 mt-1">
                <span>10% (Entry)</span>
                <span>35% (Average)</span>
                <span>70% (Top Author Rate)</span>
              </div>
            </div>

            {/* Slider 3: Monthly Course Sales */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-brand-text">Estimated Monthly Enrollments</label>
                <span className="font-mono text-base font-black text-emerald-600">
                  {monthlySales} {monthlySales === 1 ? "Sale" : "Sales"}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={monthlySales}
                onChange={(e) => setMonthlySales(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[11px] text-brand-text/40 mt-1">
                <span>1 sale</span>
                <span>50 sales</span>
                <span>100 sales/mo</span>
              </div>
            </div>
          </div>

          {/* Earnings Display Card (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-7 sm:p-8 shadow-2xl relative flex flex-col justify-between">
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold">
              Direct Bank Deposit
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-emerald-100 font-bold mb-2">
                Projected Monthly Payout
              </p>
              <div className="text-4xl sm:text-5xl font-black tracking-tight mb-2">
                ₦{estimatedMonthly.toLocaleString()}
              </div>
              <p className="text-xs text-emerald-100/90 leading-relaxed mb-6">
                Based on earning <strong className="text-white font-bold">₦{commissionPerSale.toLocaleString()}</strong> per course sale across {monthlySales} student purchases.
              </p>

              <div className="space-y-3.5 pt-5 border-t border-white/20 mb-8">
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-100">Commission Per Sale:</span>
                  <span className="font-bold text-white font-mono">₦{commissionPerSale.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-100">Annual Projection:</span>
                  <span className="font-bold text-white font-mono">₦{estimatedAnnual.toLocaleString()}/yr</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-100">Withdrawal Schedule:</span>
                  <span className="font-bold text-white">Weekly / On-Demand</span>
                </div>
              </div>
            </div>

            <Link
              href="/partners/apply"
              className="w-full py-4 bg-white hover:bg-emerald-50 text-emerald-800 font-bold rounded-2xl text-center text-sm transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <span>Claim Your Partner Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedMarketplaceCoursesSection() {
  return (
    <section className="py-16 md:py-24 bg-brand-bg border-t border-brand-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs sm:text-sm font-semibold mb-3 border border-emerald-500/20">
              <Globe className="w-4 h-4" />
              <span>Available Marketplace Catalog</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-brand-text">
              Courses You Can Promote Today
            </h2>
            <p className="text-sm sm:text-base text-brand-text/70 mt-2 max-w-xl">
              Preview real courses published on AutoLearn Spot. Once approved, you can generate 1-click affiliate links for all of them.
            </p>
          </div>

          <Link
            href="/partners/apply"
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors self-start md:self-auto"
          >
            <span>Apply to Unlock All Courses</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Course Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_COURSES.map((course) => (
            <div
              key={course.id}
              className={`bg-[var(--card)]/90 backdrop-blur-xl border rounded-3xl p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group ${
                course.highlight
                  ? "border-emerald-500/50 ring-2 ring-emerald-500/20"
                  : "border-brand-border hover:border-emerald-500/40"
              }`}
            >
              <div>
                {/* Badge & Category */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold text-brand-text/50 uppercase tracking-wider truncate">
                    {course.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                    {course.rate}% Comm
                  </span>
                </div>

                {/* Course Title */}
                <h3 className="text-base font-bold text-brand-text mb-1 group-hover:text-emerald-600 transition-colors line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-xs text-brand-text/60 mb-4">By {course.author}</p>

                {/* Pricing & Earnings Pill */}
                <div className="p-3 rounded-2xl bg-brand-bg/90 border border-brand-border/70 mb-4 space-y-2">
                  <div className="flex justify-between text-xs text-brand-text/70">
                    <span>Course Price:</span>
                    <span className="font-mono font-bold text-brand-text">₦{course.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-600 font-bold pt-1.5 border-t border-brand-border/50">
                    <span>You Earn / Sale:</span>
                    <span className="font-mono text-sm font-black text-emerald-600">
                      ₦{course.commission.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href="/partners/apply"
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 hover:text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
              >
                <span>Promote This Course</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="py-16 md:py-24 bg-brand-bg border-t border-brand-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs sm:text-sm font-semibold mb-4 border border-emerald-500/20">
            <Zap className="w-4 h-4" />
            <span>Simple 4-Step Process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-brand-text mb-4">
            How The Partner Program Works
          </h2>
          <p className="text-sm sm:text-base text-brand-text/70 leading-relaxed">
            From free application to your first bank withdrawal in four transparent steps.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {HOW_IT_WORKS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative bg-[var(--card)]/90 backdrop-blur-xl border border-brand-border rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
              >
                {/* Big Step Number in Watermark */}
                <div className="absolute top-4 right-4 text-4xl sm:text-5xl font-black text-emerald-600/10 leading-none select-none font-mono">
                  {item.step}
                </div>

                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <Icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                  </div>

                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1">
                    {item.badge}
                  </span>

                  <h3 className="font-bold text-base sm:text-lg text-brand-text mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-brand-text/70 leading-relaxed">
                    {item.description}
                  </p>
                </div>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs sm:text-sm font-semibold mb-4 border border-emerald-500/20">
            <Award className="w-4 h-4" />
            <span>Why Partners Choose Us</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-brand-text mb-4">
            Built for High-Earning Affiliates
          </h2>
          <p className="text-sm sm:text-base text-brand-text/70">
            Everything you need to turn your social media, community, or ad funnels into recurring passive income.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="bg-[var(--card)]/90 backdrop-blur-xl border border-brand-border rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-base sm:text-lg text-brand-text mb-2">{b.title}</h3>
                <p className="text-xs sm:text-sm text-brand-text/70 leading-relaxed">
                  {b.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Supported Banks Bar */}
        <div className="mt-14 p-6 rounded-3xl bg-[var(--card)]/80 border border-brand-border/70 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-text/50 mb-4">
            Direct 24–48h Transfers Supported Across All Major Nigerian Banks
          </p>
          <div className="flex flex-wrap justify-center items-center gap-2.5 sm:gap-4">
            {SUPPORTED_BANKS.map((bank) => (
              <span
                key={bank}
                className="px-3.5 py-1.5 rounded-xl bg-brand-bg border border-brand-border text-xs font-bold text-brand-text/80 shadow-2xs"
              >
                {bank}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24 bg-brand-bg border-t border-brand-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs sm:text-sm font-semibold mb-4 border border-emerald-500/20">
            <Star className="w-4 h-4 fill-emerald-600" />
            <span>Partner Stories</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-brand-text mb-4">
            What Our Partners Say
          </h2>
          <p className="text-sm sm:text-base text-brand-text/70">
            Real feedback from creators, influencers, and advocates earning every week.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PARTNER_TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-[var(--card)]/90 backdrop-blur-xl border border-brand-border rounded-3xl p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-500/40 overflow-hidden shrink-0 relative">
                    <Image src={t.image} alt={t.name} fill className="object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-brand-text text-sm">{t.name}</p>
                    <p className="text-[11px] text-brand-text/50 truncate max-w-[140px]">{t.school}</p>
                  </div>
                </div>

                <div className="flex gap-0.5 mb-3">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-brand-text/75 leading-relaxed italic">
                  "{t.review}"
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-brand-border/50">
                <span className="inline-block text-[11px] font-bold text-emerald-600">
                  {t.earningsBadge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-16 md:py-24 bg-brand-bg border-t border-brand-border/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-brand-text mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-brand-text/70">
            Everything you need to know about promoting and earning with AutoLearn Spot.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="bg-[var(--card)]/90 backdrop-blur-xl border border-brand-border rounded-2xl overflow-hidden shadow-xs transition-all"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-emerald-500/5 transition-colors cursor-pointer"
              >
                <span className="font-bold text-brand-text text-sm sm:text-base pr-4">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-emerald-600 shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-xs sm:text-sm text-brand-text/70 leading-relaxed border-t border-brand-border/40 pt-4">
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white rounded-4xl p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden">
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs sm:text-sm font-bold mb-6 border border-white/20">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Ready to Monetize Your Audience?</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black mb-5 tracking-tight leading-tight">
              Start Earning Up to 70% per Enrollment Today.
            </h2>

            <p className="text-emerald-100 text-sm sm:text-base mb-8 leading-relaxed">
              Join Nigeria's fastest growing tech educational affiliate network. Free application, 1-click links, and weekly automated bank transfers.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3.5">
              <Link
                href="/partners/apply"
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-emerald-50 text-emerald-800 font-bold rounded-2xl transition-all duration-200 shadow-lg text-sm sm:text-base hover:scale-[1.02]"
              >
                <span>Apply as Affiliate Partner</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/partners/dashboard"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-white/40 hover:border-white hover:bg-white/10 text-white font-bold rounded-2xl transition-all duration-200 text-sm sm:text-base"
              >
                <span>Partner Dashboard</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StandardSiteFooter() {
  const [settings, setSettings] = useState<any>({
    siteName: "AutoLearn Spot",
    siteTagline: "Learn without limits. Accelerate your growth with premium courses and AI automation.",
    footerCopyrightText: `© ${new Date().getFullYear()} AutoLearn Spot. All rights reserved.`,
  });

  useEffect(() => {
    async function load() {
      try {
        const loaded = await getPublicSettings([
          "footerCopyrightText",
          "siteName",
          "footerPrivacyLink",
          "footerTermsLink",
          "footerDescription",
          "siteTagline",
          "footerContactLink",
          "facebookUrl",
          "instagramUrl",
          "twitterUrl",
          "linkedinUrl",
          "youtubeUrl",
          "supportEmail",
        ]);
        if (loaded) setSettings((prev: any) => ({ ...prev, ...loaded }));
      } catch (e) {
        // use defaults
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
                <Link href="/courses" className="text-brand-text/70 hover:text-emerald-600 text-sm transition-colors">
                  All Courses
                </Link>
              </li>
              <li>
                <Link href="/skills" className="text-brand-text/70 hover:text-emerald-600 text-sm transition-colors">
                  Skills
                </Link>
              </li>
              <li>
                <Link href="/authors" className="text-brand-text/70 hover:text-emerald-600 text-sm transition-colors">
                  Authors
                </Link>
              </li>
              <li>
                <Link href="/autolearn-ai" className="text-brand-text/70 hover:text-emerald-600 text-sm transition-colors">
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
                <Link href="/about" className="text-brand-text/70 hover:text-emerald-600 text-sm transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/partners" className="text-emerald-600 font-bold text-sm transition-colors">
                  Affiliate Program
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-brand-text/70 hover:text-emerald-600 text-sm transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/career" className="text-brand-text/70 hover:text-emerald-600 text-sm transition-colors">
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
                  className="w-10 h-10 rounded-full border border-brand-border/50 bg-brand-bg flex items-center justify-center text-brand-text/70 hover:text-emerald-600 hover:border-emerald-600 transition-all"
                >
                  <span className="font-bold text-xs">FB</span>
                </a>
              )}
              {settings.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-brand-border/50 bg-brand-bg flex items-center justify-center text-brand-text/70 hover:text-emerald-600 hover:border-emerald-600 transition-all"
                >
                  <span className="font-bold text-xs">IG</span>
                </a>
              )}
              {settings.twitterUrl && (
                <a
                  href={settings.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-brand-border/50 bg-brand-bg flex items-center justify-center text-brand-text/70 hover:text-emerald-600 hover:border-emerald-600 transition-all"
                >
                  <span className="font-bold text-xs">X</span>
                </a>
              )}
              {settings.linkedinUrl && (
                <a
                  href={settings.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-brand-border/50 bg-brand-bg flex items-center justify-center text-brand-text/70 hover:text-emerald-600 hover:border-emerald-600 transition-all"
                >
                  <span className="font-bold text-xs">IN</span>
                </a>
              )}
              {settings.supportEmail && (
                <a
                  href={`mailto:${settings.supportEmail}`}
                  className="w-10 h-10 rounded-full border border-brand-border/50 bg-brand-bg flex items-center justify-center text-brand-text/70 hover:text-emerald-600 hover:border-emerald-600 transition-all"
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
            {settings.footerCopyrightText || `© ${new Date().getFullYear()} ${settings.siteName || "AutoLearn Spot"}. All rights reserved.`}
          </p>
          <div className="flex gap-6">
            <Link href={settings.footerPrivacyLink || "/privacy"} className="text-brand-text/60 hover:text-emerald-600 text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href={settings.footerTermsLink || "/terms"} className="text-brand-text/60 hover:text-emerald-600 text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Landing Page Component ──────────────────────────────────────────────

export default function PartnersPage() {
  return (
    <main className="min-h-screen bg-brand-bg">
      <MarketplaceNavigation />
      <WhatsAppChatModal variant="floating" />
      <AutolearnBot />
      <HeroSection />
      <InteractiveEarningsCalculator />
      <FeaturedMarketplaceCoursesSection />
      <HowItWorksSection />
      <BenefitsSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <StandardSiteFooter />
    </main>
  );
}
