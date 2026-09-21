'use client'

import { ArrowRight, CalendarDays, CircleHelp, HandCoins, MessageCircle, Rocket, Users, X } from 'lucide-react'

const quickMessages = [
  {
    icon: MessageCircle,
    label: 'Course Enrollment',
    message: 'Hello! I\'m interested in enrolling in a course on AutoLearn Spot.',
  },
  {
    icon: CalendarDays,
    label: 'Become an Author',
    message: 'Hi! I\'d like to learn how to become an author and create courses on AutoLearn Spot.',
  },
  {
    icon: CircleHelp,
    label: 'Course Information',
    message: 'Hello! I have questions about the courses available on AutoLearn Spot.',
  },
  {
    icon: HandCoins,
    label: 'Payment Support',
    message: 'Hi! I need assistance with payment options for a course on AutoLearn Spot.',
  },
  {
    featured: true,
    icon: Rocket,
    label: 'Partnership Inquiry',
    message: 'Hello! I\'m interested in partnership opportunities with AutoLearn Spot.',
  },
];

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '2348120934828'
const whatsappCommunityUrl = process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL



function whatsappHref(message: string) {
  const text = encodeURIComponent(message)
  return whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${text}` : `https://wa.me/?text=${text}`
}

export function WhatsAppChatModal({ variant = 'inline' }: { variant?: 'inline' | 'floating' } = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const communityHref = useMemo(
    () => whatsappCommunityUrl || whatsappHref('Hi, I want to join the AutoLearn Spot community.'),
    [],
  )

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
      {variant === 'floating' ? (
        <button
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#128C7E] transition-all hover:scale-105"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          <MessageCircle className="h-5 w-5" />
          Chat with us
        </button>
      ) : (
        <button
          className="mt-4 inline-flex items-center gap-2 bg-[#25D366] px-6 py-3 text-sm font-semibold text-white rounded-lg hover:bg-[#128C7E] transition-colors"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          <MessageCircle className="h-5 w-5" />
          Send a message
        </button>
      )}

      {isOpen && createPortal(
        <div
          aria-labelledby="whatsapp-chat-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-3 py-4 backdrop-blur-sm sm:px-6 sm:py-8"
          role="dialog"
        >
          <button
            aria-label="Close WhatsApp chat options"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsOpen(false)}
            type="button"
          />

          <div className="relative max-h-[calc(100vh-2rem)] w-full max-w-[520px] -translate-y-[2vh] overflow-y-auto bg-white rounded-2xl shadow-2xl sm:max-h-[calc(100vh-4rem)]">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-[#25D366] to-[#128C7E] p-6 rounded-t-2xl">
              <button
                aria-label="Close"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                  <MessageCircle className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <h2
                    className="text-xl font-bold text-white"
                    id="whatsapp-chat-title"
                  >
                    Connect with Us
                  </h2>
                  <p className="text-sm text-white/90">
                    Quick support via WhatsApp
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6">
                Choose a topic to start a conversation with our team
              </p>

              {/* Quick message presets */}
              <div className="space-y-3">
                {quickMessages.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      className={`group flex items-center gap-4 rounded-xl p-4 transition-all ${
                        item.featured
                          ? 'bg-[#25D366]/10 border-2 border-[#25D366] hover:bg-[#25D366]/20'
                          : 'bg-gray-50 border border-gray-200 hover:border-[#25D366] hover:bg-gray-100'
                      }`}
                      href={whatsappHref(item.message)}
                      key={item.label}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        item.featured ? 'bg-[#25D366] text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="flex-1 text-sm font-medium text-gray-900">
                        {item.label}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-1 group-hover:text-[#25D366]" />
                    </a>
                  );
                })}
              </div>

              {/* Custom message */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or type your own message
                </label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent resize-none"
                  placeholder="How can we help you?"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <a
                  className={`mt-3 inline-flex items-center justify-center gap-2 w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                    message
                      ? 'bg-[#25D366] text-white hover:bg-[#128C7E]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  href={whatsappHref(message || 'Hi, I have a question about AutoLearn Spot.')}
                  rel="noreferrer"
                  target="_blank"
                >
                  <MessageCircle className="h-4 w-4" />
                  Send via WhatsApp
                </a>
              </div>

              {/* Community link */}
              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <a
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#25D366] hover:text-[#128C7E] transition-colors"
                  href={communityHref}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Users className="h-4 w-4" />
                  Join our WhatsApp Community
                </a>
                <p className="mt-2 text-xs text-gray-500">
                  We typically respond within a few hours
                </p>
              </div>
            </div>
          </div>
        </div>,
          document.body,
        )}
    </>
  )
}
