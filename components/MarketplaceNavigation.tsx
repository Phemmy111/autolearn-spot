"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Search, Bell, User } from 'lucide-react';
import { useAuth, UserButton } from '@clerk/nextjs';
import Image from 'next/image';

/**
 * Marketplace Navigation
 *
 * Updated navigation for the public marketplace matching Phase 1 roadmap:
 * Logo, Marketplace, Courses, Creators, Partners, Search, Notifications, Account
 */
export function MarketplaceNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();

  const navItems = [
    { name: 'Marketplace', href: '/marketplace' },
    { name: 'Courses', href: '/learning_products' },
    { name: 'Creators', href: '/creators' },
    { name: 'Partners', href: '/partners' },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-between h-20 bg-transparent px-6 lg:px-8 absolute top-0 w-full z-50">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <Image
              src="/autolearn-brandmark.png"
              alt="AutoLearn Spot"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-xl font-bold text-neutral-900 leading-tight">
              AutoLearn Spot
            </span>
            <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest leading-none mt-0.5">
              Learn • Build • Earn
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-10">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[15px] font-semibold text-neutral-700 hover:text-brand-primary transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <button className="text-neutral-600 hover:text-brand-primary transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="text-neutral-600 hover:text-brand-primary transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          
          {isLoaded && isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <Link href="/sign-in" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center border border-neutral-200">
                <User className="w-4 h-4 text-neutral-600" />
              </div>
              <span className="text-sm font-semibold text-neutral-700">Sign In</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden absolute top-0 w-full z-50 h-16 bg-transparent px-4">
        <div className="flex items-center justify-between h-full">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <Image
                src="/autolearn-brandmark.png"
                alt="AutoLearn Spot"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-bold text-neutral-900 leading-tight">
                AutoLearn Spot
              </span>
              <span className="text-[8px] font-medium text-neutral-500 uppercase tracking-widest leading-none mt-0.5">
                Learn • Build • Earn
              </span>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <button className="text-neutral-700">
              <Search className="w-5 h-5" />
            </button>
            <button className="text-neutral-700 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </button>
            <button
              onClick={() => setIsOpen(true)}
              className="text-neutral-700 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-[80%] max-w-sm bg-white shadow-2xl transform transition-transform duration-300">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                <span className="font-heading text-lg font-bold text-neutral-900">
                  Menu
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-neutral-500 hover:text-neutral-800 transition-colors bg-neutral-100 p-2 rounded-full"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 text-lg font-medium text-neutral-800 hover:text-brand-primary hover:bg-neutral-50 rounded-xl transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Auth Links */}
              <div className="p-6 border-t border-neutral-100">
                {isLoaded && isSignedIn ? (
                  <div className="flex items-center gap-3">
                    <UserButton afterSignOutUrl="/" />
                    <span className="font-medium text-neutral-800">My Account</span>
                  </div>
                ) : (
                  <Link
                    href="/sign-in"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}