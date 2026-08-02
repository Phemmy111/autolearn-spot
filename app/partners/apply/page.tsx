"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Building2, Megaphone, Users } from "lucide-react";

export default function PartnerApplicationPage() {
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
      occupation: formData.get("occupation"),
      motivation: formData.get("motivation"),
      promotion_method: formData.get("promotion_method"),
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
      const res = await fetch("/api/partners/apply", {
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
            Thank you for applying to become a Community Partner with AutoLearn Spot. Our team will review your application and get back to you via email within 2-3 business days.
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
        <Link href="/" className="inline-flex items-center gap-2 text-[#b9cacb] hover:text-white mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Become a Community Partner</h1>
          <p className="text-[#b9cacb] text-lg">
            Earn ₦1,500 commission for every successful student referral while helping others learn automation skills.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <Users className="h-8 w-8 text-[#00f0ff] mx-auto mb-2" />
            <h3 className="font-bold mb-1">₦1,500</h3>
            <p className="text-sm text-[#b9cacb]">Per Referral</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <Megaphone className="h-8 w-8 text-[#00f0ff] mx-auto mb-2" />
            <h3 className="font-bold mb-1">Marketing Kit</h3>
            <p className="text-sm text-[#b9cacb]">Resources Provided</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <Building2 className="h-8 w-8 text-[#00f0ff] mx-auto mb-2" />
            <h3 className="font-bold mb-1">Dashboard</h3>
            <p className="text-sm text-[#b9cacb]">Track Performance</p>
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/10 p-8 md:p-12 rounded-3xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00f0ff]/5 blur-3xl rounded-full pointer-events-none" />
          
          <h2 className="text-2xl font-bold mb-6">Application Form</h2>
          
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
                  <option value="Business Owner">Business Owner</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#b9cacb]">Organization (Optional)</label>
              <input name="organization" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="Company or organization name" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#b9cacb]">Why do you want to partner with AutoLearn Spot? *</label>
              <textarea required name="motivation" rows={3} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="I am passionate about tech education and want to help others learn..." />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#b9cacb]">How do you plan to promote AutoLearn Spot? *</label>
              <textarea required name="promotion_method" rows={3} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="I plan to use my social media, local community, WhatsApp groups..." />
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-sm font-medium text-[#b9cacb] mb-4">Optional: Social Media & Web Presence</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-[#b9cacb]">Website</label>
                  <input name="website" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#b9cacb]">Facebook</label>
                  <input name="facebook" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="Profile URL" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#b9cacb]">Instagram</label>
                  <input name="instagram" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="@username" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#b9cacb]">TikTok</label>
                  <input name="tiktok" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="@username" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#b9cacb]">LinkedIn</label>
                  <input name="linkedin" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="Profile URL" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#b9cacb]">YouTube</label>
                  <input name="youtube" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="Channel URL" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#b9cacb]">Previous Referral Experience (Optional)</label>
              <textarea name="experience" rows={2} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="Have you done similar referral programs before?" />
            </div>

            <div className="flex items-start gap-3 pt-4">
              <input required type="checkbox" id="terms" className="mt-1 w-5 h-5 rounded border-white/20 bg-black/50 checked:bg-[#00f0ff] cursor-pointer" />
              <label htmlFor="terms" className="text-sm text-[#b9cacb] leading-relaxed cursor-pointer">
                I agree to the terms and conditions of the AutoLearn Spot Community Partner program. I understand that commissions are paid only for successful ₦8,000 course purchases, not scholarship applications.
              </label>
            </div>

            <button 
              disabled={isSubmitting}
              type="submit" 
              className="w-full py-4 rounded-xl bg-[#00f0ff] text-black font-bold hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}