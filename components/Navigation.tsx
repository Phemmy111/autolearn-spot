"use client";

import { useState, useEffect } from 'react'
import { Menu, X, User, LogIn } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth, useUser } from '@clerk/nextjs'
import { ThemeToggle } from '@/components/theme-toggle'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()

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
    { name: 'Contact', href: 'https://wa.me/2348120934828', external: true },
  ]

  const mobileNavItems = [
    { name: 'Home', href: '/' },
    { name: 'Curriculum', href: '#curriculum' },
    { name: 'Why AutoLearn', href: '#why' },
    { name: 'Scholarship', href: '/scholarship' },
    { name: 'Partner Program', href: '/partners' },
    { name: 'Contact', href: 'https://wa.me/2348120934828', external: true },
  ]

  return (
    <>
      {/* Desktop Navigation - Shows on XL screens and above */}
      <nav className="hidden xl:flex items-center justify-between h-[72px] border-b border-border bg-background/95 backdrop-blur-xl px-6 lg:px-8 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/logo.png"
            alt="AutoLearn Spot"
            width={32}
            height={32}
            className="group-hover:scale-110 transition-transform"
            unoptimized
          />
          <span className="font-mono text-sm font-semibold tracking-[0.1em] text-foreground">
            AutoLearn Spot
          </span>
        </Link>

        <div className="flex items-center gap-6 lg:gap-8">
          <ThemeToggle />
          {desktopNavItems.map((item) => (
            item.external ? (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                {item.name}
              </a>
            ) : (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                {item.name}
              </Link>
            )
          ))}
          
          {/* Student Login/Dashboard */}
          {isLoaded && (
            isSignedIn ? (
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                Student Login
              </Link>
            )
          )}
        </div>

        <Link
          href="/enroll"
          className="border border-primary bg-primary px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Enroll Now
        </Link>
      </nav>

      {/* Tablet/Smaller Desktop Navigation - Shows hamburger */}
      <nav className="hidden lg:flex xl:hidden items-center justify-between h-[72px] border-b border-border bg-background/95 backdrop-blur-xl px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsOpen(true)}
            className="text-foreground hover:text-primary transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt="AutoLearn Spot"
              width={32}
              height={32}
              className="group-hover:scale-110 transition-transform"
              unoptimized
            />
            <span className="font-mono text-sm font-semibold tracking-[0.1em] text-foreground">
              AutoLearn Spot
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {/* Student Login/Dashboard */}
          {isLoaded && (
            isSignedIn ? (
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                Student Login
              </Link>
            )
          )}
          <Link
            href="/enroll"
            className="border border-primary bg-primary px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Enroll Now
          </Link>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden sticky top-0 z-50 h-[64px] border-b border-border bg-background/95 backdrop-blur-xl px-4">
        <div className="flex items-center justify-between h-full">
          <button
            onClick={() => setIsOpen(true)}
            className="text-foreground hover:text-primary transition-colors"
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
            <span className="font-mono text-sm font-semibold tracking-[0.1em] text-foreground">
              AutoLearn Spot
            </span>
          </Link>
          <div className="w-6" />
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-80 bg-background border-r border-border transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="font-mono text-sm font-semibold tracking-[0.1em] text-foreground">
                  AutoLearn Spot
                </span>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {mobileNavItems.map((item) => (
                  item.external ? (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-3 text-base text-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-3 text-base text-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                    >
                      {item.name}
                    </Link>
                  )
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Student Login/Dashboard */}
              <div className="px-4 py-3">
                {isLoaded && (
                  isSignedIn ? (
                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-base text-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                    >
                      <User className="h-5 w-5" />
                      Dashboard
                    </Link>
                  ) : (
                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-base text-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                    >
                      <LogIn className="h-5 w-5" />
                      Student Login
                    </Link>
                  )
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Partner Login */}
              <div className="px-4 py-3">
                <Link
                  href="/partners/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-base text-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                >
                  <User className="h-5 w-5" />
                  Partner Login
                </Link>
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Enroll Button */}
              <div className="p-4">
                <Link
                  href="/enroll"
                  onClick={() => setIsOpen(false)}
                  className="block w-full border border-primary bg-primary px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-primary-foreground hover:bg-primary/90 transition-colors text-center"
                >
                  Enroll Now
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}