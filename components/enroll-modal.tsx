'use client'

import { Lock, X } from 'lucide-react'
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

const defaultPaymentUrl = 'https://paystack.shop/pay/yoksvlq4xn'
const paymentUrl = process.env.NEXT_PUBLIC_PAYSTACK_PAYMENT_URL || defaultPaymentUrl

function paymentHref(form: HTMLFormElement) {
  const data = new FormData(form)
  const url = new URL(paymentUrl)
  const name = String(data.get('name') || '')
  const email = String(data.get('email') || '')
  const phone = String(data.get('phone') || '')
  const referral = String(data.get('referral') || '')

  if (name) url.searchParams.set('name', name)
  if (email) url.searchParams.set('email', email)
  if (phone) url.searchParams.set('phone', phone)
  if (referral) url.searchParams.set('referral', referral)

  return url.toString()
}

export function EnrollModal({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const modalTitleId = useMemo(() => 'enroll-modal-title', [])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    const form = event.currentTarget
    const href = paymentHref(form)

    const data = new FormData(form)
    const payload = JSON.stringify({
      "Full Name": String(data.get('name') || ''),
      "Email1": String(data.get('email') || ''),
      "Phone": String(data.get('phone') || ''),
      "ReferralCode": String(data.get('referral') || '')
    })

    const webhookUrl = "https://n8n-wj6g.onrender.com/webhook/6f985fb5-f10a-4ad3-99c0-d58d70f86408"
    
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        mode: "no-cors"
      })
    } catch (error) {
      console.error("[Enrollment] Webhook fetch failed:", error)
    }

    window.location.assign(href)
  }

  return (
    <>
      <button className={className} onClick={() => setIsOpen(true)} type="button">
        {children}
      </button>

      {isOpen && isMounted
        ? createPortal(
            <div
              aria-labelledby={modalTitleId}
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#050505]/82 px-3 py-4 backdrop-blur-md sm:px-6 sm:py-8"
              role="dialog"
            >
              <button
                aria-label="Close enrollment form"
                className="absolute inset-0 cursor-default"
                onClick={() => setIsOpen(false)}
                type="button"
              />

              <div className="relative max-h-[calc(100vh-2rem)] w-full max-w-[520px] overflow-y-auto border border-[#3b494b] bg-[#050505] p-4 text-[#e2e2e8] shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:p-6">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,240,255,0.13),transparent_44%)]" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#00f0ff]" />

                <button
                  aria-label="Close"
                  className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center border border-[#1f2229] bg-[#0c0e12] text-[#b9cacb] transition hover:border-[#00f0ff]/70 hover:text-[#00f0ff] sm:right-6 sm:top-6"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="relative mb-5 border border-[#1f2229] bg-[#0c0e12]/92 p-5 pr-14 sm:p-6 sm:pr-16">
                  <span className="inline-flex border border-[#00f0ff]/60 bg-[#00f0ff]/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#00f0ff]">
                    Step 1 of 2
                  </span>
                  <h2
                    className="mt-4 font-heading text-2xl font-semibold tracking-normal text-[#e2e2e8] sm:text-3xl"
                    id={modalTitleId}
                  >
                    Join AutoLearn Spot
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#b9cacb]">
                    Enter your details, then complete payment securely via Paystack.
                  </p>
                </div>

                <form className="relative space-y-4" onSubmit={onSubmit}>
                  <label className="block">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#dbfcff]">
                      Full Name *
                    </span>
                    <input
                      className="mt-2 h-12 w-full border border-[#1f2229] bg-[#0c0e12] px-4 font-mono text-sm text-[#e2e2e8] outline-none transition placeholder:text-[#5d5f63] focus:border-[#00f0ff] focus:bg-[#10151b]"
                      name="name"
                      placeholder="e.g., Chioma Adeleke"
                      required
                      type="text"
                    />
                  </label>

                  <label className="block">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#dbfcff]">
                      Email Address *
                    </span>
                    <input
                      className="mt-2 h-12 w-full border border-[#1f2229] bg-[#0c0e12] px-4 font-mono text-sm text-[#e2e2e8] outline-none transition placeholder:text-[#5d5f63] focus:border-[#00f0ff] focus:bg-[#10151b]"
                      name="email"
                      placeholder="e.g., chioma@gmail.com"
                      required
                      type="email"
                    />
                  </label>

                  <label className="block">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#dbfcff]">
                      Phone Number *
                    </span>
                    <input
                      className="mt-2 h-12 w-full border border-[#1f2229] bg-[#0c0e12] px-4 font-mono text-sm text-[#e2e2e8] outline-none transition placeholder:text-[#5d5f63] focus:border-[#00f0ff] focus:bg-[#10151b]"
                      name="phone"
                      placeholder="e.g., 08120934828"
                      required
                      type="tel"
                    />
                  </label>

                  <label className="block">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#dbfcff]">
                      Referral Code
                    </span>
                    <input
                      className="mt-2 h-12 w-full border border-[#1f2229] bg-[#0c0e12] px-4 font-mono text-sm text-[#e2e2e8] outline-none transition placeholder:text-[#5d5f63] focus:border-[#00f0ff] focus:bg-[#10151b]"
                      name="referral"
                      placeholder="Optional"
                      type="text"
                    />
                  </label>

                  <div className="flex items-center justify-between border border-[#1f2229] bg-[#0c0e12] px-4 py-4">
                    <div>
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5d5f63]">
                        Total Investment
                      </p>
                      <p className="mt-1 flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[#00f0ff]">
                        <Lock className="h-3 w-3" />
                        Secure via Paystack
                      </p>
                    </div>
                    <p className="font-heading text-2xl font-semibold text-[#e2e2e8]">₦3,000</p>
                  </div>

                  <button
                    className="corner-accent blueprint-cta flex h-14 w-full items-center justify-center border border-[#00f0ff] bg-[#00f0ff] px-5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-[#00363a] shadow-[0_14px_34px_rgba(0,240,255,0.18)] transition hover:bg-[#dbfcff] disabled:cursor-wait disabled:opacity-75"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? 'Opening Paystack...' : 'Continue to Payment →'}
                  </button>
                </form>

                <button
                  className="relative mx-auto mt-5 block px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5d5f63] transition hover:text-[#dbfcff]"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
