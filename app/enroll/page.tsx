"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "next/link";
import { ArrowLeft, CheckCircle, Lock, Sparkles, User, Mail, Phone, MapPin, Briefcase, Users } from "lucide-react";
import { DIRECT_ENROLLMENT_CONFIG } from "@/config/direct-enrollment";
import { getPaymentUrl } from "@/config/payment";

function EnrollForm() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    whatsappNumber: "",
    state: "",
    occupation: "",
    gender: "",
    referralSource: "",
    referralCode: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode }));
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Please enter a valid name";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^[0-9]{11}$/.test(formData.phoneNumber.replace(/\D/g, ""))) {
      newErrors.phoneNumber = "Please enter a valid 11-digit phone number";
    }

    if (!formData.state) {
      newErrors.state = "State is required";
    }

    if (!formData.occupation) {
      newErrors.occupation = "Occupation is required";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }

    if (!formData.referralSource) {
      newErrors.referralSource = "Please select how you heard about us";
    }

    if (formData.referralCode && formData.referralCode.length !== 8) {
      newErrors.referralCode = "Referral code must be 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Store pending enrollment
      const response = await fetch("/api/enroll/pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to process enrollment");
      }

      const data = await response.json();
      
      // Get the correct Direct Enrollment payment URL
      const paystackUrl = getPaymentUrl('direct-enrollment');

      const url = new URL(paystackUrl);
      url.searchParams.set("name", formData.fullName);
      url.searchParams.set("email", formData.email);
      url.searchParams.set("phone", formData.phoneNumber);
      url.searchParams.set("referral", formData.referralCode);
      url.searchParams.set("pending_id", data.pendingId);

      window.location.href = url.toString();
    } catch (error) {
      console.error("Enrollment error:", error);
      setErrors({ 
        submit: error instanceof Error ? error.message : "Failed to process enrollment. Please try again." 
      });
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <header className="border-b border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex items-center justify-center w-8 h-8 border border-[#00f0ff]/60 bg-[#00f0ff]/10 text-[#00f0ff] group-hover:border-[#00f0ff] transition-colors">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-mono text-sm font-semibold tracking-[0.1em] text-[#e2e2e8]">
                AutoLearn Spot
              </span>
            </Link>
            <Link 
              href="/" 
              className="flex items-center gap-2 text-sm text-[#b9cacb] hover:text-[#00f0ff] transition-colors"
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
          {/* Left Column - Form */}
          <div>
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 border border-[#00f0ff]/60 bg-[#00f0ff]/10 px-3 py-1 mb-4">
                <Sparkles className="h-4 w-4 text-[#00f0ff]" />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#00f0ff]">
                  Direct Enrollment
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-normal text-[#e2e2e8] mb-4">
                Start Your Automation Journey
              </h1>
              <p className="text-base leading-7 text-[#b9cacb]">
                Complete your enrollment to gain immediate access to our 4-week hands-on n8n automation training program.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#dbfcff] flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </h2>

                <div>
                  <label className="block">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#dbfcff]">
                      Full Name *
                    </span>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g., Chioma Adeleke"
                      className={`mt-2 h-12 w-full border bg-[#0c0e12] px-4 font-mono text-sm text-[#e2e2e8] outline-none transition placeholder:text-[#5d5f63] focus:bg-[#10151b] ${
                        errors.fullName 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-[#1f2229] focus:border-[#00f0ff]'
                      }`}
                      required
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
                    )}
                  </label>
                </div>

                <div>
                  <label className="block">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#dbfcff]">
                      Email Address *
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g., chioma@gmail.com"
                      className={`mt-2 h-12 w-full border bg-[#0c0e12] px-4 font-mono text-sm text-[#e2e2e8] outline-none transition placeholder:text-[#5d5f63] focus:bg-[#10151b] ${
                        errors.email 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-[#1f2229] focus:border-[#00f0ff]'
                      }`}
                      required
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                    )}
                  </label>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#dbfcff]">
                        Phone Number *
                      </span>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="08120934828"
                        className={`mt-2 h-12 w-full border bg-[#0c0e12] px-4 font-mono text-sm text-[#e2e2e8] outline-none transition placeholder:text-[#5d5f63] focus:bg-[#10151b] ${
                          errors.phoneNumber 
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-[#1f2229] focus:border-[#00f0ff]'
                        }`}
                        required
                      />
                      {errors.phoneNumber && (
                        <p className="mt-1 text-xs text-red-500">{errors.phoneNumber}</p>
                      )}
                    </label>
                  </div>

                  <div>
                    <label className="block">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#dbfcff]">
                        WhatsApp Number
                      </span>
                      <input
                        type="tel"
                        name="whatsappNumber"
                        value={formData.whatsappNumber}
                        onChange={handleChange}
                        placeholder="Same as phone"
                        className="mt-2 h-12 w-full border border-[#1f2229] bg-[#0c0e12] px-4 font-mono text-sm text-[#e2e2e8] outline-none transition placeholder:text-[#5d5f63] focus:border-[#00f0ff] focus:bg-[#10151b]"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#dbfcff]">
                        State *
                      </span>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className={`mt-2 h-12 w-full border bg-[#0c0e12] px-4 font-mono text-sm text-[#e2e2e8] outline-none transition focus:bg-[#10151b] ${
                          errors.state 
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-[#1f2229] focus:border-[#00f0ff]'
                        }`}
                        required
                      >
                        <option value="">Select State</option>
                        {NIGERIAN_STATES.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      {errors.state && (
                        <p className="mt-1 text-xs text-red-500">{errors.state}</p>
                      )}
                    </label>
                  </div>

                  <div>
                    <label className="block">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#dbfcff]">
                        Gender *
                      </span>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className={`mt-2 h-12 w-full border bg-[#0c0e12] px-4 font-mono text-sm text-[#e2e2e8] outline-none transition focus:bg-[#10151b] ${
                          errors.gender 
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-[#1f2229] focus:border-[#00f0ff]'
                        }`}
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.gender && (
                        <p className="mt-1 text-xs text-red-500">{errors.gender}</p>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#dbfcff]">
                      Occupation *
                    </span>
                    <select
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleChange}
                      className={`mt-2 h-12 w-full border bg-[#0c0e12] px-4 font-mono text-sm text-[#e2e2e8] outline-none transition focus:bg-[#10151b] ${
                        errors.occupation 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-[#1f2229] focus:border-[#00f0ff]'
                        }`}
                      required
                    >
                      <option value="">Select Occupation</option>
                      {OCCUPATIONS.map(occ => (
                        <option key={occ} value={occ}>{occ}</option>
                      ))}
                    </select>
                    {errors.occupation && (
                      <p className="mt-1 text-xs text-red-500">{errors.occupation}</p>
                    )}
                  </label>
                </div>
              </div>

              {/* Referral Information */}
              <div className="space-y-4 pt-6 border-t border-[#1f2229]">
                <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#dbfcff] flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Referral Information
                </h2>

                <div>
                  <label className="block">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#dbfcff]">
                      How did you hear about us? *
                    </span>
                    <select
                      name="referralSource"
                      value={formData.referralSource}
                      onChange={handleChange}
                      className={`mt-2 h-12 w-full border bg-[#0c0e12] px-4 font-mono text-sm text-[#e2e2e8] outline-none transition focus:bg-[#10151b] ${
                        errors.referralSource 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-[#1f2229] focus:border-[#00f0ff]'
                      }`}
                      required
                    >
                      <option value="">Select Option</option>
                      {REFERRAL_SOURCES.map(source => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                    {errors.referralSource && (
                      <p className="mt-1 text-xs text-red-500">{errors.referralSource}</p>
                    )}
                  </label>
                </div>

                <div>
                  <label className="block">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#dbfcff]">
                      Referral Code
                    </span>
                    <input
                      type="text"
                      name="referralCode"
                      value={formData.referralCode}
                      onChange={handleChange}
                      placeholder="Optional 8-character code"
                      disabled={!!searchParams.get("ref")}
                      className={`mt-2 h-12 w-full border bg-[#0c0e12] px-4 font-mono text-sm text-[#e2e2e8] outline-none transition placeholder:text-[#5d5f63] focus:bg-[#10151b] ${
                        searchParams.get("ref") 
                          ? 'border-[#2a2d35] text-[#5d5f63] cursor-not-allowed' 
                          : errors.referralCode 
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-[#1f2229] focus:border-[#00f0ff]'
                      }`}
                    />
                    {errors.referralCode && (
                      <p className="mt-1 text-xs text-red-500">{errors.referralCode}</p>
                    )}
                    {searchParams.get("ref") && (
                      <p className="mt-1 text-xs text-[#00f0ff]">
                        Referral code applied from link
                      </p>
                    )}
                  </label>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="border border-[#1f2229] bg-[#0c0e12] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5d5f63]">
                      Total Investment
                    </p>
                    <p className="mt-1 text-2xl font-mono font-bold text-[#00f0ff]">
                      ₦{DIRECT_ENROLLMENT_CONFIG.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[#b9cacb]">
                    <Lock className="h-4 w-4" />
                    <span className="font-mono text-[10px]">Secure via Paystack</span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 flex items-center justify-center gap-2 border border-[#00f0ff] bg-[#00f0ff] px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#00363a] transition duration-150 hover:translate-y-[-1px] hover:shadow-[0_0_0_1px_rgba(0,240,255,0.45)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#00363a] border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Payment
                      <ArrowLeft className="h-4 w-4 rotate-180" />
                    </>
                  )}
                </button>
              </div>

              {errors.submit && (
                <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-500 text-sm">
                  {errors.submit}
                </div>
              )}
            </form>
          </div>

          {/* Right Column - Program Details */}
          <div className="space-y-8">
            <div className="border border-[#1f2229] bg-[#0c0e12] p-6">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#dbfcff] mb-6 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#00f0ff]" />
                What You'll Get
              </h2>
              <ul className="space-y-3">
                {DIRECT_ENROLLMENT_CONFIG.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center border border-[#00f0ff]/60 bg-[#00f0ff]/10 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-[#00f0ff]" />
                    </div>
                    <span className="text-sm text-[#b9cacb]">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-[#1f2229] bg-[#0c0e12] p-6">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#dbfcff] mb-4">
                Program Overview
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-[#1f2229]">
                  <span className="text-sm text-[#b9cacb]">Duration</span>
                  <span className="font-mono text-sm text-[#e2e2e8]">4 Weeks</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-[#1f2229]">
                  <span className="text-sm text-[#b9cacb]">Live Sessions</span>
                  <span className="font-mono text-sm text-[#e2e2e8]">12 Sessions</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-[#1f2229]">
                  <span className="text-sm text-[#bbacb]">Projects</span>
                  <span className="font-mono text-sm text-[#e2e8]">10+ Workflows</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#b9cacb]">Certificate</span>
                  <span className="font-mono text-sm text-[#e2e2e8]">Included</span>
                </div>
              </div>
            </div>

            <div className="border border-[#1f2229] bg-[#0c0e12] p-6">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#dbfcff] mb-4">
                Need Help?
              </h2>
              <p className="text-sm text-[#b9cacb] mb-4">
                Have questions about the program? Our team is here to help you make the right decision.
              </p>
              <a
                href="https://wa.me/2348120934828"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#00f0ff] hover:text-[#00f0ff]/80 transition-colors"
              >
                <span>Chat on WhatsApp</span>
                <ArrowLeft className="h-4 w-4 rotate-[-45deg]" />
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", 
  "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", 
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", 
  "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
];

const OCCUPATIONS = [
  "Student", "Freelancer", "Software Developer", "Business Owner", "Marketer", 
  "Content Creator", "Data Analyst", "Project Manager", "Consultant", "Other"
];

const REFERRAL_SOURCES = [
  "Social Media", "Friend/Colleague", "Google Search", "YouTube", "LinkedIn",
  "Twitter/X", "Instagram", "WhatsApp", "Blog/Article", "Other"
];

export default function EnrollPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#b9cacb]">Loading...</span>
        </div>
      </div>
    }>
      <EnrollForm />
    </Suspense>
  );
}