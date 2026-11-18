"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, CheckCircle2 } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

interface CourseFAQSectionProps {
  courseTitle: string;
  customFaqs?: FAQItem[];
}

export function CourseFAQSection({ courseTitle, customFaqs }: CourseFAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const defaultFaqs: FAQItem[] = [
    {
      q: `How soon do I get access to "${courseTitle}" after purchase?`,
      a: "Instant access. As soon as your payment is verified via Paystack, the entire course curriculum is automatically unlocked in your student dashboard and you can begin watching lessons immediately.",
    },
    {
      q: "Do I receive an official Certificate of Completion?",
      a: `Yes! When you complete the lessons and curriculum in "${courseTitle}", an official verifiable digital Certificate of Completion is automatically generated with a unique credential ID and verification QR code. You can download it as high-res PDF or add it directly to LinkedIn.`,
    },
    {
      q: "Is this a one-time fee or a recurring subscription?",
      a: "This is a 100% one-time payment. You will never be billed again, and you receive lifetime access to all lessons, resources, and future curriculum additions at no extra charge.",
    },
    {
      q: "Can I watch and learn on my smartphone?",
      a: "Yes. AutoLearn Spot is fully mobile responsive. You can stream high-definition video lessons, review notes, and track your progress seamlessly on any iPhone, Android phone, tablet, or desktop computer.",
    },
    {
      q: "What if I get stuck or have questions during the lessons?",
      a: "You have direct access to instructor Q&A support. You can post questions directly under any lesson inside your student portal to get help and guidance from the course author.",
    },
    {
      q: "What payment methods are supported?",
      a: "We support all major payment methods powered by Paystack: Nigerian Debit Cards (Mastercard, Visa, Verve), Direct Bank Transfer, USSD, Opay, and mobile money.",
    },
  ];

  const faqs = customFaqs && customFaqs.length > 0 ? [...customFaqs, ...defaultFaqs] : defaultFaqs;

  return (
    <div className="bg-[var(--card)]/90 backdrop-blur-xl border border-brand-border rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl transition-all animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-semibold mb-3 border border-emerald-500/20 w-fit">
        <HelpCircle className="w-4 h-4 text-emerald-600" />
        <span>Got Questions?</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-heading font-black text-brand-text tracking-tight mb-2">
        Frequently Asked Questions
      </h2>
      <p className="text-sm sm:text-base text-brand-text/70 mb-8 max-w-xl">
        Everything you need to know about purchasing, accessing, and completing this course.
      </p>

      <div className="space-y-3">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? "bg-brand-bg/90 border-emerald-500/40 shadow-xs"
                  : "bg-brand-bg/50 border-brand-border/70 hover:border-brand-border"
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 text-left transition-colors cursor-pointer"
              >
                <span className="font-bold text-brand-text text-sm sm:text-base pr-4">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-emerald-600 shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-brand-text/75 leading-relaxed border-t border-brand-border/40 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
