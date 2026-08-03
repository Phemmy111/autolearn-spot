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
    <section id="faq" className="py-6 sm:py-8 lg:py-12 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-4 sm:mb-6 lg:mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#e2e2e8] mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-xl overflow-hidden"
              >
                <button
                  className="w-full px-5 sm:px-6 py-4 text-left flex items-center justify-between"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                >
                  <span className="font-medium text-sm sm:text-base text-[#e2e2e8]">{faq.question}</span>
                  <CheckCircle className={`h-5 w-5 text-[#00f0ff] transition-transform ${openIndex === index ? 'rotate-180' : ''}`} />
                </button>
                {openIndex === index && (
                  <div className="px-5 sm:px-6 pb-4 text-sm text-[#b9cacb]">
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