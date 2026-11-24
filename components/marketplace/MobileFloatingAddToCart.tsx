"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2, Zap, MessageCircle } from "lucide-react";
import { fbqAddToCart } from "@/lib/meta-pixel";

interface MobileFloatingAddToCartProps {
  productId: string;
  productTitle: string;
  price: number;
  formattedPrice: string;
  currency?: string;
}

export function MobileFloatingAddToCart({
  productId,
  productTitle,
  price,
  formattedPrice,
  currency = "NGN",
}: MobileFloatingAddToCartProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddToCart() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learningProductId: productId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to add to cart");
      }

      // Meta Pixel: Track AddToCart
      fbqAddToCart({
        content_id: productId,
        content_name: productTitle || "Online Course",
        value: price,
        currency: currency,
      });

      router.push("/cart");
    } catch (e: any) {
      setError(e.message || "Failed to add course to cart");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-xl border-t border-border px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom duration-300">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Price & Guarantee Pill */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black text-foreground tracking-tight">
              {formattedPrice}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
            Lifetime Access & Certificate
          </span>
        </div>

        {/* WhatsApp Direct Bank Transfer Button */}
        <a
          href={`https://wa.me/2348120934828?text=${encodeURIComponent(
            `Hello Femi! I'm on AutoLearn Spot and want to enroll in "${productTitle}" (${formattedPrice}) via Direct Bank Transfer. Please send your account details.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center h-12 px-2.5 shrink-0 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white active:scale-95 transition-all shadow-md"
          title="Pay via Bank Transfer on WhatsApp"
          aria-label="Pay via Bank Transfer on WhatsApp"
        >
          <MessageCircle className="w-4 h-4 fill-current" />
          <span className="text-[8px] font-black tracking-tight uppercase leading-none mt-0.5">Transfer</span>
        </a>

        {/* Enroll Now Primary Button */}
        <div className="flex-1 max-w-[210px]">
          <button
            onClick={handleAddToCart}
            disabled={loading}
            className="group relative flex items-center justify-center gap-1.5 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-600/30 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed text-sm overflow-hidden tracking-wide"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Zap className="w-4 h-4 fill-current text-amber-300" />
            )}
            <span>{loading ? "Opening..." : "Enroll Now"}</span>
          </button>
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-destructive font-medium text-center mt-1 animate-in fade-in">
          {error}
        </p>
      )}
    </div>
  );
}
