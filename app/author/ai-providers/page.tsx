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

export default function AuthorAIProvidersPage() {
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
      const res = await fetch('/api/author/ai-providers')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/author')
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
      const res = await fetch('/api/author/ai-providers', {
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
      const res = await fetch(`/api/author/ai-providers/${providerId}/test`, {
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
      const res = await fetch(`/api/author/ai-providers/${providerId}/models`, {
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
      const res = await fetch(`/api/author/ai-providers/${providerId}/default`, {
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
      const res = await fetch(`/api/author/ai-providers/${providerId}`, {
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-sky-600 animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-600">Loading AI providers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/author" className="text-neutral-600 hover:text-neutral-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">AI Providers</h1>
              <p className="text-sm text-neutral-600">Configure AI providers for quiz generation</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Provider
          </button>
        </div>

        {error && (
          <div className="mb-6 border border-red-200 bg-red-50 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="grid gap-4">
          {providers.map((provider) => (
            <div key={provider.id} className="border border-neutral-200 bg-neutral-50 p-6 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    provider.is_default 
                      ? 'bg-yellow-100 border border-yellow-300' 
                      : 'bg-sky-50 border border-sky-200'
                  }`}>
                    {getProviderIcon(provider.provider_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-neutral-900">{provider.name}</h3>
                      {provider.is_default && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-xs text-yellow-700">
                          <Star className="h-3 w-3" />
                          Default
                        </span>
                      )}
                      {provider.is_active ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-xs text-emerald-700">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-xs text-red-700">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mb-2">
                      Type: {provider.provider_type.toUpperCase()}
                    </p>
                    {provider.default_model && (
                      <p className="text-xs text-neutral-600">
                        Default Model: {provider.default_model}
                      </p>
                    )}
                    {provider.models && Array.isArray(provider.models) && provider.models.length > 0 && (
                      <p className="text-xs text-neutral-500 mt-1">
                        {provider.models.length} models available
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestConnection(provider.id)}
                    disabled={testingProvider === provider.id}
                    className="p-2 rounded hover:bg-white transition-colors"
                    title="Test Connection"
                  >
                    <RefreshCw className={`h-4 w-4 text-emerald-500 ${testingProvider === provider.id ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleFetchModels(provider.id)}
                    disabled={fetchingModels === provider.id}
                    className="p-2 rounded hover:bg-white transition-colors"
                    title="Fetch Models"
                  >
                    <Settings className={`h-4 w-4 text-sky-600 ${fetchingModels === provider.id ? 'animate-spin' : ''}`} />
                  </button>
                  {!provider.is_default && (
                    <button
                      onClick={() => handleSetDefault(provider.id)}
                      className="p-2 rounded hover:bg-white transition-colors"
                      title="Set as Default"
                    >
                      <Star className="h-4 w-4 text-yellow-500" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteProvider(provider.id)}
                    className="p-2 rounded hover:bg-white transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {providers.length === 0 && (
          <div className="text-center py-12 border border-neutral-200 bg-neutral-50 rounded-xl">
            <Bot className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-neutral-900 mb-2">No AI Providers Configured</h3>
            <p className="text-sm text-neutral-600 mb-4">Add your first AI provider to enable quiz generation</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 mx-auto bg-sky-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-sky-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Provider
            </button>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="border border-neutral-200 bg-white p-6 rounded-xl max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">Add AI Provider</h2>
              <form onSubmit={handleAddProvider}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Provider Name</label>
                    <input
                      type="text"
                      value={newProvider.name}
                      onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-4 py-2 text-neutral-900 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      placeholder="My OpenRouter"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Provider Type</label>
                    <select
                      value={newProvider.provider_type}
                      onChange={(e) => setNewProvider({ ...newProvider, provider_type: e.target.value as ProviderType })}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-4 py-2 text-neutral-900 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    >
                      <option value="openrouter">OpenRouter</option>
                      <option value="openai">OpenAI</option>
                      <option value="gemini">Google Gemini</option>
                      <option value="groq">Groq</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">API Key</label>
                    <input
                      type="password"
                      value={newProvider.api_key}
                      onChange={(e) => setNewProvider({ ...newProvider, api_key: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-4 py-2 text-neutral-900 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      placeholder="sk-..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Base URL (Optional)</label>
                    <input
                      type="text"
                      value={newProvider.base_url}
                      onChange={(e) => setNewProvider({ ...newProvider, base_url: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-4 py-2 text-neutral-900 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      placeholder="https://api.example.com/v1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Default Model (Optional)</label>
                    <input
                      type="text"
                      value={newProvider.default_model}
                      onChange={(e) => setNewProvider({ ...newProvider, default_model: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-4 py-2 text-neutral-900 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
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
                      className="w-4 h-4 rounded border-neutral-300"
                    />
                    <label htmlFor="setDefault" className="text-sm text-neutral-700">
                      Set as default provider
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 border border-neutral-300 text-neutral-600 text-sm px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-sky-600 text-white font-semibold text-sm px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
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
