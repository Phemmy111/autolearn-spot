"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function StudentReferAndEarnRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Instantly transition to the full Affiliate Partner Dashboard
    router.replace("/partners/dashboard");
  }, [router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        Entering your Affiliate Dashboard...
      </p>
    </div>
  );
}
