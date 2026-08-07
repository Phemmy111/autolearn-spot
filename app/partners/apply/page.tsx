"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { socialLinks } from "@/config/social";
import { 
  ArrowLeft, 
  CheckCircle, 
  Loader2, 
  Building2, 
  Megaphone, 
  Users, 
  Sparkles,
  DollarSign,
  Target,
  Award,
  Shield,
  Zap,
  FileText
} from "lucide-react";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", 
  "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", 
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", 
  "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
];

const OCCUPATIONS = [
  "Student", "NYSC", "Employed", "Self-Employed", "Business Owner", "Teacher", "Freelancer", "Other"
];

const BENEFITS = [
  {
    icon: DollarSign,
    title: "₦1,500 Commission",
    description: "Earn for every successful student referral"
  },
  {
    icon: Megaphone,
    title: "Marketing Kit",
    description: "Professional resources and materials provided"
  },
  {
    icon: Building2,
    title: "Partner Dashboard",
    description: "Track performance and commissions in real-time"
  },
  {
    icon: Award,
    title: "Growth Opportunities",
    description: "Progress to higher commission tiers"
  },
  {
    icon: Shield,
    title: "Reliable Payments",
    description: "Weekly withdrawal schedule with 7-day holding period"
  },
  {
    icon: Zap,
    title: "Quick Start",
    description: "Begin earning immediately after approval"
  }
];

function PartnersFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background)] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="AutoLearn Spot"
                width={32}
                height={32}
              />
              <span className="font-mono text-sm font-semibold tracking-[0.1em] text-[var(--foreground)]">
                AutoLearn Spot
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Become a partner and earn commissions while helping others learn valuable AI automation skills.
            </p>
            <div className="flex gap-3 flex-wrap">
              <a href={socialLinks.facebook.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                Facebook
              </a>
              <a href={socialLinks.linkedin.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                LinkedIn
              </a>
              <a href={socialLinks.instagram.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                Instagram
              </a>
              <a href={socialLinks.tiktok.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                TikTok
              </a>
              <a href={socialLinks.youtube.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                YouTube
              </a>
              <a href={socialLinks.x.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                X
              </a>
              <a href={socialLinks.whatsapp.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                WhatsApp
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-4">Program</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/partners" className="text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors">
                  Partner Program
                </Link>
              </li>
              <li>
                <Link href="/partners/apply" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                  Apply Now
                </Link>
              </li>
              <li>
                <Link href="/partners/dashboard" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                  Partner Dashboard
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href={socialLinks.whatsapp.url} className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                  WhatsApp Support
                </a>
              </li>
              <li>
                <Link href="/scholarship" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                  Scholarship
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/partners" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                  Partners
                </Link>
              </li>
              <li>
                <Link href="/scholarship" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
                  Scholarship
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-[var(--border)] pt-8 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            © 2026 AutoLearn Spot. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function PartnerApplicationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Client-side validation
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
      setError("Please agree to the terms and conditions");
      return;
    }

    if (!full_name || !email || !phone || !whatsapp || !state || !occupation || !motivation || !promotion_method) {
      setError("Please fill in all required fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setError("");

    // Log form data for debugging
    console.log('Form data submitted:', {
      full_name,
      email,
      phone,
      whatsapp,
      state,
      occupation,
      motivation,
      promotion_method
    });

    const data = {
      full_name,
      email,
      phone,
      whatsapp,
      state,
      occupation,
      motivation,
      promotion_method,
      // Optional fields
      organization: formData.get("organization"),
      website: formData.get("website"),
      facebook: formData.get("facebook"),
      instagram: formData.get("instagram"),
      tiktok: formData.get("tiktok"),
      linkedin: formData.get("linkedin"),
      youtube: formData.get("youtube"),
      experience: formData.get("experience"),
    };

    try {
      const formDataToSend = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      });

      console.log('Sending form data to API, entries:', Array.from(formDataToSend.entries()));

      const res = await fetch("/api/partners/apply", {
        method: "POST",
        body: formDataToSend,
      });

      console.log('API response status:', res.status);
      
      const result = await res.json();
      console.log('API response data:', result);
      
      if (res.ok && result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to submit application");
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="border border-[var(--border-default)] bg-[var(--card)]/80 backdrop-blur-xl rounded-2xl shadow-sm hover:shadow-lg hover:border-[var(--primary)] transition-all p-6 sm:p-8 text-center">
              <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 border border-[var(--primary)]/60 bg-[var(--primary)]/10 rounded-full mx-auto mb-6">
                <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-[var(--primary)]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-4">Application Received!</h2>
              <p className="text-sm sm:text-base text-[var(--muted-foreground)] mb-8 leading-relaxed">
                Thank you for applying to become a Community Partner with AutoLearn Spot. Our team will review your application and get back to you via email within 2-3 business days.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 w-full border border-[var(--primary)] bg-[var(--primary)] px-6 py-3 sm:px-8 sm:py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--primary-foreground)] transition duration-150 hover:translate-y-[-1px] hover:shadow-[0_0_0_1px_rgba(0,245,255,0.45)]"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
        <PartnersFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/logo.png"
                alt="AutoLearn Spot"
                width={32}
                height={32}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="font-mono text-sm font-semibold tracking-[0.1em] text-[var(--foreground)]">
                AutoLearn Spot
              </span>
            </Link>
            <Link 
              href="/" 
              className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Column - Content */}
          <div>
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 border border-[var(--primary)]/60 bg-[var(--primary)]/10 px-3 py-1 mb-4">
                <Target className="h-4 w-4 text-[var(--primary)]" />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                  Partner Program
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-4">
                Become a Community Partner
              </h1>
              <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
                Earn commissions while helping others learn valuable automation skills. Join our growing network of partners across Nigeria.
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {BENEFITS.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="border border-[var(--border-default)] bg-[var(--card)]/80 backdrop-blur-xl rounded-2xl shadow-sm hover:shadow-lg hover:border-[var(--primary)] transition-all p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center border border-[var(--primary)]/60 bg-[var(--primary)]/10 rounded-lg mb-3">
                      <Icon className="h-5 w-5 text-[var(--primary)]" />
                    </div>
                    <h3 className="font-semibold text-[var(--foreground)] text-sm mb-1">{benefit.title}</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">{benefit.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Commission Info */}
            <div className="border border-[var(--border-default)] bg-[var(--card)]/80 backdrop-blur-xl rounded-2xl shadow-sm hover:shadow-lg hover:border-[var(--primary)] transition-all p-6">
              <h3 className="font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[var(--primary)]" />
                Commission Structure
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted-foreground)]">Community Partner</span>
                  <span className="font-mono text-[var(--primary)]">₦1,500 per referral</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted-foreground)]">Minimum Withdrawal</span>
                  <span className="font-mono text-[var(--primary)]">₦5,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted-foreground)]">Payout Schedule</span>
                  <span className="font-mono text-[var(--primary)]">Weekly</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Application Form */}
          <div className="border border-[var(--border-default)] bg-[var(--card)]/80 backdrop-blur-xl rounded-2xl shadow-sm hover:shadow-lg hover:border-[var(--primary)] transition-all p-6 sm:p-8">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">Partner Application</h2>
            
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                  Personal Information
                </h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--muted-foreground)]">Full Name *</label>
                  <input
                    required
                    type="text"
                    name="full_name"
                    className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--primary)] transition-colors text-[var(--foreground)]"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--muted-foreground)]">Email Address *</label>
                  <input
                    required
                    type="email"
                    name="email"
                    className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--primary)] transition-colors text-[var(--foreground)]"
                    placeholder="your@email.com"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--muted-foreground)]">Phone Number *</label>
                    <input
                      required
                      type="tel"
                      name="phone"
                      className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--primary)] transition-colors text-[var(--foreground)]"
                      placeholder="0801 234 5678"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--muted-foreground)]">WhatsApp Number *</label>
                    <input
                      required
                      type="tel"
                      name="whatsapp"
                      className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--primary)] transition-colors text-[var(--foreground)]"
                      placeholder="0801 234 5678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--muted-foreground)]">State *</label>
                    <select
                      required
                      name="state"
                      className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--primary)] transition-colors text-[var(--foreground)]"
                    >
                      <option value="">Select your state</option>
                      {NIGERIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--muted-foreground)]">Occupation *</label>
                    <select
                      required
                      name="occupation"
                      className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--primary)] transition-colors text-[var(--foreground)]"
                    >
                      <option value="">Select your occupation</option>
                      {OCCUPATIONS.map((occupation) => (
                        <option key={occupation} value={occupation}>
                          {occupation}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                  Professional Information
                </h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--muted-foreground)]">Organization (Optional)</label>
                  <input
                    type="text"
                    name="organization"
                    className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--primary)] transition-colors text-[var(--foreground)]"
                    placeholder="Your organization or institution"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--muted-foreground)]">Website (Optional)</label>
                  <input
                    type="url"
                    name="website"
                    className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--primary)] transition-colors text-[var(--foreground)]"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              {/* Social Media */}
              <div className="space-y-4">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                  Social Media (Optional)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--muted-foreground)]">Facebook Profile</label>
                    <input
                      type="url"
                      name="facebook"
                      className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--primary)] transition-colors text-[var(--foreground)]"
                      placeholder="facebook.com/yourprofile"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--muted-foreground)]">Instagram Profile</label>
                    <input
                      type="url"
                      name="instagram"
                      className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--primary)] transition-colors text-[var(--foreground)]"
                      placeholder="instagram.com/yourprofile"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--muted-foreground)]">TikTok Profile</label>
                    <input
                      type="url"
                      name="tiktok"
                      className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--primary)] transition-colors text-[var(--foreground)]"
                      placeholder="tiktok.com/@yourprofile"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--muted-foreground)]">YouTube Channel</label>
                    <input
                      type="url"
                      name="youtube"
                      className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--primary)] transition-colors text-[var(--foreground)]"
                      placeholder="youtube.com/@yourchannel"
                    />
                  </div>
                </div>
              </div>

              {/* Motivation & Strategy */}
              <div className="space-y-4">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                  Application Details
                </h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--muted-foreground)]">Why do you want to become a partner? *</label>
                  <textarea
                    required
                    name="motivation"
                    rows={4}
                    className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--primary)] transition-colors text-[var(--foreground)] resize-none"
                    placeholder="Tell us why you're interested in becoming a partner..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--muted-foreground)]">How do you plan to promote the program? *</label>
                  <textarea
                    required
                    name="promotion_method"
                    rows={4}
                    className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--primary)] transition-colors text-[var(--foreground)] resize-none"
                    placeholder="Describe your promotion strategy..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--muted-foreground)]">Previous Experience (Optional)</label>
                  <textarea
                    name="experience"
                    rows={3}
                    className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--primary)] transition-colors text-[var(--foreground)] resize-none"
                    placeholder="Any previous experience with partnerships or marketing..."
                  />
                </div>
              </div>

              {/* Agreement */}
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 w-4 h-4 border border-[var(--border)] bg-[var(--background)]/50 rounded focus:outline-none focus:border-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--muted-foreground)]">
                    I agree to the partner program terms and conditions. I understand that commission payments are subject to successful student enrollments and a 7-day holding period.
                  </span>
                </label>
              </div>

              <button
                disabled={isSubmitting || !agreed}
                type="submit"
                className="w-full py-4 rounded-xl border border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    Submit Application
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
      <PartnersFooter />
    </div>
  );
}