'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Send, 
  ArrowLeft, 
  Bot, 
  Settings,
  Loader2,
  Copy,
  CheckCircle
} from 'lucide-react'
import { AIProvider, ProviderType } from '@/lib/ai-provider'

export default function AIPlaygroundPage() {
  const router = useRouter()
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/admin/ai-providers')
      if (!res.ok) {
        if (res.status === 403) {
          router.push('/admin')
          return
        }
        throw new Error('Failed to fetch providers')
      }
      const data = await res.json()
      setProviders(data.providers || [])
      
      // Select default provider if available
      const defaultProvider = data.providers?.find((p: AIProvider) => p.is_default)
      if (defaultProvider) {
        setSelectedProvider(defaultProvider.id)
        if (defaultProvider.models && Array.isArray(defaultProvider.models)) {
          setAvailableModels(defaultProvider.models)
          if (defaultProvider.default_model) {
            setSelectedModel(defaultProvider.default_model)
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching providers:', err)
    }
  }

  const handleProviderChange = async (providerId: string) => {
    setSelectedProvider(providerId)
    const provider = providers.find(p => p.id === providerId)
    if (provider?.models && Array.isArray(provider.models)) {
      setAvailableModels(provider.models)
      if (provider.default_model) {
        setSelectedModel(provider.default_model)
      } else if (provider.models.length > 0) {
        setSelectedModel(provider.models[0])
      }
    }
  }

  const handleFetchModels = async () => {
    if (!selectedProvider) return

    try {
      const res = await fetch(`/api/admin/ai-providers/${selectedProvider}/models`, {
        method: 'POST',
      })

      const data = await res.json()
      if (data.models && data.models.length > 0) {
        setAvailableModels(data.models)
        if (data.models.length > 0) {
          setSelectedModel(data.models[0])
        }
      }
    } catch (err: any) {
      console.error('Error fetching models:', err)
    }
  }

  const handleSend = async () => {
    if (!prompt.trim() || !selectedProvider || !selectedModel) return

    setLoading(true)
    setResponse('')

    try {
      const res = await fetch('/api/admin/ai-playground/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          providerId: selectedProvider,
          model: selectedModel,
        }),
      })

      const data = await res.json()
      
      if (data.success) {
        setResponse(data.content || '')
      } else {
        setResponse(`Error: ${data.error}`)
      }
    } catch (err: any) {
      setResponse(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="text-[#b9cacb] hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-heading text-4xl font-bold text-white">AI Playground</h1>
            <p className="font-mono text-sm text-[#b9cacb]">Test AI prompts and responses</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="space-y-4">
            <div className="border border-[#1f2229] bg-[#0c0e12] p-4 rounded-xl">
              <label className="block font-mono text-xs text-[#b9cacb] mb-2">Provider</label>
              <select
                value={selectedProvider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
              >
                <option value="">Select a provider</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} {provider.is_default ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="border border-[#1f2229] bg-[#0c0e12] p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <label className="block font-mono text-xs text-[#b9cacb]">Model</label>
                <button
                  onClick={handleFetchModels}
                  className="flex items-center gap-1 text-xs font-mono text-[#00f0ff] hover:text-white"
                >
                  <Settings className="h-3 w-3" />
                  Refresh Models
                </button>
              </div>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                disabled={!selectedProvider}
              >
                <option value="">Select a model</option>
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            <div className="border border-[#1f2229] bg-[#0c0e12] p-4 rounded-xl">
              <label className="block font-mono text-xs text-[#b9cacb] mb-2">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff] min-h-[200px] resize-y"
                placeholder="Enter your prompt here..."
              />
            </div>

            <button
              onClick={handleSend}
              disabled={loading || !prompt.trim() || !selectedProvider || !selectedModel}
              className="w-full flex items-center justify-center gap-2 bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-6 py-3 rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Generate Response
                </>
              )}
            </button>
          </div>

          {/* Output Panel */}
          <div className="border border-[#1f2229] bg-[#0c0e12] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <label className="block font-mono text-xs text-[#b9cacb]">Response</label>
              {response && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs font-mono text-[#00f0ff] hover:text-white"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="bg-[#1f2229] rounded p-4 min-h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Bot className="h-8 w-8 text-[#00f0ff] animate-pulse mx-auto mb-4" />
                    <p className="font-mono text-sm text-[#b9cacb]">Generating response...</p>
                  </div>
                </div>
              ) : response ? (
                <pre className="font-mono text-sm text-white whitespace-pre-wrap break-words">
                  {response}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Bot className="h-16 w-16 text-[#3b494b] mx-auto mb-4" />
                    <p className="font-mono text-sm text-[#5d5f63]">
                      Enter a prompt and select a provider to generate a response
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {providers.length === 0 && (
          <div className="mt-8 text-center py-12 border border-[#1f2229] bg-[#0c0e12] rounded-xl">
            <Bot className="h-16 w-16 text-[#3b494b] mx-auto mb-4" />
            <h3 className="font-heading text-xl font-bold text-white mb-2">No AI Providers Configured</h3>
            <p className="font-mono text-sm text-[#b9cacb] mb-4">
              Add an AI provider to use the playground
            </p>
            <Link
              href="/admin/ai-providers"
              className="inline-flex items-center gap-2 bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-6 py-2 rounded hover:bg-white transition-colors"
            >
              <Settings className="h-4 w-4" />
              Configure Providers
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
