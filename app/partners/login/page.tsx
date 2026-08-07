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
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Image
              src="/logo.png"
              alt="AutoLearn Spot"
              width={32}
              height={32}
            />
            <span className="font-mono text-sm font-semibold tracking-[0.1em] text-[var(--foreground)]">
              AutoLearn Spot
            </span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-2">
            Partner Portal
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Sign in to manage your referrals and earnings
          </p>
        </div>

        <div className="border border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--muted-foreground)]">Partner Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="partnerType"
                    value="community"
                    checked={partnerType === "community"}
                    onChange={() => setPartnerType("community")}
                    className="accent-[var(--primary)]"
                  />
                  <span className="text-[var(--foreground)]">Community Partner</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="partnerType"
                    value="influencer"
                    checked={partnerType === "influencer"}
                    onChange={() => setPartnerType("influencer")}
                    className="accent-[var(--primary)]"
                  />
                  <span className="text-[var(--foreground)]">Influencer</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--muted-foreground)]">Email Address</label>
              <input
                required
                type="email"
                name="email"
                className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--primary)] transition-colors text-[var(--foreground)]"
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--muted-foreground)]">Password</label>
              <input
                required
                type="password"
                name="password"
                className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--primary)] transition-colors text-[var(--foreground)]"
                placeholder="••••••••"
              />
            </div>

            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full py-4 rounded-xl border border-[var(--primary)] bg-[var(--primary)] text-[var(--background)] font-bold hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
            <Link href="/partners/apply" className="text-[var(--muted-foreground)] hover:text-[var(--primary)] text-sm transition-colors inline-flex items-center gap-1">
              Apply to become a Community Partner
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-[var(--muted-foreground)] hover:text-[var(--primary)] text-sm transition-colors">
            ← Back to AutoLearn Spot
          </Link>
        </div>
      </div>
    </div>
  );
}