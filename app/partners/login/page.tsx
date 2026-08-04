"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, LogIn, ArrowRight } from "lucide-react";

export default function PartnerLoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [partnerType, setPartnerType] = useState("community");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
      partnerType: partnerType,
    };

    try {
      const res = await fetch("/api/partners/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        router.push("/partners/dashboard");
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B12] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Image
              src="/logo.png"
              alt="AutoLearn Spot"
              width={32}
              height={32}
            />
            <span className="font-mono text-sm font-semibold tracking-[0.1em] text-[#e2e2e8]">
              AutoLearn Spot
            </span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#e2e2e8] mb-2">
            Partner Portal
          </h1>
          <p className="text-[#b9cacb]">
            Sign in to manage your referrals and earnings
          </p>
        </div>

        <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#b9cacb]">Partner Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="partnerType"
                    value="community"
                    checked={partnerType === "community"}
                    onChange={() => setPartnerType("community")}
                    className="accent-[#00F5FF]"
                  />
                  <span className="text-[#e2e2e8]">Community Partner</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="partnerType"
                    value="influencer"
                    checked={partnerType === "influencer"}
                    onChange={() => setPartnerType("influencer")}
                    className="accent-[#00F5FF]"
                  />
                  <span className="text-[#e2e2e8]">Influencer</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#b9cacb]">Email Address</label>
              <input
                required
                type="email"
                name="email"
                className="w-full bg-[#070B12]/50 border border-[#1f2229] rounded-xl px-4 py-3 focus:outline-none focus:border-[#00F5FF] transition-colors text-[#e2e2e8]"
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#b9cacb]">Password</label>
              <input
                required
                type="password"
                name="password"
                className="w-full bg-[#070B12]/50 border border-[#1f2229] rounded-xl px-4 py-3 focus:outline-none focus:border-[#00F5FF] transition-colors text-[#e2e2e8]"
                placeholder="••••••••"
              />
            </div>

            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full py-4 rounded-xl border border-[#00F5FF] bg-[#00F5FF] text-[#070B12] font-bold hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/partners/apply" className="text-[#b9cacb] hover:text-[#00F5FF] text-sm transition-colors inline-flex items-center gap-1">
              Apply to become a Community Partner
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-[#b9cacb] hover:text-[#00F5FF] text-sm transition-colors">
            ← Back to AutoLearn Spot
          </Link>
        </div>
      </div>
    </div>
  );
}