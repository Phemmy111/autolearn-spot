"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, BookOpen, Trophy, FileText, Award, Home, LogOut, Settings, Video, History, BarChart3, Gift, Bell, Brain } from 'lucide-react';
import { SignOutButton } from '@clerk/nextjs';

/**
 * Student Shell Component
 *
 * Sidebar navigation and header for student experience.
 */
export function StudentShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/student', icon: Home },
    { name: 'My Learning', href: '/dashboard', icon: BookOpen },
    { name: 'ALEX', href: '/autolearn-ai', icon: Brain },
    { name: 'Live Class', href: '/live-class', icon: Video },
    { name: 'Quizzes', href: '/dashboard/quiz', icon: Trophy },
    { name: 'Assignments', href: '/dashboard/assignments', icon: FileText },
    { name: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
    { name: 'History', href: '/dashboard/history', icon: History },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Refer and Earn', href: '/dashboard/refer-and-earn', icon: Gift },
    { name: 'Certificates', href: '/dashboard/achievements', icon: Award },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Desktop Layout */}
      <div className="hidden md:flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-neutral-200 min-h-screen sticky top-0">
          <div className="p-6">
            <Link href="/" className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading text-lg font-bold text-neutral-900">
                AutoLearn Spot
              </span>
            </Link>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-sky-50 text-sky-700'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 pt-8 border-t border-neutral-200">
              <SignOutButton>
                <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 w-full">
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b border-neutral-200 px-4 py-4 flex items-center justify-between sticky top-0 z-40">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-neutral-600 hover:text-sky-600"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-sky-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading text-base font-bold text-neutral-900">
              AutoLearn Spot
            </span>
          </Link>
          <div className="w-6" />
        </header>

        {/* Mobile Content */}
        <main className="p-4">
          {children}
        </main>

        {/* Mobile Sidebar */}
        {isSidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 bg-white z-50 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <span className="font-heading text-lg font-bold text-neutral-900">
                  Menu
                </span>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-neutral-600 hover:text-sky-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-sky-50 text-sky-700'
                          : 'text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-8 pt-8 border-t border-neutral-200">
                <SignOutButton>
                  <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 w-full">
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </SignOutButton>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}