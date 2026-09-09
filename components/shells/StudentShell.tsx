"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, 
  LayoutDashboard, 
  Trophy, 
  FileText, 
  Award,
  BarChart3,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Home
} from 'lucide-react';
import { SignOutButton } from '@clerk/nextjs';

/**
 * Student Shell
 * 
 * Student sidebar/navigation, header, and page content container.
 * Premium, modern design with mobile support.
 */
export function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/student', icon: LayoutDashboard },
    { name: 'My Learning', href: '/student/learning', icon: BookOpen },
    { name: 'Quizzes', href: '/student/quizzes', icon: Trophy },
    { name: 'Assignments', href: '/student/assignments', icon: FileText },
    { name: 'Certificates', href: '/student/certificates', icon: Award },
    { name: 'Achievements', href: '/student/achievements', icon: Trophy },
    { name: 'Leaderboard', href: '/student/leaderboard', icon: BarChart3 },
    { name: 'Profile', href: '/student/profile', icon: User },
    { name: 'Settings', href: '/student/settings', icon: Settings },
  ];

  const NavLink = ({ item }: { item: typeof navigation[0] }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const Icon = item.icon;
    
    return (
      <Link
        href={item.href}
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive 
            ? 'bg-primary-50 text-primary-700' 
            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-neutral-200 rounded-lg text-neutral-600 hover:text-primary-600 shadow-sm"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-neutral-200 z-50 overflow-y-auto transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-neutral-600 hover:text-primary-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="p-6 border-b border-neutral-200">
          <Link href="/student" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-lg font-bold text-neutral-900">
              AutoLearn Spot
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 mt-auto">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>
          <SignOutButton>
            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 rounded-lg transition-colors mt-1">
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="h-16 border-b border-neutral-200 bg-white px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-neutral-900">
              Student Portal
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/cart"
              className="text-sm font-medium text-neutral-600 hover:text-primary-600 transition-colors"
            >
              Marketplace
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}