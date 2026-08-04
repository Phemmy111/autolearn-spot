"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "next/link";
import { ArrowLeft, CheckCircle, Star, User, Mail, Phone, Briefcase, Users } from "lucide-react";
import { DIRECT_ENROLLMENT_CONFIG } from "@/config/direct-enrollment";
import { getPaymentUrl } from "@/config/payment";

function EnrollForm() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  
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
    referralCode: refCode
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

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

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <header className="border-b border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex items-center justify-center w-8 h-8 border border-[#00f0ff]/60 bg-[#00f0ff]/10 text-[#00f0ff] group-hover:border-[#00f0ff] transition-colors">
                <Star className="h-4 w-4" />
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
                <Star className="h-4 w-4 text-[#00f0ff]" />
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
                  <CheckCircle className="h-4 w-4" />
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
                      placeholder="e.g., 08012345678"
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
                      placeholder="e.g., 08012345678"
                      className="mt-2 h-12 w-full border bg-[#0c0e12] px-4 font-mono text-sm text-[#e2e2e8] outline-none transition placeholder:text-[#5d5f63] focus:bg-[#10151b] border-[#1f2229] focus:border-[#00f0ff]"
                    />
                  </label>
                </div>

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
                      <option value="">Select your state</option>
                      <option value="Abia">Abia</option>
                      <option value="Adamawa">Adamawa</option>
                      <option value="Akwa Ibom">Akwa Ibom</option>
                      <option value="Anambra">Anambra</option>
                      <option value="Bauchi">Bauchi</option>
                      <option value="Bayelsa">Bayelsa</option>
                      <option value="Benue">Benue</option>
                      <option value="Borno">Borno</option>
                      <option value="Cross River">Cross River</option>
                      <option value="Delta">Delta</option>
                      <option value="Ebonyi">Ebonyi</option>
                      <option value="Edo">Edo</option>
                      <option value="Ekiti">Ekiti</option>
                      <option value="Enugu">Enugu</option>
                      <option value="Gombe">Gombe</option>
                      <option value="Imo">Imo</option>
                      <option value="Jigawa">Jigawa</option>
                      <option value="Kaduna">Kaduna</option>
                      <option value="Kano">Kano</option>
                      <option value="Katsina">Katsina</option>
                      <option value="Kebbi">Kebbi</option>
                      <option value="Kogi">Kogi</option>
                      <option value="Kwara">Kwara</option>
                      <option value="Lagos">Lagos</option>
                      <option value="Nasarawa">Nasarawa</option>
                      <option value="Niger">Niger</option>
                      <option value="Ogun">Ogun</option>
                      <option value="Ondo">Ondo</option>
                      <option value="Osun">Osun</option>
                      <option value="Oyo">Oyo</option>
                      <option value="Plateau">Plateau</option>
                      <option value="Rivers">Rivers</option>
                      <option value="Sokoto">Sokoto</option>
                      <option value="Taraba">Taraba</option>
                      <option value="Yobe">Yobe</option>
                      <option value="Zamfara">Zamfara</option>
                      <option value="FCT">FCT</option>
                    </select>
                    {errors.state && (
                      <p className="mt-1 text-xs text-red-500">{errors.state}</p>
                    )}
                  </label>
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
                      <option value="">Select your occupation</option>
                      <option value="Student">Student</option>
                      <option value="Freelancer">Freelancer</option>
                      <option value="Software Developer">Software Developer</option>
                      <option value="Business Owner">Business Owner</option>
                      <option value="Marketer">Marketer</option>
                      <option value="Content Creator">Content Creator</option>
                      <option value="Data Analyst">Data Analyst</option>
                      <option value="Project Manager">Project Manager</option>
                      <option value="Consultant">Consultant</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.occupation && (
                      <p className="mt-1 text-xs text-red-500">{errors.occupation}</p>
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
                      <option value="">Select your gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && (
                      <p className="mt-1 text-xs text-red-500">{errors.gender}</p>
                    )}
                  </label>
                </div>

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
                      <option value="">Select an option</option>
                      <option value="Social Media">Social Media</option>
                      <option value="Friend/Colleague">Friend/Colleague</option>
                      <option value="Google Search">Google Search</option>
                      <option value="YouTube">YouTube</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Twitter/X">Twitter/X</option>
                      <option value="Instagram">Instagram</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Blog/Article">Blog/Article</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.referralSource && (
                      <p className="mt-1 text-xs text-red-500">{errors.referralSource}</p>
                    )}
                  </label>
                </div>

                <div>
                  <label className="block">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#dbfcff]">
                      Referral Code (Optional)
                    </span>
                    <input
                      type="text"
                      name="referralCode"
                      value={formData.referralCode}
                      onChange={handleChange}
                      placeholder="Enter referral code"
                      className={`mt-2 h-12 w-full border bg-[#0c0e12] px-4 font-mono text-sm text-[#e2e2e8] outline-none transition placeholder:text-[#5d5f63] focus:bg-[#10151b] ${
                        errors.referralCode 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-[#1f2229] focus:border-[#00f0ff]'
                      }`}
                    />
                    {errors.referralCode && (
                      <p className="mt-1 text-xs text-red-500">{errors.referralCode}</p>
                    )}
                  </label>
                </div>
              </div>

              {errors.submit && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                  <p className="text-sm text-red-500">{errors.submit}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#00f0ff] text-[#050505] font-bold font-mono text-sm uppercase tracking-wider hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-[#050505] border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Continue to Payment"
                )}
              </button>
            </form>
          </div>

          {/* Right Column - Information */}
          <div className="space-y-8">
            <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-[#e2e2e8] mb-4">Program Details</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#00f0ff] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#e2e2e8]">4-Week Program</p>
                    <p className="text-xs text-[#b9cacb]">Hands-on n8n automation training</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#00f0ff] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#e2e2e8]">Live Sessions</p>
                    <p className="text-xs text-[#b9cacb]">Every Saturday, 2 hours</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#00f0ff] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#e2e2e8]">10+ Real Projects</p>
                    <p className="text-xs text-[#b9cacb]">Build production-ready workflows</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#00f0ff] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#e2e2e8]">Certificate</p>
                    <p className="text-xs text-[#b9cacb]">Verified credential upon completion</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-[#e2e2e8] mb-4">What You'll Learn</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-[#b9cacb]">
                  <div className="h-1.5 w-1.5 bg-[#00f0ff] rounded-full" />
                  <span>n8n Fundamentals & Setup</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#b9cacb]">
                  <div className="h-1.5 w-1.5 bg-[#00f0ff] rounded-full" />
                  <span>AI-Powered Workflows</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#b9cacb]">
                  <div className="h-1.5 w-1.5 bg-[#00f0ff] rounded-full" />
                  <span>Deployment on Railway</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#b9cacb]">
                  <div className="h-1.5 w-1.5 bg-[#00f0ff] rounded-full" />
                  <span>Capstone Project</span>
                </div>
              </div>
            </div>

            <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-[#e2e2e8] mb-4">Investment</h2>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#00f0ff] mb-2">₦8,000</div>
                <p className="text-sm text-[#b9cacb] mb-4">One-time payment</p>
                <div className="flex items-center justify-center gap-2 text-xs text-[#b9cacb]">
                  <Star className="h-4 w-4" />
                  <span>Secure payment via Paystack</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const REFERRAL_SOURCES = [
  "Social Media", "Friend/Colleague", "Google Search", "YouTube", "LinkedIn",
  "Twitter/X", "Instagram", "WhatsApp", "Blog/Article", "Other"
];

export const dynamic = 'force-dynamic';

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