"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  BookOpen, 
  Award, 
  Home, 
  LogOut, 
  Settings, 
  FileText, 
  ClipboardCheck, 
  MessageSquare, 
  Video, 
  Bot,
  Sparkles
} from 'lucide-react';
import { SignOutButton } from '@clerk/nextjs';
import { NotificationBell } from '@/components/NotificationBell';
import { AlexFloatingWidget } from '@/components/alex/AlexFloatingWidget';

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
    { name: 'Alex AI Tutor', href: '/dashboard/alex', icon: Bot, badge: 'Smart' },
    { name: 'Messages', href: '/student/messages', icon: MessageSquare },
    { name: 'Live Classes', href: '/student/live-classes', icon: Video },
    { name: 'Quizzes', href: '/dashboard/quizzes', icon: ClipboardCheck },
    { name: 'Assignments', href: '/dashboard/assignments', icon: FileText },
    { name: 'Certificates', href: '/dashboard/achievements', icon: Award },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 relative">
      {/* Desktop Layout */}
      <div className="hidden md:flex">
        {/* Sidebar - fixed, independent from scrolling */}
        <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-neutral-200 z-30 overflow-y-auto">
          <div className="p-6">
            <Link href="/" className="flex items-center gap-2 mb-8">
              <img src="/autolearn-brandmark.png" alt="AutoLearn Spot Logo" className="w-8 h-8 object-contain" />
              <span className="font-heading text-lg font-bold text-neutral-900">
                AutoLearn Spot
              </span>
            </Link>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-neutral-100 text-neutral-900 font-semibold'
                        : 'text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${item.badge ? 'text-blue-600' : ''}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 pt-8 border-t border-neutral-200 space-y-2">
              <div className="px-4 py-2">
                <NotificationBell />
              </div>
              <SignOutButton>
                <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 w-full">
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 ml-64 min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b border-neutral-200 px-4 py-4 flex items-center justify-between sticky top-0 z-40">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-neutral-600 hover:text-neutral-900"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <img src="/autolearn-brandmark.png" alt="AutoLearn Spot Logo" className="w-6 h-6 object-contain" />
            <span className="font-heading text-base font-bold text-neutral-900">
              AutoLearn Spot
            </span>
          </Link>
          <div className="w-6" /> {/* Spacer for centering */}
        </header>

        {/* Mobile Main Content */}
        <main className="p-4">
          {children}
        </main>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-neutral-900/50 z-40"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-64 bg-white z-50 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <span className="font-heading text-lg font-bold text-neutral-900">
                  AutoLearn Spot
                </span>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-neutral-600 hover:text-neutral-900"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-neutral-100 text-neutral-900 font-semibold'
                          : 'text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${item.badge ? 'text-blue-600' : ''}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" /> {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-8 pt-8 border-t border-neutral-200 space-y-2">
                <div className="px-4 py-2">
                  <NotificationBell />
                </div>
                <SignOutButton>
                  <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 w-full">
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </SignOutButton>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Persistent Floating Alex AI Assistant */}
      <AlexFloatingWidget />
    </div>
  );
}
