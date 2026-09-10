"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingBag, User, LogIn } from 'lucide-react';
import { useAuth, useUser } from '@clerk/nextjs';

/**
 * Simple Marketplace Navigation
 * 
 * Basic navigation for the marketplace without route groups.
 */
export function MarketplaceNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Marketplace', href: '/marketplace' },
    { name: 'Skills', href: '/skills' },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-between h-16 border-b border-neutral-200 bg-white px-6 lg:px-8 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
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
              className="text-sm font-medium text-neutral-600 hover:text-sky-600 transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/cart"
            className="text-sm font-medium text-neutral-600 hover:text-sky-600 transition-colors"
          >
            Cart
          </Link>
          <Link
            href="/student"
            className="text-sm font-medium text-neutral-600 hover:text-sky-600 transition-colors flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Student Portal
          </Link>
          <Link
            href="/author"
            className="text-sm font-medium text-neutral-600 hover:text-sky-600 transition-colors"
          >
            Author Studio
          </Link>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden sticky top-0 z-50 h-14 border-b border-neutral-200 bg-white px-4">
        <div className="flex items-center justify-between h-full">
          <button
            onClick={() => setIsOpen(true)}
            className="text-neutral-600 hover:text-sky-600 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-sky-600 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading text-base font-bold text-neutral-900">
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
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-neutral-200 transform transition-transform duration-300">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                <span className="font-heading text-lg font-bold text-neutral-900">
                  AutoLearn Spot
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-neutral-600 hover:text-sky-600 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-neutral-700 hover:text-sky-600 hover:bg-neutral-50 rounded-lg transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-neutral-200" />

              {/* Auth Links */}
              <div className="p-4 space-y-1">
                <Link
                  href="/cart"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-neutral-700 hover:text-sky-600 hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  Cart
                </Link>
                <Link
                  href="/student"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-neutral-700 hover:text-sky-600 hover:bg-neutral-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <User className="w-5 h-5" />
                  Student Portal
                </Link>
                <Link
                  href="/author"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-neutral-700 hover:text-sky-600 hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  Author Studio
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}