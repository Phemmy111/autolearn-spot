"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import { useDirectEnrollmentFee } from "@/hooks/useDirectEnrollmentFee";
import {
  ArrowRight,
  ArrowDown,
  Users,
  DollarSign,
  Building2,
  Award,
  Zap,
  BarChart3,
  TrendingUp,
  Star,
  MessageCircle,
  Shield,
  Rocket,
  Target,
  Globe,
  FileText,
  Clock,
  Crown,
  Medal,
  Building,
  Infinity,
  CheckCircle
} from "lucide-react";
import { socialLinks } from "@/config/social";
import { AutolearnBot } from '@/components/autolearn-bot';
import { WhatsAppChatModal } from '@/components/whatsapp-chat-modal';
import { PartnerTypesSection } from './PartnerTypesSection';

const HOW_IT_WORKS = [
  { step: "1", title: "Apply", description: "Submit your partner application" },
  { step: "2", title: "Get Approved", description: "Review and approval process" },
  { step: "3", title: "Receive Dashboard", description: "Get access to partner dashboard" },
  { step: "4", title: "Share Referral Link", description: "Promote using your unique link" },
  { step: "5", title: "Student Enrolls", description: "Students enroll via your link" },
  { step: "6", title: "Receive Commission", description: "Earn commissions on successful enrollments" }
];

const PARTNER_TESTIMONIALS = [
  {
    name: "Marvellous Olaoluwa",
    school: "University of Ibadan",
    image: "/Partners/Ola.png",
    review: "I joined because I believe AI automation is one of the most valuable digital skills anyone can learn today. AutoLearn Spot provides everything a partner needs to confidently recommend the training.",
    rating: 5
  },
  {
    name: "Oluwapelumi Samson",
    school: "University of Ibadan",
    image: "/Partners/Samson.png",
    review: "The referral dashboard and marketing materials are easy to use. I already have my referral link and I'm excited to introduce more students to AI automation.",
    rating: 5
  },
  {
    name: "Isaac Moon",
    school: "Data Analyst - LAUTECH Graduate",
    image: "/Partners/Isaac.png",
    review: "What impressed me most is the professionalism of the entire program. The partner system is transparent and makes referral tracking very easy.",
    rating: 5
  },
  {
    name: "Beloved Justina",
    school: "Data Analyst - University of Ilorin Graduate",
    image: "/Partners/Beloved.png",
    review: "I partnered with AutoLearn Spot because I genuinely believe more students deserve access to practical AI skills while partners also earn legitimate commissions.",
    rating: 5
  }
];

const ACTIVITY_FEED = [
  "Deborah from Lagos just enrolled",
  "Samuel became a Community Partner",
  "John from Ibadan completed payment",
  "Isaac received ₦6,000 commission",
  "Blessing withdrew ₦18,000",
  "Ruth from Imo joined AutoLearn Spot"
];

const TRUST_PARTNERS = [
  { name: "Marvellous Olaoluwa", image: "/Partners/Ola.png" },
  { name: "Oluwapelumi Samson", image: "/Partners/Samson.png" },
  { name: "Isaac Moon", image: "/Partners/Isaac.png" },
  { name: "Beloved Justina", image: "/Partners/Beloved.png" }
];

const LEADERBOARD = [
  { rank: 1, name: "Emmanuel David", earnings: "₦45,000", badge: "gold" },
  { rank: 2, name: "Ruth Nwoke", earnings: "₦38,500", badge: "silver" },
  { rank: 3, name: "Jimoh Naheemot", earnings: "₦32,000", badge: "bronze" }
];

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center bg-[#070B12] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#070B12] via-[#0c0e12] to-[#111317]" />
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_50%_50%,rgba(0,245,255,0.1)_0%,transparent_50%)]" />

      <div className="relative max-w-[1280px] mx-auto px-6 lg:px-8 pt-24 md:pt-20 lg:pt-16 pb-12">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-6 lg:space-y-8 flex flex-col justify-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#e2e2e8] leading-tight">
              Earn More.
              <span className="text-[#00F5FF]"> Impact More.</span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-[#b9cacb] leading-relaxed max-w-xl">
              Become an AutoLearn Spot Community Partner and earn commissions by referring students to our AI Automation Training.
            </p>

            <div className="inline-flex items-center gap-2 border border-[#00F5FF]/60 bg-[#00F5FF]/10 px-4 py-2 sm:px-5 sm:py-2.5">
              <DollarSign className="h-5 w-5 text-[#00F5FF]" />
              <span className="font-mono text-sm font-semibold uppercase tracking-[0.14em] text-[#00F5FF]">
                Earn up to ₦1,500 for every successful enrollment
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/partners/apply"
                className="flex items-center justify-center gap-2 border border-[#00F5FF] bg-[#00F5FF] px-5 py-3 sm:px-6 sm:py-3 lg:px-8 lg:py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#070B12] transition duration-150 hover:translate-y-[-1px] hover:shadow-[0_0_0_1px_rgba(0,245,255,0.45)] w-full sm:w-auto"
              >
                Apply as Community Partner
              </Link>
              <Link
                href="/partners/dashboard"
                className="flex items-center justify-center gap-2 border border-[#00F5FF] bg-transparent px-5 py-3 sm:px-6 sm:py-3 lg:px-8 lg:py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#00F5FF] transition duration-150 hover:bg-[#00F5FF]/10 w-full sm:w-auto"
              >
                Partner Dashboard
              </Link>
            </div>
          </div>

          <div className="relative order-2 md:order-2 mt-8 md:mt-0">
            <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-4 sm:p-5 lg:p-6 shadow-[0_0_40px_rgba(0,245,255,0.1)]">
              <div className="absolute inset-0 bg-[#00F5FF]/5 rounded-2xl blur-xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#b9cacb]">Partner Dashboard Preview</span>
                  <div className="flex gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#00F5FF]" />
                    <div className="h-2 w-2 rounded-full bg-[#333539]" />
                    <div className="h-2 w-2 rounded-full bg-[#333539]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4">
                  <div className="border border-[#1f2229] bg-[#070B12]/50 rounded-lg p-2 sm:p-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#b9cacb] mb-1">Available Balance</div>
                    <div className="text-base sm:text-lg lg:text-xl font-bold text-[#00F5FF]">₦24,500</div>
                  </div>
                  <div className="border border-[#1f2229] bg-[#070B12]/50 rounded-lg p-2 sm:p-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#b9cacb] mb-1">Pending Earnings</div>
                    <div className="text-base sm:text-lg lg:text-xl font-bold text-[#e2e2e8]">₦7,500</div>
                  </div>
                  <div className="border border-[#1f2229] bg-[#070B12]/50 rounded-lg p-2 sm:p-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#b9cacb] mb-1">Total Referrals</div>
                    <div className="text-base sm:text-lg lg:text-xl font-bold text-[#e2e2e8]">127</div>
                  </div>
                  <div className="border border-[#1f2229] bg-[#070B12]/50 rounded-lg p-2 sm:p-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#b9cacb] mb-1">Successful Enrollments</div>
                    <div className="text-base sm:text-lg lg:text-xl font-bold text-[#e2e2e8]">89</div>
                  </div>
                </div>

                <div className="border border-[#1f2229] bg-[#070B12]/50 rounded-lg p-2 sm:p-3 lg:p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#b9cacb] mb-2">Monthly Earnings</div>
                  <div className="h-16 sm:h-20 lg:h-24 flex items-end gap-1">
                    {[30, 45, 25, 60, 40, 55, 35, 70, 50, 65, 45, 75].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-[#00F5FF]/20 rounded-t transition-all hover:bg-[#00F5FF]/40"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-[#00F5FF]/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-purple-500/20 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="py-4 sm:py-6 lg:py-8 bg-[#0c0e12]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="text-center mb-3 sm:mb-4 lg:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#e2e2e8] mb-2 sm:mb-3 lg:mb-4">Trusted by Partners</h2>
          <p className="text-sm sm:text-base text-[#b9cacb]">Join our growing community of successful partners</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8">
          {TRUST_PARTNERS.map((partner, index) => (
            <div key={index} className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full border-2 border-[#00F5FF]/30 overflow-hidden">
                <Image
                  src={partner.image}
                  alt={partner.name}
                  width={80}
                  height={80}
                  className="object-cover"
                />
              </div>
              <span className="text-xs sm:text-sm text-[#e2e2e8]">{partner.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="py-4 sm:py-6 lg:py-8 bg-[#0c0e12]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="text-center mb-3 sm:mb-4 lg:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#e2e2e8] mb-2 sm:mb-3 lg:mb-4">How It Works</h2>
          <p className="text-sm sm:text-base text-[#b9cacb]">Simple steps to start earning</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {HOW_IT_WORKS.map((item, index) => (
            <div key={index} className="border border-[#1f2229] bg-[#070B12]/50 rounded-xl p-4 sm:p-5 lg:p-6">
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center border border-[#00F5FF]/30 bg-[#00F5FF]/10 rounded-lg font-mono text-base sm:text-lg font-bold text-[#00F5FF]">
                  {item.step}
                </div>
                <h3 className="font-semibold text-sm sm:text-base text-[#e2e2e8]">{item.title}</h3>
              </div>
              <p className="text-sm text-[#b9cacb]">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-4 sm:py-6 lg:py-8 bg-[#070B12]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="text-center mb-3 sm:mb-4 lg:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#e2e2e8] mb-2 sm:mb-3 lg:mb-4">What Partners Say</h2>
          <p className="text-sm sm:text-base text-[#b9cacb]">Hear from our successful partners</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {PARTNER_TESTIMONIALS.map((testimonial, index) => (
            <div key={index} className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-4 sm:p-5 lg:p-6">
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full border-2 border-[#00F5FF]/30 overflow-hidden flex-shrink-0">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-[#e2e2e8]">{testimonial.name}</h3>
                  <p className="text-xs sm:text-sm text-[#b9cacb]">{testimonial.school}</p>
                  <div className="flex gap-1 mt-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-[#00F5FF] fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-[#b9cacb] italic">"{testimonial.review}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ActivityFeedSection() {
  return (
    <section className="py-4 sm:py-6 lg:py-8 bg-[#0c0e12]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="text-center mb-3 sm:mb-4 lg:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#e2e2e8] mb-2 sm:mb-3 lg:mb-4">Live Activity</h2>
          <p className="text-sm sm:text-base text-[#b9cacb]">Real-time partner activity</p>
        </div>
        
        <div className="border border-[#1f2229] bg-[#070B12]/50 rounded-2xl p-4 sm:p-5 lg:p-6">
          <div className="space-y-2 sm:space-y-3 lg:space-y-4">
            {ACTIVITY_FEED.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 text-sm text-[#b9cacb]">
                <div className="h-2 w-2 rounded-full bg-[#00F5FF]" />
                {activity}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LeaderboardSection() {
  return (
    <section className="py-4 sm:py-6 lg:py-8 bg-[#070B12]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="text-center mb-3 sm:mb-4 lg:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#e2e2e8] mb-2 sm:mb-3 lg:mb-4">Top Partners</h2>
          <p className="text-sm sm:text-base text-[#b9cacb]">Leaderboard of this month</p>
        </div>
        
        <div className="border border-[#1f2229] bg-[#0c0e12]/50 rounded-2xl overflow-hidden">
          {LEADERBOARD.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 sm:p-4 lg:p-5 border-b border-[#1f2229] last:border-b-0">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center border border-[#00F5FF]/30 bg-[#00F5FF]/10 rounded-lg font-mono text-xs sm:text-sm font-bold text-[#00F5FF]">
                  {item.rank}
                </div>
                <span className="text-xs sm:text-sm lg:text-base text-[#e2e2e8]">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <span className="text-xs sm:text-sm lg:text-base text-[#00F5FF] font-semibold">{item.earnings}</span>
                {item.badge === 'gold' && <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />}
                {item.badge === 'silver' && <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />}
                {item.badge === 'bronze' && <Award className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  const faqs = [
    {
      question: "How do I become a partner?",
      answer: "Simply apply through our partner application form. Once approved, you'll receive your referral link and dashboard access."
    },
    {
      question: "How much can I earn?",
      answer: "You earn ₦1,500 for every successful enrollment through your referral link. There's no limit to your earnings."
    },
    {
      question: "When do I get paid?",
      answer: "Commissions are paid weekly on Fridays after the 7-day withdrawal window closes."
    },
    {
      question: "What's the minimum withdrawal amount?",
      answer: "The minimum withdrawal amount is ₦5,000 to ensure efficient processing."
    }
  ];
  
  return (
    <section className="py-4 sm:py-6 lg:py-8 bg-[#0c0e12]">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-3 sm:mb-4 lg:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#e2e2e8] mb-2 sm:mb-3 lg:mb-4">Frequently Asked Questions</h2>
          <p className="text-sm sm:text-base text-[#b9cacb]">Got questions? We've got answers</p>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-[#1f2229] bg-[#070B12]/80 backdrop-blur-xl rounded-xl overflow-hidden"
            >
              <button
                className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-4 text-left flex items-center justify-between"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-medium text-sm sm:text-base text-[#e2e2e8]">{faq.question}</span>
                <CheckCircle className={`h-5 w-5 text-[#00F5FF] transition-transform ${openIndex === index ? 'rotate-180' : ''}`} />
              </button>
              {openIndex === index && (
                <div className="px-4 sm:px-5 lg:px-6 pb-3 sm:pb-4 text-sm text-[#b9cacb]">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PartnersFooter() {
  return (
    <footer className="border-t border-[#1f2229] bg-[#070B12] py-6 sm:py-8 lg:py-12">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 lg:mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="AutoLearn Spot"
                width={32}
                height={32}
              />
              <span className="font-mono text-sm font-semibold tracking-[0.1em] text-[#e2e2e8]">
                AutoLearn Spot
              </span>
            </div>
            <p className="text-sm text-[#b9cacb] mb-4">
              Become a partner and earn commissions while helping others learn valuable AI automation skills.
            </p>
            <div className="flex gap-3 flex-wrap">
              <a href={socialLinks.facebook.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#b9cacb] hover:text-[#00F5FF] transition-colors">
                Facebook
              </a>
              <a href={socialLinks.linkedin.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#b9cacb] hover:text-[#00F5FF] transition-colors">
                LinkedIn
              </a>
              <a href={socialLinks.instagram.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#b9cacb] hover:text-[#00F5FF] transition-colors">
                Instagram
              </a>
              <a href={socialLinks.tiktok.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#b9cacb] hover:text-[#00F5FF] transition-colors">
                TikTok
              </a>
              <a href={socialLinks.youtube.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#b9cacb] hover:text-[#00F5FF] transition-colors">
                YouTube
              </a>
              <a href={socialLinks.x.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#b9cacb] hover:text-[#00F5FF] transition-colors">
                X
              </a>
              <a href={socialLinks.whatsapp.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#b9cacb] hover:text-[#00F5FF] transition-colors">
                WhatsApp
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-[#e2e2e8] mb-4">Program</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/partners" className="text-sm text-[#00F5FF] hover:text-[#00F5FF]/80 transition-colors">
                  Partner Program
                </Link>
              </li>
              <li>
                <Link href="/partners/apply" className="text-sm text-[#b9cacb] hover:text-[#00F5FF] transition-colors">
                  Apply Now
                </Link>
              </li>
              <li>
                <Link href="/partners/dashboard" className="text-sm text-[#b9cacb] hover:text-[#00F5FF] transition-colors">
                  Partner Dashboard
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-[#e2e2e8] mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-sm text-[#b9cacb] hover:text-[#00F5FF] transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href={socialLinks.whatsapp.url} className="text-sm text-[#b9cacb] hover:text-[#00F5FF] transition-colors">
                  WhatsApp Support
                </a>
              </li>
              <li>
                <Link href="/scholarship" className="text-sm text-[#b9cacb] hover:text-[#00F5FF] transition-colors">
                  Scholarship
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-[#e2e2e8] mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-[#b9cacb] hover:text-[#00F5FF] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/partners" className="text-sm text-[#b9cacb] hover:text-[#00F5FF] transition-colors">
                  Partners
                </Link>
              </li>
              <li>
                <Link href="/scholarship" className="text-sm text-[#b9cacb] hover:text-[#00F5FF] transition-colors">
                  Scholarship
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-[#1f2229] pt-8 text-center">
          <p className="text-sm text-[#b9cacb]">
            © 2026 AutoLearn Spot. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function PartnerPage() {
  return (
    <>
      <HeroSection />
      <TrustSection />
      <PartnerTypesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <ActivityFeedSection />
      <LeaderboardSection />
      <FAQSection />
      <PartnersFooter />
    </>
  );
}

export default function PartnersPage() {
  return (
    <main className="min-h-screen bg-[#070B12]">
      <Navigation />
      <WhatsAppChatModal variant="floating" />
      <AutolearnBot />
      <PartnerPage />
    </main>
  );
}