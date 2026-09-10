"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, Tags, Code2, 
  Users, UserCheck, UserPlus, 
  CreditCard, DollarSign, ArrowUpRight, 
  Star, Trophy, Handshake, 
  Bot, LayoutTemplate, Settings, 
  ChevronDown, ChevronRight, Menu, X, GraduationCap, LogOut
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  activeMatch?: string;
}

const navigation: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Marketplace', href: '/admin/marketplace', icon: LayoutDashboard },
      { label: 'Products', href: '/admin/products', icon: ShoppingCart },
      { label: 'Categories', href: '/admin/categories', icon: Tags },
      { label: 'Skills', href: '/admin/skills', icon: Code2 },
    ],
  },
  {
    title: 'PEOPLE',
    items: [
      { label: 'Authors', href: '/admin/authors', icon: UserCheck, activeMatch: '/admin/authors' },
      { label: 'Students', href: '/admin/students', icon: Users },
      { label: 'Applications', href: '/admin/authors/applications', icon: UserPlus, badge: '5' },
    ],
  },
  {
    title: 'COMMERCE',
    items: [
      { label: 'Orders', href: '/admin/orders', icon: CreditCard },
      { label: 'Revenue', href: '/admin/revenue', icon: DollarSign },
      { label: 'Withdrawals', href: '/admin/withdrawals', icon: ArrowUpRight },
    ],
  },
  {
    title: 'ENGAGEMENT',
    items: [
      { label: 'Reviews', href: '/admin/reviews', icon: Star },
      { label: 'Certificates', href: '/admin/certificates', icon: Trophy },
      { label: 'Partnerships', href: '/admin/partnerships', icon: Handshake },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'AI / ALEX', href: '/admin/ai', icon: Bot },
      { label: 'Design Studio', href: '/admin/design-studio', icon: LayoutTemplate },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'PEOPLE': true, // Keep people open by default for authors feature
  });

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    // Exact match for some, startsWith for children like /admin/authors/applications
    // To ensure "Authors" doesn't light up when in "Applications", we need careful matching.
    const isApplications = pathname.startsWith('/admin/authors/applications');
    let isActive = false;
    
    if (item.href === '/admin/authors/applications') {
      isActive = isApplications;
    } else if (item.href === '/admin/authors') {
      isActive = pathname === '/admin/authors' || (pathname.startsWith('/admin/authors') && !isApplications);
    } else {
      isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    }

    const Icon = item.icon;
    
    return (
      <Link
        href={item.href}
        onClick={() => setMobileMenuOpen(false)}
        className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isActive 
            ? 'bg-blue-50 text-blue-700' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600 transition-colors'}`} />
          <span className="truncate">{item.label}</span>
        </div>
        {item.badge && (
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed top-3 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-gray-900 shadow-sm"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 flex-shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">AutoLearn Spot</span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {navigation.map((section) => (
            <div key={section.title} className="space-y-1">
              <button
                onClick={() => toggleSection(section.title)}
                className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
              >
                {section.title}
                {openSections[section.title] !== false ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
              
              <div className={`space-y-0.5 mt-2 overflow-hidden transition-all duration-200 ${openSections[section.title] !== false ? 'block' : 'hidden'}`}>
                {section.items.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 overflow-hidden flex-shrink-0">
              <span className="text-sm font-bold text-indigo-700">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">Admin User</p>
              <p className="text-xs font-medium text-gray-500 truncate">Super Administrator</p>
            </div>
            <button 
              onClick={() => signOut()}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
