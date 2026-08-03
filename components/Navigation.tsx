"use client";

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-[#1f2229] bg-[#0c0e12]/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/icon-dark-32x32.png"
              alt="AutoLearn Spot"
              width={32}
              height={32}
              className="group-hover:scale-110 transition-transform"
            />
            <span className="font-mono text-sm font-semibold tracking-[0.1em] text-[#e2e2e8]">
              AutoLearn Spot
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/enroll" className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[#e2e2e8] hover:text-[#00f0ff] transition-colors">
              Enroll
            </Link>
            <Link href="/scholarship" className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[#e2e2e8] hover:text-[#00f0ff] transition-colors">
              Scholarship
            </Link>
            <Link href="/partners" className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[#e2e2e8] hover:text-[#00f0ff] transition-colors">
              Partners
            </Link>
            <Link href="/quizzes" className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[#e2e2e8] hover:text-[#00f0ff] transition-colors">
              Quizzes
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#e2e2e8] hover:text-[#00f0ff] transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <Link href="/enroll" className="block font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[#e2e2e8] hover:text-[#00f0ff] transition-colors">
              Enroll
            </Link>
            <Link href="/scholarship" className="block font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[#e2e2e8] hover:text-[#00f0ff] transition-colors">
              Scholarship
            </Link>
            <Link href="/partners" className="block font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[#e2e2e8] hover:text-[#00f0ff] transition-colors">
              Partners
            </Link>
            <Link href="/quizzes" className="block font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[#e2e2e8] hover:text-[#00f0ff] transition-colors">
              Quizzes
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}