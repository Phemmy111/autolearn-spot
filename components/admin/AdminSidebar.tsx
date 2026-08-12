"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  BarChart3, 
  Activity, 
  Shield, 
  Bot, 
  Sparkles, 
  Settings as SettingsIcon, 
  MessageSquare, 
  Trophy, 
  FileText, 
  ClipboardList, 
  Calendar, 
  Bug, 
  Wrench, 
  DollarSign, 
  PlayCircle, 
  GraduationCap,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  TrendingUp,
  HeartPulse,
  Video,
  Image,
  Globe
} from 'lucide-react';

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navigation: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Students',
    items: [
      { label: 'Enrollments', href: '/admin/enrollments', icon: Users },
      { label: 'Results', href: '/admin/results', icon: Trophy },
      { label: 'Manual Enrollment', href: '/admin/enrollments/manual', icon: Users },
    ],
  },
  {
    title: 'Learning',
    items: [
      { label: 'Quizzes', href: '/admin/quizzes', icon: BookOpen },
      { label: 'Assignments', href: '/admin/assignments', icon: FileText },
      { label: 'Lessons', href: '/admin/lessons', icon: PlayCircle },
      { label: 'Leaderboard', href: '/admin/leaderboard', icon: Trophy },
    ],
  },
  {
    title: 'Programs & Payments',
    items: [
      { label: 'Scholarship', href: '/admin/scholarship', icon: Sparkles },
      { label: 'Enrollments', href: '/admin/enrollments', icon: Users },
      { label: 'Live Schedule', href: '/admin/live-schedule', icon: Calendar },
    ],
  },
  {
    title: 'Partnerships',
    items: [
      { label: 'Partners', href: '/admin/partners', icon: Users },
      { label: 'Growth Center', href: '/admin/growth-center', icon: BarChart3 },
      { label: 'Growth', href: '/admin/growth', icon: TrendingUp },
    ],
  },
  {
    title: 'Communication',
    items: [
      { label: 'Notifications', href: '/admin/notifications', icon: MessageSquare },
      { label: 'Founder Notifications', href: '/admin/founder-notifications', icon: MessageSquare },
    ],
  },
  {
    title: 'AI',
    items: [
      { label: 'AI Providers', href: '/admin/ai-providers', icon: Bot },
      { label: 'AI Prompts', href: '/admin/ai-prompts', icon: MessageSquare },
      { label: 'AI Playground', href: '/admin/ai-playground', icon: Sparkles },
      { label: 'AI Health', href: '/admin/ai-health', icon: HeartPulse },
      { label: 'AI Cost Controls', href: '/admin/ai-cost-controls', icon: SettingsIcon },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { label: 'Health', href: '/admin/health', icon: Activity },
      { label: 'Audit Logs', href: '/admin/logs', icon: ClipboardList },
      { label: 'Admin Users', href: '/admin/admins', icon: Shield },
      { label: 'Maintenance', href: '/admin/maintenance', icon: Wrench },
      { label: 'Runtime Debug', href: '/admin/debug/runtime', icon: Bug },
      { label: 'Video Debug', href: '/admin/video-debug', icon: Activity },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'General & Brand', href: '/admin/settings/general', icon: SettingsIcon },
      { label: 'Landing Page', href: '/admin/settings/landing', icon: LayoutDashboard },
      { label: 'Footer', href: '/admin/settings/footer', icon: FileText },
      { label: 'Pricing', href: '/admin/settings/pricing', icon: DollarSign },
      { label: 'Commission', href: '/admin/settings/commission', icon: DollarSign },
      { label: 'Scholarship', href: '/admin/settings/scholarship', icon: Sparkles },
      { label: 'Partnership', href: '/admin/settings/partnership', icon: Users },
      { label: 'Live Classes', href: '/admin/settings/live-classes', icon: Calendar },
      { label: 'Enrollment', href: '/admin/settings/enrollment', icon: Users },
      { label: 'Certificates', href: '/admin/settings/certificates', icon: Trophy },
      { label: 'SEO', href: '/admin/settings/seo', icon: Globe },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Workflow Showcase', href: '/admin/content/workflow-showcase', icon: Video },
      { label: 'Testimonials', href: '/admin/content/testimonials', icon: MessageSquare },
      { label: 'Announcements', href: '/admin/content/announcements', icon: FileText },
      { label: 'Media Library', href: '/admin/content/media', icon: Image },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const NavLink = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const Icon = item.icon;
    
    return (
      <Link
        href={item.href}
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive 
            ? 'bg-[#00f0ff]/10 text-[#00f0ff]' 
            : 'text-[#b9cacb] hover:text-white hover:bg-[#1f2229]'
        } ${level > 0 ? 'ml-4' : ''}`}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">{item.label}</span>
        {item.badge && (
          <span className="px-2 py-0.5 text-xs bg-[#00f0ff]/20 text-[#00f0ff] rounded-full">
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-[#b9cacb] hover:text-white"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-[230px] bg-[#0a0c10] border-r border-[#1f2229] z-50 overflow-y-auto transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-[#b9cacb] hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Logo */}
        <div className="p-6 border-b border-[#1f2229]">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-[#00f0ff] rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-[#00363a]" />
            </div>
            <span className="font-heading text-lg font-bold text-white">AutoLearn</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-6">
          {navigation.map((section) => (
            <div key={section.title}>
              <button
                onClick={() => toggleSection(section.title)}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-[#5d5f63] uppercase tracking-wider hover:text-[#b9cacb] transition-colors"
              >
                {section.title}
                {openSections[section.title] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {openSections[section.title] && (
                <div className="mt-2 space-y-1">
                  {section.items.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#1f2229] mt-auto">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#b9cacb] hover:text-white transition-colors"
          >
            <Activity className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </aside>
    </>
  );
}
