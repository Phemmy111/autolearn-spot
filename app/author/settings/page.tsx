'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Settings, 
  Bot, 
  MessageSquare,
  ArrowLeft
} from 'lucide-react'

export default function AuthorSettingsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/author" className="text-neutral-600 hover:text-neutral-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Settings</h1>
            <p className="text-sm text-neutral-600">Manage your AI configuration</p>
          </div>
        </div>

        <div className="grid gap-4 max-w-2xl">
          <Link
            href="/author/ai-providers"
            className="border border-neutral-200 bg-neutral-50 p-6 rounded-xl flex items-center justify-between hover:bg-neutral-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-sky-50 rounded-lg">
                <Bot className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">AI Providers</h3>
                <p className="text-sm text-neutral-600">Configure AI providers for quiz generation</p>
              </div>
            </div>
          </Link>

          <Link
            href="/author/ai-prompts"
            className="border border-neutral-200 bg-neutral-50 p-6 rounded-xl flex items-center justify-between hover:bg-neutral-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-sky-50 rounded-lg">
                <MessageSquare className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">AI Prompts</h3>
                <p className="text-sm text-neutral-600">Manage AI prompts for content generation</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
