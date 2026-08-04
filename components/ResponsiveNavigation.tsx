"use client";

import { useState, useEffect } from 'react'
import { Menu, X, Share2, User, LogIn } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { socialLinks } from '@/config/social'

export default function ResponsiveNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDesktopMode, setIsDesktopMode] = useState(false)

  // Detect Desktop Mode on mobile devices
  useEffect(() => {
    const checkDesktopMode = () => {
      const isDesktop = window.matchMedia('(min-width: 768px)').matches
      const userAgent = navigator.userAgent
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
      setIsDesktopMode(isDesktop && isMobileUA)
    }

    checkDesktopMode()
    window.addEventListener('resize', checkDesktopMode)
    return () => window.removeEventListener('resize', checkDesktopMode)
  }, [])

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen])

  const desktopNavItems = [
    { name: 'Home', href: '/' },
    { name: 'Curriculum', href: '#curriculum' },
    { name: 'Why AutoLearn', href: '#why' },
    { name: 'Scholarship', href: '/scholarship' },
    { name: 'Partner Program', href: '/partners' },
    { name: 'Contact', href: '#contact' },
  ]

  const mobileNavItems = [
    { name: 'Home', href: '/' },
    { name: 'Curriculum', href: '#curriculum' },
    { name: 'Why AutoLearn', href: '#why' },
    { name: 'Scholarship', href: '/scholarship' },
    { name: 'Partner Program', href: '/partners' },
    { name: 'Contact', href: '#contact' },
  ]

  return (
    <>
      {/* Desktop Navigation - Uses proper breakpoints to handle Desktop Mode */}
      <nav className={`hidden md:flex items-center justify-between h-20 border-b border-[#1f2229] bg-[#0c0e12]/95 backdrop-blur-xl px-6 lg:px-8 ${isDesktopMode ? 'flex' : ''}`}>
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/logo.png"
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

        <div className="flex items-center gap-6 lg:gap-8">
          {desktopNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm text-[#b9cacb] hover:text-[#00f0ff] transition-colors whitespace-nowrap"
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

      {/* Mobile Navigation - Udemy-style hamburger */}
      <nav className={`md:hidden sticky top-0 z-50 h-[64px] border-b border-[#1f2229] bg-[#0c0e12]/95 backdrop-blur-xl px-4 ${isDesktopMode ? 'hidden' : ''}`}>
        <div className="flex items-center justify-between h-full">
          <button
            onClick={() => setIsOpen(true)}
            className="text-[#e2e2e8] hover:text-[#00f0ff] transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
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
          <div className="w-6" /> {/* Spacer for balance */}
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
                {mobileNavItems.map((item) => (
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

              {/* Divider */}
              <div className="border-t border-[#1f2229]" />

              {/* Enroll Button */}
              <div className="p-4">
                <Link
                  href="/enroll"
                  onClick={() => setIsOpen(false)}
                  className="block w-full border border-[#00f0ff] bg-[#00f0ff] px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[#00363a] hover:bg-white transition-colors text-center"
                >
                  Enroll Now
                </Link>
              </div>

              {/* Login Buttons */}
              <div className="px-4 pb-4 space-y-2">
                <Link
                  href="/partners/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 border border-[#1f2229] bg-[#0c0e12] px-4 py-2 text-sm text-[#e2e2e8] hover:border-[#00f0ff] hover:text-[#00f0ff] transition-colors"
                >
                  <User className="h-4 w-4" />
                  Partner Login
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 border border-[#1f2229] bg-[#0c0e12] px-4 py-2 text-sm text-[#e2e2e8] hover:border-[#00f0ff] hover:text-[#00f0ff] transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  Student Login
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}