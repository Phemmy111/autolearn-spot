'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Bot, 
  Plus, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Trash2,
  ArrowLeft,
  RefreshCw,
  Star,
  Key,
  Globe,
  Zap,
  AlertCircle
} from 'lucide-react'
import { AIProvider, ProviderType } from '@/lib/ai-provider'

export default function AIProvidersPage() {
  const router = useRouter()
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [testingProvider, setTestingProvider] = useState<string | null>(null)
  const [fetchingModels, setFetchingModels] = useState<string | null>(null)

  // Form state
  const [newProvider, setNewProvider] = useState({
    name: '',
    provider_type: 'openrouter' as ProviderType,
    api_key: '',
    base_url: '',
    default_model: '',
  })

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
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load providers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders()
  }, [router])

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProvider.name || !newProvider.api_key) return

    try {
      const res = await fetch('/api/admin/ai-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProvider),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to add provider')
      }

      setShowAddModal(false)
      setNewProvider({
        name: '',
        provider_type: 'openrouter',
        api_key: '',
        base_url: '',
        default_model: '',
      })
      fetchProviders()
    } catch (err: any) {
      setError(err.message || 'Failed to add provider')
    }
  }

  const handleTestConnection = async (providerId: string) => {
    setTestingProvider(providerId)
    try {
      const res = await fetch(`/api/admin/ai-providers/${providerId}/test`, {
        method: 'POST',
      })

      const result = await res.json()
      if (result.success) {
        alert('Connection successful!')
      } else {
        alert(`Connection failed: ${result.error}`)
      }
    } catch (err: any) {
      alert(`Connection failed: ${err.message}`)
    } finally {
      setTestingProvider(null)
    }
  }

  const handleFetchModels = async (providerId: string) => {
    setFetchingModels(providerId)
    try {
      const res = await fetch(`/api/admin/ai-providers/${providerId}/models`, {
        method: 'POST',
      })

      const data = await res.json()
      if (data.models && data.models.length > 0) {
        alert(`Successfully fetched ${data.models.length} models`)
        fetchProviders()
      } else {
        alert('No models found or fetch failed')
      }
    } catch (err: any) {
      alert(`Failed to fetch models: ${err.message}`)
    } finally {
      setFetchingModels(null)
    }
  }

  const handleSetDefault = async (providerId: string) => {
    try {
      const res = await fetch(`/api/admin/ai-providers/${providerId}/default`, {
        method: 'POST',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to set default')
      }

      fetchProviders()
    } catch (err: any) {
      setError(err.message || 'Failed to set default provider')
    }
  }

  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return

    try {
      const res = await fetch(`/api/admin/ai-providers/${providerId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete provider')
      }

      fetchProviders()
    } catch (err: any) {
      setError(err.message || 'Failed to delete provider')
    }
  }

  const getProviderIcon = (type: ProviderType) => {
    switch (type) {
      case 'openrouter':
        return <Globe className="h-4 w-4" />
      case 'openai':
        return <Zap className="h-4 w-4" />
      case 'gemini':
        return <Star className="h-4 w-4" />
      case 'groq':
        return <Bot className="h-4 w-4" />
      default:
        return <Bot className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-[#00f0ff] animate-spin mx-auto mb-4" />
          <p className="font-mono text-sm text-[#b9cacb]">Loading AI providers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-[#b9cacb] hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-heading text-4xl font-bold text-white">AI Providers</h1>
              <p className="font-mono text-sm text-[#b9cacb]">Manage AI providers and API keys</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-6 py-2 rounded hover:bg-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Provider
          </button>
        </div>

        {error && (
          <div className="mb-6 border border-red-500/50 bg-red-500/10 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="font-mono text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="grid gap-4">
          {providers.map((provider) => (
            <div key={provider.id} className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    provider.is_default 
                      ? 'bg-yellow-400/10 border border-yellow-400/50' 
                      : 'bg-[#00f0ff]/10 border border-[#00f0ff]/50'
                  }`}>
                    {getProviderIcon(provider.provider_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading text-lg font-bold text-white">{provider.name}</h3>
                      {provider.is_default && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/50 text-xs font-mono text-yellow-400">
                          <Star className="h-3 w-3" />
                          Default
                        </span>
                      )}
                      {provider.is_active ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/50 text-xs font-mono text-emerald-400">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-400/10 border border-red-400/50 text-xs font-mono text-red-400">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-xs text-[#5d5f63] mb-2">
                      Type: {provider.provider_type.toUpperCase()}
                    </p>
                    {provider.default_model && (
                      <p className="font-mono text-xs text-[#b9cacb]">
                        Default Model: {provider.default_model}
                      </p>
                    )}
                    {provider.models && Array.isArray(provider.models) && provider.models.length > 0 && (
                      <p className="font-mono text-xs text-[#5d5f63] mt-1">
                        {provider.models.length} models available
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestConnection(provider.id)}
                    disabled={testingProvider === provider.id}
                    className="p-2 rounded hover:bg-[#1f2229] transition-colors"
                    title="Test Connection"
                  >
                    <RefreshCw className={`h-4 w-4 text-emerald-400 ${testingProvider === provider.id ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleFetchModels(provider.id)}
                    disabled={fetchingModels === provider.id}
                    className="p-2 rounded hover:bg-[#1f2229] transition-colors"
                    title="Fetch Models"
                  >
                    <Settings className={`h-4 w-4 text-[#00f0ff] ${fetchingModels === provider.id ? 'animate-spin' : ''}`} />
                  </button>
                  {!provider.is_default && (
                    <button
                      onClick={() => handleSetDefault(provider.id)}
                      className="p-2 rounded hover:bg-[#1f2229] transition-colors"
                      title="Set as Default"
                    >
                      <Star className="h-4 w-4 text-yellow-400" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteProvider(provider.id)}
                    className="p-2 rounded hover:bg-[#1f2229] transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {providers.length === 0 && (
          <div className="text-center py-12 border border-[#1f2229] bg-[#0c0e12] rounded-xl">
            <Bot className="h-16 w-16 text-[#3b494b] mx-auto mb-4" />
            <h3 className="font-heading text-xl font-bold text-white mb-2">No AI Providers Configured</h3>
            <p className="font-mono text-sm text-[#b9cacb] mb-4">Add your first AI provider to enable AI features</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 mx-auto bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-6 py-2 rounded hover:bg-white transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Provider
            </button>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl max-w-md w-full mx-4">
              <h2 className="font-heading text-2xl font-bold text-white mb-4">Add AI Provider</h2>
              <form onSubmit={handleAddProvider}>
                <div className="space-y-4">
                  <div>
                    <label className="block font-mono text-xs text-[#b9cacb] mb-2">Provider Name</label>
                    <input
                      type="text"
                      value={newProvider.name}
                      onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                      className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                      placeholder="My OpenRouter"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-[#b9cacb] mb-2">Provider Type</label>
                    <select
                      value={newProvider.provider_type}
                      onChange={(e) => setNewProvider({ ...newProvider, provider_type: e.target.value as ProviderType })}
                      className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                    >
                      <option value="openrouter">OpenRouter</option>
                      <option value="openai">OpenAI</option>
                      <option value="gemini">Google Gemini</option>
                      <option value="groq">Groq</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-[#b9cacb] mb-2">API Key</label>
                    <input
                      type="password"
                      value={newProvider.api_key}
                      onChange={(e) => setNewProvider({ ...newProvider, api_key: e.target.value })}
                      className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                      placeholder="sk-..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-[#b9cacb] mb-2">Base URL (Optional)</label>
                    <input
                      type="text"
                      value={newProvider.base_url}
                      onChange={(e) => setNewProvider({ ...newProvider, base_url: e.target.value })}
                      className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                      placeholder="https://api.example.com/v1"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-[#b9cacb] mb-2">Default Model (Optional)</label>
                    <input
                      type="text"
                      value={newProvider.default_model}
                      onChange={(e) => setNewProvider({ ...newProvider, default_model: e.target.value })}
                      className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                      placeholder="anthropic/claude-3.5-sonnet"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="setDefault"
                      checked={!!newProvider.default_model}
                      onChange={(e) => {
                        if (e.target.checked && !newProvider.default_model) {
                          setNewProvider({ ...newProvider, default_model: 'default' })
                        }
                      }}
                      className="w-4 h-4 rounded border-[#3b494b] bg-[#1f2229]"
                    />
                    <label htmlFor="setDefault" className="font-mono text-xs text-[#b9cacb]">
                      Set as default provider
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 border border-[#3b494b] text-[#b9cacb] font-mono text-sm px-4 py-2 rounded hover:bg-[#1f2229] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#00f0ff] text-black font-bold font-mono text-sm px-4 py-2 rounded hover:bg-white transition-colors"
                  >
                    Add Provider
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
