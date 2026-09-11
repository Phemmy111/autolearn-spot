"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, User, Brain } from 'lucide-react';
import { useAuth, UserButton } from '@clerk/nextjs';
import Image from 'next/image';

/**
 * Marketplace Navigation
 *
 * Dark-themed navigation for the public marketplace:
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
      <nav className="hidden md:flex items-center justify-between h-16 bg-[#0c0e14] px-6 lg:px-8 sticky top-0 z-50">
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
          <span className="font-heading text-lg font-bold text-white">
            AutoLearn Spot
          </span>
        </Link>

        <div className="flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-5">
          <Link
            href="/cart"
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Cart
          </Link>
          <Link
            href="/student"
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <User className="w-4 h-4" />
            Student Portal
          </Link>
          <Link
            href="/author"
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Author Studio
          </Link>
          <Link
            href="/admin"
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Admin Portal
          </Link>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden sticky top-0 z-50 h-14 bg-[#0c0e14] px-4">
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
            <span className="font-heading text-base font-bold text-white">
              AutoLearn Spot
            </span>
          </Link>
          
          <button
            onClick={() => setIsOpen(true)}
            className="text-neutral-400 hover:text-white transition-colors"
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
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-[80%] max-w-sm bg-[#0c0e14] shadow-2xl transform transition-transform duration-300">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                <span className="font-heading text-lg font-bold text-white">
                  Menu
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-neutral-500 hover:text-white transition-colors bg-neutral-800 p-2 rounded-full"
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
                    className="block px-4 py-3 text-base font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              <div className="border-t border-neutral-800" />

              {/* Auth & Portal Links */}
              <div className="p-4 space-y-1">
                <Link href="/cart" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-base font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors">
                  Cart
                </Link>
                <Link href="/student" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-base font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors">
                  Student Portal
                </Link>
                <Link href="/author" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-base font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors">
                  Author Studio
                </Link>
                <Link href="/admin" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-base font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors">
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