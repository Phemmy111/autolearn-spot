'use client'

import { ArrowRight, CalendarDays, CircleHelp, HandCoins, MessageCircle, Rocket, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
const whatsappCommunityUrl = process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL

const quickMessages = [
  {
    icon: MessageCircle,
    label: 'I want to register',
    message: 'Hi Femi, I want to register for AutoLearn Spot.',
  },
  {
    icon: CalendarDays,
    label: 'When does it start?',
    message: 'Hi Femi, when does the next AutoLearn Spot cohort start?',
  },
  {
    icon: CircleHelp,
    label: 'I have a question',
    message: 'Hi Femi, I have a question about AutoLearn Spot.',
  },
  {
    icon: HandCoins,
    label: 'Payment help',
    message: 'Hi Femi, I need help with payment for AutoLearn Spot.',
  },
  {
    featured: true,
    icon: Rocket,
    label: 'I want to be an ambassador',
    message: 'Hi Femi, I want to be an AutoLearn Spot ambassador.',
  },
]

function whatsappHref(message: string) {
  const text = encodeURIComponent(message)
  return whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${text}` : `https://wa.me/?text=${text}`
}

export function WhatsAppChatModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const communityHref = useMemo(
    () => whatsappCommunityUrl || whatsappHref('Hi Femi, I want to join the AutoLearn Spot WhatsApp community.'),
    [],
  )

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

  return (
    <>
      <button
        className="mt-4 border border-[#00f0ff]/70 bg-[#00f0ff]/10 px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[#00f0ff] transition hover:bg-[#00f0ff]/15"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Chat with us on WhatsApp
      </button>

      {isOpen && isMounted
        ? createPortal(
        <div
          aria-labelledby="whatsapp-chat-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#050505]/82 px-3 py-4 backdrop-blur-md sm:px-6 sm:py-8"
          role="dialog"
        >
          <button
            aria-label="Close WhatsApp chat options"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsOpen(false)}
            type="button"
          />

          <div className="relative max-h-[calc(100vh-2rem)] w-full max-w-[560px] -translate-y-[2vh] overflow-y-auto border border-[#3b494b] bg-[#050505] p-4 text-[#e2e2e8] shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:max-h-[calc(100vh-4rem)] sm:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,240,255,0.13),transparent_42%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#00f0ff]" />

            <button
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center border border-[#1f2229] bg-[#0c0e12] text-[#b9cacb] transition hover:border-[#00f0ff]/70 hover:text-[#00f0ff] sm:right-6 sm:top-6"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative border border-[#1f2229] bg-[#0c0e12]/92 p-5 sm:p-7">
              <div className="flex items-start gap-4 pr-10">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-[#00f0ff]/70 bg-[#00f0ff]/10 text-[#00f0ff] shadow-[0_0_28px_rgba(0,240,255,0.14)] sm:h-16 sm:w-16">
                  <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#00f0ff]">
                    WHATSAPP_LINK
                  </p>
                  <h2
                    className="mt-2 font-heading text-2xl font-semibold tracking-normal text-[#e2e2e8] sm:text-3xl"
                    id="whatsapp-chat-title"
                  >
                    Chat with Femi
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#b9cacb]">
                    Pick a message to open WhatsApp instantly.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mt-4 space-y-3 sm:mt-5">
              {quickMessages.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    className={`group flex min-h-16 items-center gap-4 border px-4 py-3 transition ${
                      item.featured
                        ? 'border-[#00f0ff]/70 bg-[#00f0ff]/10 text-[#dbfcff] hover:bg-[#00f0ff]/15'
                        : 'border-[#1f2229] bg-[#0c0e12] text-[#e2e2e8] hover:border-[#00f0ff]/55 hover:bg-[#10151b]'
                    }`}
                    href={whatsappHref(item.message)}
                    key={item.label}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-[#00f0ff]" />
                    <span className="min-w-0 flex-1 text-left font-mono text-xs font-semibold uppercase tracking-[0.08em]">
                      {item.label}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[#5d5f63] transition group-hover:translate-x-1 group-hover:text-[#00f0ff]" />
                  </a>
                )
              })}
            </div>

            <div className="relative my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#1f2229]" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5d5f63]">or</span>
              <div className="h-px flex-1 bg-[#1f2229]" />
            </div>

            <a
              className="relative flex min-h-14 items-center justify-center gap-2 border border-[#00f0ff] bg-[#00f0ff] px-5 py-4 text-center font-mono text-xs font-bold uppercase tracking-[0.1em] text-[#050505] shadow-[0_14px_34px_rgba(0,240,255,0.18)] transition hover:bg-[#dbfcff]"
              href={communityHref}
              rel="noreferrer"
              target="_blank"
            >
              <Users className="h-5 w-5" />
              Join WhatsApp Community
            </a>

            <p className="relative mt-5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-[#5d5f63]">
              Usually replies within a few hours
            </p>
          </div>
        </div>,
          document.body,
        )
        : null}
    </>
  )
}
