"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useDirectEnrollmentFee } from "@/hooks/useDirectEnrollmentFee";

const PARTNER_TYPES = [
  {
    title: "Student Partner",
    commission: "₦1,500",
    description: "Automatically activated after purchasing the course",
    features: ["Referral link", "Dashboard", "Referral statistics", "Instant activation"],
    cta: "Go to Dashboard",
    ctaLink: "/dashboard",
    color: "cyan"
  },
  {
    title: "Community Partner", 
    commission: "₦1,500",
    description: "Application required for this tier",
    features: ["Approval process", "Weekly payout", "Marketing kit", "Dedicated dashboard"],
    cta: "Apply Now",
    ctaLink: "/partners/apply",
    color: "purple"
  },
  {
    title: "Corporate / Campus Ambassador",
    commission: "Custom",
    description: "Perfect for schools, student associations and organizations",
    features: ["Dedicated support", "Bulk campaigns", "Campus activation", "Custom rates"],
    cta: "Contact Us",
    ctaLink: `https://wa.me/2348120934828?text=${encodeURIComponent("Hello AutoLearn Spot. I would like to make an enquiry about the Partner Program.")}`,
    color: "gold"
  }
];

export function PartnerTypesSection() {
  const { fee, isLoading: feeLoading } = useDirectEnrollmentFee();

  const partnerTypes = PARTNER_TYPES.map(type => {
    if (type.title === "Student Partner") {
      return {
        ...type,
        description: feeLoading ? "Automatically activated after purchasing the course" : `Automatically activated after purchasing the ₦${fee.toLocaleString()} course`
      };
    }
    return type;
  });

  return (
    <section className="py-4 sm:py-6 lg:py-8 bg-[#070B12]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="text-center mb-3 sm:mb-4 lg:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#e2e2e8] mb-2 sm:mb-3 lg:mb-4">Choose Your Partner Type</h2>
          <p className="text-sm sm:text-base text-[#b9cacb]">Select the partnership model that suits you best</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {partnerTypes.map((type, index) => (
            <div key={index} className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-4 sm:p-5 lg:p-6 hover:border-[#00F5FF]/50 transition-colors">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#b9cacb]">Commission</span>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-[#00F5FF]">{type.commission}</div>
              </div>
              
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[#e2e2e8] mb-2">{type.title}</h3>
              <p className="text-sm text-[#b9cacb] mb-4 sm:mb-6">{type.description}</p>
              
              <ul className="space-y-1 sm:space-y-2 mb-4 sm:mb-6">
                {type.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[#e2e2e8]">
                    <CheckCircle className="h-4 w-4 text-[#00F5FF]" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Link
                href={type.ctaLink}
                className="block w-full text-center border border-[#00F5FF] bg-[#00F5FF] px-4 py-3 sm:px-5 sm:py-3 lg:px-6 lg:py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#070B12] transition duration-150 hover:translate-y-[-1px] hover:shadow-[0_0_0_1px_rgba(0,245,255,0.45)]"
              >
                {type.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}