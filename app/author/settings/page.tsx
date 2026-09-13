'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Settings, 
  Bot, 
  MessageSquare,
  ArrowLeft,
  User
} from 'lucide-react'

export default function AuthorSettingsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[var(--card)]">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/author" className="text-brand-text/70 hover:text-brand-text">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-brand-text">Settings</h1>
            <p className="text-sm text-brand-text/70">Manage your AI configuration</p>
          </div>
        </div>

        <div className="grid gap-4 max-w-2xl">
          <Link
            href="/author/settings/profile"
            className="border border-brand-border bg-brand-bg p-6 rounded-xl flex items-center justify-between hover:bg-[var(--card)] brightness-95 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-primary/10 rounded-lg">
                <User className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-brand-text">Public Profile</h3>
                <p className="text-sm text-brand-text/70">Update your picture, bio, and track record</p>
              </div>
            </div>
          </Link>

          <Link
            href="/author/ai-providers"
            className="border border-brand-border bg-brand-bg p-6 rounded-xl flex items-center justify-between hover:bg-[var(--card)] brightness-95 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-sky-50 rounded-lg">
                <Bot className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <h3 className="font-semibold text-brand-text">AI Providers</h3>
                <p className="text-sm text-brand-text/70">Configure AI providers for quiz generation</p>
              </div>
            </div>
          </Link>

          <Link
            href="/author/ai-prompts"
            className="border border-brand-border bg-brand-bg p-6 rounded-xl flex items-center justify-between hover:bg-[var(--card)] brightness-95 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-sky-50 rounded-lg">
                <MessageSquare className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <h3 className="font-semibold text-brand-text">AI Prompts</h3>
                <p className="text-sm text-brand-text/70">Manage AI prompts for content generation</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
