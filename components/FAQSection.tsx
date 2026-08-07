"use client";

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
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

  return (
    <section id="faq" className="py-6 sm:py-8 lg:py-12 bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-4 sm:mb-6 lg:mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-[var(--border-default)] bg-[var(--card)] rounded-xl overflow-hidden hover:bg-[var(--surface-hover)] transition-colors"
              >
                <button
                  className="w-full px-5 sm:px-6 py-4 text-left flex items-center justify-between"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                >
                  <span className="font-bold text-sm sm:text-base text-[var(--text-primary)]">{faq.question}</span>
                  <CheckCircle className={`h-5 w-5 text-[var(--primary)] transition-transform ${openIndex === index ? 'rotate-180' : ''}`} />
                </button>
                {openIndex === index && (
                  <div className="px-5 sm:px-6 pb-4 text-sm text-[var(--text-body)]">
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