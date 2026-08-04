"use client";

import { useState } from 'react'
import { Menu, X, Facebook, Linkedin, Youtube, Instagram, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { socialLinks } from '@/config/social'

export default function ResponsiveNavigation() {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Curriculum', href: '#curriculum' },
    { name: 'Tools', href: '#tools' },
    { name: 'Why', href: '#why' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Scholarship', href: '/scholarship' },
    { name: 'Partner Program', href: '/partners' },
    { name: 'Student Dashboard', href: '/dashboard' },
  ]

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-between h-20 border-b border-[#1f2229] bg-[#0c0e12]/95 backdrop-blur-xl px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/icon-dark-32x32.png"
            alt="AutoLearn Spot"
            width={32}
            height={32}
            className="group-hover:scale-110 transition-transform"
            unoptimized
          />
          <span className="font-mono text-sm font-semibold tracking-[0.1em] text-[#e2e2e8]">
            AutoLearn Spot
          </span>
        </Link>

        <div className="flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm text-[#b9cacb] hover:text-[#00f0ff] transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>

        <Link
          href="/enroll"
          className="border border-[#00f0ff] bg-[#00f0ff] px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[#00363a] hover:bg-white transition-colors"
        >
          Enroll Now
        </Link>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden sticky top-0 z-50 h-[64px] border-b border-[#1f2229] bg-[#0c0e12]/95 backdrop-blur-xl px-4">
        <div className="flex items-center justify-between h-full">
          <Link href="/" className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen(true)}
              className="text-[#e2e2e8] hover:text-[#00f0ff] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Image
              src="/icon-dark-32x32.png"
              alt="AutoLearn Spot"
              width={24}
              height={24}
              className="mr-1"
              unoptimized
            />
            <span className="font-mono text-sm font-semibold tracking-[0.1em] text-[#e2e2e8]">
              AutoLearn Spot
            </span>
          </Link>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-80 bg-[#0c0e12] border-r border-[#1f2229] transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#1f2229]">
                <span className="font-mono text-sm font-semibold tracking-[0.1em] text-[#e2e2e8]">
                  AutoLearn Spot
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[#b9cacb] hover:text-[#00f0ff] transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 text-base text-[#e2e2e8] hover:text-[#00f0ff] hover:bg-[#111317] rounded-lg transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Enroll Button */}
              <div className="p-4 border-t border-[#1f2229]">
                <Link
                  href="/enroll"
                  onClick={() => setIsOpen(false)}
                  className="block w-full border border-[#00f0ff] bg-[#00f0ff] px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[#00363a] hover:bg-white transition-colors text-center"
                >
                  Enroll Now
                </Link>
              </div>

              {/* Social Links */}
              <div className="p-4 border-t border-[#1f2229]">
                <div className="grid grid-cols-5 gap-3">
                  <a
                    href={socialLinks.facebook.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 text-[#b9cacb] hover:text-[#00f0ff] transition-colors"
                  >
                    <Facebook className="h-5 w-5" />
                    <span className="text-[10px]">Facebook</span>
                  </a>
                  <a
                    href={socialLinks.linkedin.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 text-[#b9cacb] hover:text-[#00f0ff] transition-colors"
                  >
                    <Linkedin className="h-5 w-5" />
                    <span className="text-[10px]">LinkedIn</span>
                  </a>
                  <a
                    href={socialLinks.youtube.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 text-[#b9cacb] hover:text-[#00f0ff] transition-colors"
                  >
                    <Youtube className="h-5 w-5" />
                    <span className="text-[10px]">YouTube</span>
                  </a>
                  <a
                    href={socialLinks.instagram.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 text-[#b9cacb] hover:text-[#00f0ff] transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                    <span className="text-[10px]">Instagram</span>
                  </a>
                  <a
                    href={socialLinks.whatsapp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 text-[#b9cacb] hover:text-[#00f0ff] transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-[10px]">WhatsApp</span>
                  </a>
                </div>
              </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}