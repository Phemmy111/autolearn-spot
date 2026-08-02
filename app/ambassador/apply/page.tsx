"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

export default function AmbassadorApplyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      full_name: formData.get("full_name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      whatsapp: formData.get("whatsapp"),
      state: formData.get("state"),
      institution: formData.get("institution"),
      occupation: formData.get("occupation"),
      promotion_method: formData.get("promotion_method"),
      social_links: formData.get("social_links"),
      experience: formData.get("experience"),
      reason: formData.get("reason"),
    };

    try {
      const res = await fetch("/api/ambassador/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to submit application");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0c0e12] flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl text-center">
          <CheckCircle2 className="h-16 w-16 text-[#00f0ff] mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Application Received!</h2>
          <p className="text-[#b9cacb] mb-8 leading-relaxed">
            Thank you for applying to the AutoLearn Spot Ambassador Program. Our team will review your application and get back to you via email shortly.
          </p>
          <Link
            href="/"
            className="inline-block w-full py-4 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0e12] py-12 px-6 text-white">
      <div className="max-w-3xl mx-auto">
        <Link href="/ambassador" className="inline-flex items-center gap-2 text-[#b9cacb] hover:text-white mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Ambassador Program
        </Link>
        
        <div className="bg-white/5 border border-white/10 p-8 md:p-12 rounded-3xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00f0ff]/5 blur-3xl rounded-full pointer-events-none" />
          
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Apply Now</h1>
          <p className="text-[#b9cacb] mb-10">Fill out the form below to join our Community Ambassador program.</p>
          
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-8">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#b9cacb]">Full Name *</label>
                <input required name="full_name" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#b9cacb]">Email Address *</label>
                <input required type="email" name="email" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#b9cacb]">Phone Number *</label>
                <input required name="phone" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="+234..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#b9cacb]">WhatsApp Number *</label>
                <input required name="whatsapp" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="+234..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#b9cacb]">State/Location *</label>
                <input required name="state" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="Lagos, Nigeria" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#b9cacb]">Occupation *</label>
                <select required name="occupation" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors appearance-none">
                  <option value="">Select...</option>
                  <option value="Student">Student</option>
                  <option value="NYSC">NYSC</option>
                  <option value="Employed">Employed</option>
                  <option value="Self-Employed">Self-Employed</option>
                  <option value="Unemployed">Unemployed</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#b9cacb]">Institution (If student/NYSC)</label>
              <input name="institution" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="University of Lagos" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#b9cacb]">How will you promote AutoLearn Spot? *</label>
              <textarea required name="promotion_method" rows={3} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="I plan to use my WhatsApp status, local tech meetups..." />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#b9cacb]">Social Media Links</label>
              <input name="social_links" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="Twitter, LinkedIn, IG..." />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#b9cacb]">Prior Referral Experience</label>
              <textarea name="experience" rows={2} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="Have you done similar programs before?" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#b9cacb]">Why do you want to join? *</label>
              <textarea required name="reason" rows={2} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="I am passionate about tech education..." />
            </div>

            <div className="flex items-start gap-3 pt-4">
              <input required type="checkbox" id="terms" className="mt-1 w-5 h-5 rounded border-white/20 bg-black/50 checked:bg-[#00f0ff] cursor-pointer" />
              <label htmlFor="terms" className="text-sm text-[#b9cacb] leading-relaxed cursor-pointer">
                I agree to the terms and conditions of the AutoLearn Spot Ambassador Program. I understand that commissions are only paid for verified enrollments.
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl bg-[#00f0ff] text-black font-bold text-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting...</> : "Submit Application"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
