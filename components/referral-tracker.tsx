"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get("ref");

    if (refCode && refCode.length === 8) {
      // Check if referral cookie already exists
      const existingCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("referral_code="));

      // Only set if no existing valid referral cookie
      if (!existingCookie) {
        // Set cookie for 30 days
        const expires = new Date();
        expires.setDate(expires.getDate() + 30);

        document.cookie = `referral_code=${refCode}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;

        // Track the click
        fetch("/api/referrals/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: refCode,
            userAgent: navigator.userAgent,
            referrer: document.referrer,
          }),
        }).catch((err) => console.error("Failed to track referral:", err));
      }
    }
  }, [searchParams]);

  return null;
}