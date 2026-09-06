"use client";

import { useState, useEffect } from 'react';
import { Menu, X, User, LogIn, ShoppingCart, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';
import { getPublicSettings } from '@/lib/public-settings';

export function MarketplaceHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({ siteName: 'AutoLearn Spot' });
  const { isSignedIn, isLoaded } = useAuth();
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    async function loadSettings() {
      try {
        const loadedSettings = await getPublicSettings(['site_name']);
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
    loadSettings();
  }, []);

  // In a real app we'd fetch the cart count from /api/cart or React Context.
  // For Phase 5A, we'll just mock it or fetch it once if signed in.
  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/cart')
        .then(res => res.json())
        .then(data => {
          if (data.cart?.item_count) {
            setCartItemCount(data.cart.item_count);
          }
        })
        .catch(console.error);
    }
  }, [isSignedIn]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Left: Logo & Search */}
        <div className="flex items-center gap-6 flex-1">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt={settings.siteName}
              width={32}
              height={32}
              className="group-hover:scale-110 transition-transform"
              unoptimized
            />
            <span className="font-mono text-sm font-semibold tracking-wider text-foreground">
              {settings.siteName}
            </span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search for skills, courses, creators..."
              className="w-full bg-muted/50 border border-border rounded-full pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
            />
          </div>
        </div>

        {/* Right: Nav & Actions */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-6">
            <Link href="/courses" className="text-sm font-medium text-muted-foreground hover:text-brand-primary transition-colors">Courses</Link>
            <Link href="/authors" className="text-sm font-medium text-muted-foreground hover:text-brand-primary transition-colors">Creators</Link>
            <Link href="/partners" className="text-sm font-medium text-muted-foreground hover:text-brand-primary transition-colors">Partners</Link>
          </nav>
          
          <div className="flex items-center gap-4 border-l border-border pl-6">
            {isLoaded && isSignedIn && (
              <Link href="/cart" className="relative text-muted-foreground hover:text-brand-primary transition-colors">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-brand-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            )}
            
            {isLoaded && (
              isSignedIn ? (
                <Link
                  href="/dashboard"
                  className="bg-brand-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-primary-hover transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="bg-brand-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-primary-hover transition-colors"
                >
                  Login / Signup
                </Link>
              )
            )}
          </div>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-foreground p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search..."
              className="w-full bg-muted/50 border border-border rounded-full pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-brand-primary"
            />
          </div>
          <Link href="/courses" className="text-sm font-medium text-foreground py-2 border-b border-border/50">Courses</Link>
          <Link href="/authors" className="text-sm font-medium text-foreground py-2 border-b border-border/50">Creators</Link>
          
          <div className="flex flex-col gap-3 mt-2">
            {isLoaded && isSignedIn && (
              <Link href="/cart" className="flex items-center gap-2 text-sm font-medium text-foreground py-2">
                <ShoppingCart className="h-5 w-5" />
                Cart ({cartItemCount})
              </Link>
            )}
            {isLoaded && (
              isSignedIn ? (
                <Link
                  href="/dashboard"
                  className="w-full bg-brand-primary text-primary-foreground px-4 py-3 rounded-lg text-sm font-semibold text-center"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="w-full bg-brand-primary text-primary-foreground px-4 py-3 rounded-lg text-sm font-semibold text-center"
                >
                  Login / Signup
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
}
