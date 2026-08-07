"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Lock, Mail } from "lucide-react";
import { Navbar } from "@/components/navbar";

export default function AmbassadorLoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const res = await fetch("/api/ambassador/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        router.push("/ambassador/dashboard");
      } else {
        setError(result.error || "Invalid credentials");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />
      
      <main className="flex min-h-screen items-center justify-center p-6 pt-32">
        <div className="w-full max-w-md">
          <Link href="/ambassador" className="inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Ambassador Program
          </Link>
          
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00f0ff]/10 blur-3xl rounded-full pointer-events-none" />
            
            <h1 className="text-2xl font-bold mb-2">Ambassador Login</h1>
            <p className="text-[#b9cacb] mb-8 text-sm">Welcome back. Enter your credentials to access your dashboard.</p>
            
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 mb-6 text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#b9cacb]">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#b9cacb]" />
                  <input required type="email" name="email" className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="you@example.com" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-[#b9cacb]">Password</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#b9cacb]" />
                  <input required type="password" name="password" className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#00f0ff] transition-colors" placeholder="••••••••" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 py-3 rounded-xl bg-[#00f0ff] text-black font-bold hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Authenticating...</> : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
