"use client";

import { useState, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'

interface FAQ {
  id: string;
  question: string;
  answer: string;
  display_order: number;
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fallback FAQs (original hardcoded content)
  const fallbackFaqs = [
    {
      question: 'Do I need coding experience?',
      answer: 'No. AutoLearn Spot is 100% beginner-friendly. n8n is visual — no coding required.',
    },
    {
      question: 'What if I miss a session?',
      answer: 'All sessions are recorded and available for lifetime access.',
    },
    {
      question: 'Is the certificate recognized?',
      answer: 'Yes. The certificate is issued by Moon Space Network.',
    },
  ]

  useEffect(() => {
    async function fetchFAQs() {
      try {
        const res = await fetch('/api/content/faqs?enabled=true');
        if (res.ok) {
          const data = await res.json();
          if (data.faqs && data.faqs.length > 0) {
            setFaqs(data.faqs);
          } else {
            // No FAQs in database, use fallback
            setFaqs(fallbackFaqs.map((faq, index) => ({ ...faq, id: `fallback-${index}`, display_order: index })));
          }
        } else {
          // API failed, use fallback
          setFaqs(fallbackFaqs.map((faq, index) => ({ ...faq, id: `fallback-${index}`, display_order: index })));
        }
      } catch (error) {
        console.error('Failed to fetch FAQs:', error);
        // Use fallback on error
        setFaqs(fallbackFaqs.map((faq, index) => ({ ...faq, id: `fallback-${index}`, display_order: index })));
      } finally {
        setIsLoading(false);
      }
    }
    fetchFAQs();
  }, []);

  if (isLoading) {
    return (
      <section id="faq" className="py-6 sm:py-8 lg:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-4 sm:mb-6 lg:mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-neutral-300/50 bg-gray-100 rounded-xl h-20 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (faqs.length === 0) {
    return null; // Hide section if no FAQs
  }

  return (
    <section id="faq" className="py-16 sm:py-24 bg-gray-50 border-t border-neutral-300/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={faq.id}
                className="border border-neutral-300/50 bg-gray-100 rounded-xl overflow-hidden shadow-sm"
              >
                <button
                  className="w-full px-5 sm:px-6 py-4 text-left flex items-center justify-between hover:bg-neutral-50 transition-colors"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                >
                  <span className="font-medium text-sm sm:text-base text-neutral-900">{faq.question}</span>
                  <CheckCircle className={`h-5 w-5 text-[#10b981] transition-transform ${openIndex === index ? 'rotate-180' : ''}`} />
                </button>
                {openIndex === index && (
                  <div className="px-5 sm:px-6 pb-4 text-sm text-neutral-600 bg-neutral-50 pt-2">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
