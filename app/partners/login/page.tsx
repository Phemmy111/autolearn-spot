"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, LogIn, ArrowRight, Mail, KeyRound, CheckCircle2, ArrowLeft, RefreshCw } from "lucide-react";

export default function PartnerLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resending code
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Request 6-digit login OTP code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your registered email address");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/partners/login/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setStep("code");
        setSuccessMessage(`A 6-digit login code has been sent to ${email.trim()}`);
        setResendCooldown(60);
      } else {
        setError(result.error || "Unable to send login code. Please verify your email.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify 6-digit OTP code and authenticate
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.trim().length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/partners/login/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        router.push("/partners/dashboard");
      } else {
        setError(result.error || "Invalid or expired code. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend code handler
  const handleResend = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/partners/login/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSuccessMessage(`New verification code sent to ${email.trim()}`);
        setResendCooldown(60);
        setCode("");
      } else {
        setError(result.error || "Failed to resend code.");
      }
    } catch (err) {
      setError("Failed to resend code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <Image
              src="/autolearn-brandmark.png"
              alt="AutoLearn Spot"
              width={36}
              height={36}
              className="object-contain"
            />
            <span className="font-heading text-lg font-bold text-brand-text">
              AutoLearn Spot
            </span>
          </Link>
          <h1 className="text-3xl font-heading font-extrabold text-brand-text mb-2">
            Affiliate Partner Portal
          </h1>
          <p className="text-sm text-brand-text/60">
            {step === "email"
              ? "Sign in with a one-time code sent to your registered email"
              : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        {/* Card Form */}
        <div className="border border-brand-border bg-[var(--card)] brightness-95 rounded-3xl p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 mb-6 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-6 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {step === "email" ? (
            /* STEP 1: ENTER REGISTERED EMAIL */
            <form onSubmit={handleRequestCode} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-brand-text flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-brand-primary" />
                  Registered Affiliate Email
                </label>
                <input
                  required
                  autoFocus
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary transition-colors text-brand-text text-sm"
                  placeholder="femiadeleke2020@gmail.com"
                />
                <p className="text-xs text-brand-text/50 mt-1">
                  We will send a one-time login code to this email.
                </p>
              </div>

              <button
                disabled={isSubmitting || !email.trim()}
                type="submit"
                className="w-full py-3.5 rounded-full bg-brand-primary text-white font-bold hover:bg-brand-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending login code...
                  </>
                ) : (
                  <>
                    Send Login Code
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: ENTER VERIFICATION CODE */
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-brand-text flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-brand-primary" />
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setError("");
                      setSuccessMessage("");
                    }}
                    className="text-xs text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" /> Change email
                  </button>
                </div>
                <input
                  required
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3.5 text-center text-2xl font-mono font-bold tracking-[0.35em] focus:outline-none focus:border-brand-primary transition-colors text-brand-text"
                  placeholder="······"
                />
                <p className="text-xs text-brand-text/50 text-center">
                  Code expires in 10 minutes.
                </p>
              </div>

              <button
                disabled={isSubmitting || code.length !== 6}
                type="submit"
                className="w-full py-3.5 rounded-full bg-brand-primary text-white font-bold hover:bg-brand-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying code...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Verify & Enter Portal
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  disabled={resendCooldown > 0 || isSubmitting}
                  onClick={handleResend}
                  className="text-xs text-brand-text/60 hover:text-brand-primary disabled:opacity-50 disabled:hover:text-brand-text/60 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? "animate-spin" : ""}`} />
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Didn't receive the code? Resend"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-brand-border/60 text-center">
            <Link
              href="/partners/apply"
              className="text-brand-text/70 hover:text-brand-primary text-sm transition-colors inline-flex items-center gap-1 font-medium"
            >
              Not an affiliate partner yet? Apply here
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-brand-text/60 hover:text-brand-primary text-sm transition-colors">
            ← Back to AutoLearn Spot
          </Link>
        </div>
      </div>
    </div>
  );
}



