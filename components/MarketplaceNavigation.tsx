"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, User, Brain } from 'lucide-react';
import { useAuth, UserButton } from '@clerk/nextjs';
import Image from 'next/image';

/**
 * Marketplace Navigation
 *
 * Light/gray-themed navigation for the public marketplace:
 * Logo, Explore, Skills, Courses, Authors, ALEX, Cart, Account
 */
export function MarketplaceNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();

  const navItems = [
    { name: 'Explore', href: '/marketplace' },
    { name: 'Skills', href: '/skills' },
    { name: 'Courses', href: '/learning_products' },
    { name: 'Authors', href: '/dashboard' },
    { name: 'ALEX', href: '/autolearn-ai', icon: Brain },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-between h-16 bg-[#d1d5db] px-6 lg:px-8 sticky top-0 z-50 border-b border-neutral-300/50">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 flex items-center justify-center">
            <Image
              src="/autolearn-brandmark.png"
              alt="AutoLearn Spot"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <span className="font-heading text-lg font-bold text-neutral-900">
            AutoLearn Spot
          </span>
        </Link>

        <div className="flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors flex items-center gap-1.5"
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-5">
          <Link
            href="/cart"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Cart
          </Link>
          <Link
            href="/student"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors flex items-center gap-1.5"
          >
            <User className="w-4 h-4" />
            Student Portal
          </Link>
          <Link
            href="/author-auth"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Author Studio
          </Link>
          <Link
            href="/admin"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Admin Portal
          </Link>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden sticky top-0 z-50 h-14 bg-[#d1d5db] px-4 border-b border-neutral-300/50">
        <div className="flex items-center justify-between h-full">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center">
              <Image
                src="/autolearn-brandmark.png"
                alt="AutoLearn Spot"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <span className="font-heading text-base font-bold text-neutral-900">
              AutoLearn Spot
            </span>
          </Link>
          
          <button
            onClick={() => setIsOpen(true)}
            className="text-neutral-600 hover:text-neutral-900 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-[80%] max-w-sm bg-[#d1d5db] shadow-2xl transform transition-transform duration-300">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-300/50">
                <span className="font-heading text-lg font-bold text-neutral-900">
                  Menu
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-neutral-600 hover:text-neutral-900 transition-colors bg-white/50 p-2 rounded-full"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-neutral-600 hover:text-neutral-900 hover:bg-white/50 rounded-xl transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              <div className="border-t border-neutral-300/50" />

              {/* Auth & Portal Links */}
              <div className="p-4 space-y-1">
                <Link href="/cart" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-base font-medium text-neutral-600 hover:text-neutral-900 hover:bg-white/50 rounded-xl transition-colors">
                  Cart
                </Link>
                <Link href="/student" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-base font-medium text-neutral-600 hover:text-neutral-900 hover:bg-white/50 rounded-xl transition-colors">
                  Student Portal
                </Link>
                <Link href="/author-auth" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-base font-medium text-neutral-600 hover:text-neutral-900 hover:bg-white/50 rounded-xl transition-colors">
                  Author Studio
                </Link>
                <Link href="/admin" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-base font-medium text-neutral-600 hover:text-neutral-900 hover:bg-white/50 rounded-xl transition-colors">
                  Admin Portal
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}