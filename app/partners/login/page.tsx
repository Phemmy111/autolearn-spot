"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, LogIn } from "lucide-react";

export default function PartnerLoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [partnerType, setPartnerType] = useState<"community" | "influencer">("community");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
      partnerType,
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
    <div className="min-h-screen bg-[#0c0e12] flex items-center justify-center p-6 text-white">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Partner Portal</h1>
          <p className="text-[#b9cacb]">Sign in to manage your referrals and earnings</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
          {/* Partner Type Selection */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setPartnerType("community")}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                partnerType === "community"
                  ? "bg-[#00f0ff] text-black"
                  : "bg-white/5 text-[#b9cacb] hover:bg-white/10"
              }`}
            >
              Community Partner
            </button>
            <button
              type="button"
              onClick={() => setPartnerType("influencer")}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                partnerType === "influencer"
                  ? "bg-[#00f0ff] text-black"
                  : "bg-white/5 text-[#b9cacb] hover:bg-white/10"
              }`}
            >
              Influencer
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#b9cacb]">Email Address</label>
              <input
                required
                type="email"
                name="email"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#b9cacb]">Password</label>
              <input
                required
                type="password"
                name="password"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full py-4 rounded-xl bg-[#00f0ff] text-black font-bold hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
            <Link href="/partners/apply" className="text-[#b9cacb] hover:text-[#00f0ff] text-sm transition-colors">
              Apply to become a Community Partner
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-[#b9cacb] hover:text-white text-sm transition-colors">
            ← Back to AutoLearn Spot
          </Link>
        </div>
      </div>
    </div>
  );
}