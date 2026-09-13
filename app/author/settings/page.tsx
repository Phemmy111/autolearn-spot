'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Settings, 
  User, 
  CreditCard, 
  Bot, 
  MessageSquare,
  ChevronRight,
  ArrowLeft
} from 'lucide-react'

export default function AuthorSettingsPage() {
  const router = useRouter()

  const settingsItems = [
    {
      title: 'Profile',
      description: 'Manage your profile information',
      icon: User,
      href: '/author/settings/profile',
      comingSoon: true
    },
    {
      title: 'Bank Details',
      description: 'Manage your bank details for withdrawals',
      icon: CreditCard,
      href: '/author/settings/bank-details',
      comingSoon: true
    },
    {
      title: 'AI Providers',
      description: 'Configure AI providers for quiz generation',
      icon: Bot,
      href: '/author/ai-providers',
      comingSoon: false
    },
    {
      title: 'AI Prompts',
      description: 'Manage AI prompts for content generation',
      icon: MessageSquare,
      href: '/author/ai-prompts',
      comingSoon: false
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/author" className="text-neutral-600 hover:text-neutral-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Settings</h1>
            <p className="text-sm text-neutral-600">Manage your account and preferences</p>
          </div>
        </div>

        <div className="grid gap-4 max-w-2xl">
          {settingsItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`border border-neutral-200 bg-neutral-50 p-6 rounded-xl flex items-center justify-between hover:bg-neutral-100 transition-colors ${
                item.comingSoon ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              onClick={(e) => {
                if (item.comingSoon) {
                  e.preventDefault()
                }
              }}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-50 rounded-lg">
                  <item.icon className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">{item.title}</h3>
                  <p className="text-sm text-neutral-600">{item.description}</p>
                  {item.comingSoon && (
                    <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-neutral-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
