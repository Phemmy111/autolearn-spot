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
  AlertCircle,
  Activity,
  Clock,
  Server,
  Edit,
} from 'lucide-react'

type ProviderType = 'self_hosted' | 'groq' | 'openrouter' | 'gemini' | 'openai' | 'openai_compatible'
type HealthStatus = 'healthy' | 'degraded' | 'unavailable' | 'unknown'
type AuthType = 'bearer' | 'none' | 'api_key' | 'custom'

interface ProviderConfig {
  id: string
  provider_name: string
  display_name: string
  provider_type: ProviderType
  base_url?: string
  current_model: string
  is_active: boolean
  priority: number
  health_status: HealthStatus
  fallback_enabled: boolean
  capabilities: string[]
  request_timeout: number
  auth_type: AuthType
  last_health_check?: string
  latency_ms?: number
  created_at: string
  updated_at: string
}

export default function AlexProviderPage() {
  const router = useRouter()
  const [providers, setProviders] = useState<ProviderConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(null)
  const [testingProvider, setTestingProvider] = useState<string | null>(null)
  const [fetchingModels, setFetchingModels] = useState<string | null>(null)
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [editApiKey, setEditApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)

  // Form state
  const [newProvider, setNewProvider] = useState({
    provider_name: '',
    display_name: '',
    provider_type: 'self_hosted' as ProviderType,
    api_key: '',
    base_url: '',
    current_model: '',
    priority: 1,
    fallback_enabled: true,
    auth_type: 'none' as AuthType,
    request_timeout: 30000,
  })

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/admin/alex-provider')
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
    if (!newProvider.provider_name || !newProvider.display_name) return

    try {
      const res = await fetch('/api/admin/alex-provider', {
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
        provider_name: '',
        display_name: '',
        provider_type: 'self_hosted',
        api_key: '',
        base_url: '',
        current_model: '',
        priority: 1,
        fallback_enabled: true,
        auth_type: 'none',
        request_timeout: 30000,
      })
      fetchProviders()
    } catch (err: any) {
      setError(err.message || 'Failed to add provider')
    }
  }

  const handleTestConnection = async (providerId: string) => {
    setTestingProvider(providerId)
    try {
      const res = await fetch(`/api/admin/alex-provider/test?id=${providerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await res.json()
      if (result.success) {
        alert('Connection successful!')
        fetchProviders()
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
      const res = await fetch(`/api/admin/alex-provider/models?id=${providerId}`, {
        method: 'POST',
      })

      const data = await res.json()
      if (data.models && data.models.length > 0) {
        setAvailableModels(data.models)
        setShowModelSelector(true)
      } else {
        alert('No models found or failed to fetch models')
      }
    } catch (err: any) {
      alert(`Failed to fetch models: ${err.message}`)
    } finally {
      setFetchingModels(null)
    }
  }

  const handleFetchModelsForNewProvider = async () => {
    if (!newProvider.api_key && newProvider.provider_type !== 'self_hosted') {
      alert('Please enter an API key first')
      return
    }

    setFetchingModels('new')
    try {
      const res = await fetch('/api/admin/alex-provider/models/fetch-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_type: newProvider.provider_type,
          api_key: newProvider.api_key,
          base_url: newProvider.base_url,
        }),
      })

      const data = await res.json()
      if (data.models && data.models.length > 0) {
        setAvailableModels(data.models)
        setShowModelSelector(true)
      } else {
        alert('No models found or failed to fetch models')
      }
    } catch (err: any) {
      alert(`Failed to fetch models: ${err.message}`)
    } finally {
      setFetchingModels(null)
    }
  }

  const handleClearApiKey = async (providerId: string) => {
    if (!confirm('This will clear your API key. You will need to re-enter it. Continue?')) return

    try {
      const res = await fetch(`/api/admin/alex-provider/clear-key?id=${providerId}`, {
        method: 'POST',
      })

      const data = await res.json()
      if (data.success) {
        alert('API key cleared. Please re-enter your API key in the edit form.')
        fetchProviders()
      } else {
        alert(`Failed to clear API key: ${data.error}`)
      }
    } catch (err: any) {
      alert(`Failed to clear API key: ${err.message}`)
    }
  }

  const handleEditProvider = (provider: ProviderConfig) => {
    setEditingProvider(provider)
    setEditApiKey('') // Always start with empty for security
    setShowApiKeyInput(false) // Don't show input by default
    setShowEditModal(true)
  }

  const handleUpdateProvider = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProvider) return

    try {
      const updateData: any = {
        display_name: editingProvider.display_name,
        priority: editingProvider.priority,
        fallback_enabled: editingProvider.fallback_enabled,
        request_timeout: editingProvider.request_timeout,
      }

      // Always include current_model for non-self_hosted providers
      if (editingProvider.provider_type !== 'self_hosted' && editingProvider.current_model) {
        updateData.current_model = editingProvider.current_model
      }

      // Only include API key if user provided a new one
      if (showApiKeyInput && editApiKey && editingProvider.provider_type !== 'self_hosted') {
        updateData.api_key = editApiKey
      }

      const res = await fetch(`/api/admin/alex-provider/update?id=${editingProvider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update provider')
      }

      setShowEditModal(false)
      setEditingProvider(null)
      setEditApiKey('')
      fetchProviders()
    } catch (err: any) {
      setError(err.message || 'Failed to update provider')
    }
  }

  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return

    try {
      const res = await fetch(`/api/admin/alex-provider/update?id=${providerId}`, {
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

  const handleToggleActive = async (providerId: string, currentState: boolean) => {
    try {
      const res = await fetch(`/api/admin/alex-provider/update?id=${providerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentState }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update provider')
      }

      fetchProviders()
    } catch (err: any) {
      setError(err.message || 'Failed to update provider')
    }
  }

  const getProviderIcon = (type: ProviderType) => {
    switch (type) {
      case 'self_hosted':
        return <Server className="h-4 w-4" />
      case 'openrouter':
        return <Globe className="h-4 w-4" />
      case 'openai':
        return <Zap className="h-4 w-4" />
      case 'gemini':
        return <Star className="h-4 w-4" />
      case 'groq':
        return <Bot className="h-4 w-4" />
      case 'openai_compatible':
        return <Key className="h-4 w-4" />
      default:
        return <Bot className="h-4 w-4" />
    }
  }

  const getHealthColor = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return 'text-emerald-400'
      case 'degraded':
        return 'text-yellow-400'
      case 'unavailable':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getHealthIcon = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />
      case 'degraded':
        return <AlertCircle className="h-4 w-4" />
      case 'unavailable':
        return <XCircle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-[#00f0ff] animate-spin mx-auto mb-4" />
          <p className="font-mono text-sm text-[#b9cacb]">Loading ALEX providers...</p>
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
              <h1 className="font-heading text-4xl font-bold text-white">ALEX Providers</h1>
              <p className="font-mono text-sm text-[#b9cacb]">Manage ALEX AI providers with fallback and health monitoring</p>
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
                    provider.health_status === 'healthy'
                      ? 'bg-emerald-400/10 border border-emerald-400/50'
                      : provider.health_status === 'degraded'
                      ? 'bg-yellow-400/10 border border-yellow-400/50'
                      : provider.health_status === 'unavailable'
                      ? 'bg-red-400/10 border border-red-400/50'
                      : 'bg-[#00f0ff]/10 border border-[#00f0ff]/50'
                  }`}>
                    {getProviderIcon(provider.provider_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading text-lg font-bold text-white">{provider.display_name}</h3>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-mono ${getHealthColor(provider.health_status)}`}>
                        {getHealthIcon(provider.health_status)}
                        {provider.health_status}
                      </span>
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
                      {provider.fallback_enabled && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-400/10 border border-blue-400/50 text-xs font-mono text-blue-400">
                          <Activity className="h-3 w-3" />
                          Fallback
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-xs text-[#5d5f63] mb-2">
                      Type: {provider.provider_type.toUpperCase()} • Priority: {provider.priority}
                    </p>
                    {provider.current_model && (
                      <p className="font-mono text-xs text-[#b9cacb]">
                        Model: {provider.current_model}
                      </p>
                    )}
                    {provider.latency_ms && (
                      <p className="font-mono text-xs text-[#5d5f63] mt-1">
                        Latency: {provider.latency_ms}ms
                      </p>
                    )}
                    {provider.last_health_check && (
                      <p className="font-mono text-xs text-[#5d5f63] mt-1">
                        Last check: {new Date(provider.last_health_check).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditProvider(provider)}
                    className="p-2 rounded hover:bg-[#1f2229] transition-colors"
                    title="Edit Provider"
                  >
                    <Edit className="h-4 w-4 text-[#00f0ff]" />
                  </button>
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
                    <Globe className={`h-4 w-4 text-[#00f0ff] ${fetchingModels === provider.id ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleClearApiKey(provider.id)}
                    className="p-2 rounded hover:bg-[#1f2229] transition-colors"
                    title="Clear API Key (to re-enter)"
                  >
                    <Key className="h-4 w-4 text-orange-400" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(provider.id, provider.is_active)}
                    className="p-2 rounded hover:bg-[#1f2229] transition-colors"
                    title={provider.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {provider.is_active ? (
                      <XCircle className="h-4 w-4 text-yellow-400" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    )}
                  </button>
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
            <h3 className="font-heading text-xl font-bold text-white mb-2">No ALEX Providers Configured</h3>
            <p className="font-mono text-sm text-[#b9cacb] mb-4">Add your first ALEX provider to enable AI features</p>
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
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto my-4">
              <h2 className="font-heading text-2xl font-bold text-white mb-4">Add ALEX Provider</h2>
              <form onSubmit={handleAddProvider}>
                <div className="space-y-4">
                  <div>
                    <label className="block font-mono text-xs text-[#b9cacb] mb-2">Provider Name (Internal)</label>
                    <input
                      type="text"
                      value={newProvider.provider_name}
                      onChange={(e) => setNewProvider({ ...newProvider, provider_name: e.target.value })}
                      className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                      placeholder="alex-primary-groq"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-[#b9cacb] mb-2">Display Name</label>
                    <input
                      type="text"
                      value={newProvider.display_name}
                      onChange={(e) => setNewProvider({ ...newProvider, display_name: e.target.value })}
                      className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                      placeholder="ALEX Primary (Groq)"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-[#b9cacb] mb-2">Provider Type</label>
                    <select
                      value={newProvider.provider_type}
                      onChange={(e) => {
                        const type = e.target.value as ProviderType
                        setNewProvider({
                          ...newProvider,
                          provider_type: type,
                          auth_type: type === 'self_hosted' ? 'none' : 'bearer',
                        })
                      }}
                      className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                    >
                      <option value="self_hosted">Self-Hosted (Ollama, vLLM)</option>
                      <option value="groq">Groq</option>
                      <option value="openrouter">OpenRouter</option>
                      <option value="openai">OpenAI</option>
                      <option value="gemini">Google Gemini</option>
                      <option value="openai_compatible">OpenAI-Compatible Custom</option>
                    </select>
                  </div>
                  {newProvider.provider_type !== 'self_hosted' && (
                    <div>
                      <label className="block font-mono text-xs text-[#b9cacb] mb-2">API Key</label>
                      <input
                        type="password"
                        value={newProvider.api_key}
                        onChange={(e) => setNewProvider({ ...newProvider, api_key: e.target.value })}
                        className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                        placeholder="sk-..."
                        required={newProvider.provider_type !== 'self_hosted'}
                      />
                    </div>
                  )}
                  {(newProvider.provider_type === 'self_hosted' || newProvider.provider_type === 'openai_compatible') && (
                    <div>
                      <label className="block font-mono text-xs text-[#b9cacb] mb-2">Base URL</label>
                      <input
                        type="text"
                        value={newProvider.base_url}
                        onChange={(e) => setNewProvider({ ...newProvider, base_url: e.target.value })}
                        className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                        placeholder="http://localhost:11434/v1"
                        required
                      />
                    </div>
                  )}
                  <div>
                    <label className="block font-mono text-xs text-[#b9cacb] mb-2">Current Model</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newProvider.current_model}
                        onChange={(e) => setNewProvider({ ...newProvider, current_model: e.target.value })}
                        className="flex-1 bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                        placeholder="llama3-70b-8192"
                        required
                      />
                      {newProvider.provider_type !== 'self_hosted' && (
                        <button
                          type="button"
                          onClick={handleFetchModelsForNewProvider}
                          disabled={fetchingModels === 'new' || !newProvider.api_key}
                          className="border border-[#3b494b] text-[#b9cacb] font-mono text-xs px-3 py-2 rounded hover:bg-[#1f2229] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {fetchingModels === 'new' ? 'Loading...' : 'Fetch'}
                        </button>
                      )}
                    </div>
                    <p className="font-mono text-xs text-[#5d5f63] mt-1">
                      {newProvider.provider_type === 'groq' && 'Common models: llama3-70b-8192, mixtral-8x7b-32768, gemma-7b-it'}
                      {newProvider.provider_type === 'openai' && 'Common models: gpt-4o-mini, gpt-4o, gpt-3.5-turbo'}
                      {newProvider.provider_type === 'gemini' && 'Use Fetch button to load available Gemini models'}
                      {newProvider.provider_type === 'openrouter' && 'Enter any OpenRouter model ID'}
                      {newProvider.provider_type === 'self_hosted' && 'Enter your self-hosted model name'}
                      {newProvider.provider_type === 'openai_compatible' && 'Enter your custom model name'}
                    </p>
                    {showModelSelector && availableModels.length > 0 && (
                      <div className="mt-2 p-2 bg-[#1f2229] border border-[#3b494b] rounded max-h-40 overflow-y-auto">
                        <p className="font-mono text-xs text-[#b9cacb] mb-2 font-bold">Available Models:</p>
                        {availableModels.map((model) => (
                          <button
                            key={model}
                            type="button"
                            onClick={() => {
                              setNewProvider({ ...newProvider, current_model: model })
                              setShowModelSelector(false)
                            }}
                            className="block w-full text-left px-2 py-1 font-mono text-xs text-[#b9cacb] hover:bg-[#2a2d35] hover:text-white rounded transition-colors"
                          >
                            {model}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-[#b9cacb] mb-2">Priority (Lower = Higher Priority)</label>
                    <input
                      type="number"
                      value={newProvider.priority}
                      onChange={(e) => setNewProvider({ ...newProvider, priority: parseInt(e.target.value) || 1 })}
                      className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-[#b9cacb] mb-2">Request Timeout (ms)</label>
                    <input
                      type="number"
                      value={newProvider.request_timeout}
                      onChange={(e) => setNewProvider({ ...newProvider, request_timeout: parseInt(e.target.value) || 30000 })}
                      className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                      min="1000"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="fallbackEnabled"
                      checked={newProvider.fallback_enabled}
                      onChange={(e) => setNewProvider({ ...newProvider, fallback_enabled: e.target.checked })}
                      className="w-4 h-4 rounded border-[#3b494b] bg-[#1f2229]"
                    />
                    <label htmlFor="fallbackEnabled" className="font-mono text-xs text-[#b9cacb]">
                      Enable as fallback provider
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

        {showEditModal && editingProvider && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto my-4">
              <h2 className="font-heading text-2xl font-bold text-white mb-4">Edit Provider</h2>
              <form onSubmit={handleUpdateProvider}>
                <div className="space-y-4">
                  <div>
                    <label className="block font-mono text-xs text-[#b9cacb] mb-2">Display Name</label>
                    <input
                      type="text"
                      value={editingProvider.display_name}
                      onChange={(e) => setEditingProvider({ ...editingProvider, display_name: e.target.value })}
                      className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                      required
                    />
                  </div>
                  {editingProvider.provider_type !== 'self_hosted' && (
                    <div>
                      <label className="block font-mono text-xs text-[#b9cacb] mb-2">API Key</label>
                      {!showApiKeyInput ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm">
                            ✓ Configured
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowApiKeyInput(true)
                              setEditApiKey('')
                            }}
                            className="px-3 py-2 bg-[#1f2229] border border-[#3b494b] text-[#b9cacb] font-mono text-xs rounded hover:bg-[#2a2d35] transition-colors"
                          >
                            Replace Key
                          </button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="password"
                            value={editApiKey}
                            onChange={(e) => {
                              setEditApiKey(e.target.value)
                            }}
                            className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                            placeholder="Enter new API key"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setShowApiKeyInput(false)
                              setEditApiKey('')
                            }}
                            className="mt-2 text-xs text-[#5d5f63] font-mono hover:text-[#b9cacb]"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block font-mono text-xs text-[#b9cacb] mb-2">Current Model</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingProvider.current_model}
                        onChange={(e) => setEditingProvider({ ...editingProvider, current_model: e.target.value })}
                        className="flex-1 bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                        placeholder="Enter model ID or fetch from provider"
                        required={editingProvider.provider_type !== 'self_hosted'}
                      />
                      <button
                        type="button"
                        onClick={() => handleFetchModels(editingProvider.id)}
                        disabled={fetchingModels === editingProvider.id}
                        className="px-3 py-2 bg-[#00f0ff] text-black font-bold font-mono text-xs rounded hover:bg-white transition-colors"
                        title="Fetch Models"
                      >
                        {fetchingModels === editingProvider.id ? 'Loading...' : 'Fetch Models'}
                      </button>
                    </div>
                    {showModelSelector && availableModels.length > 0 && (
                      <div className="mt-2 p-2 bg-[#1f2229] border border-[#3b494b] rounded max-h-40 overflow-y-auto">
                        <p className="font-mono text-xs text-[#b9cacb] mb-2 font-bold">Available Models:</p>
                        {availableModels.map((model) => (
                          <button
                            key={model}
                            type="button"
                            onClick={() => {
                              setEditingProvider({ ...editingProvider, current_model: model })
                              setShowModelSelector(false)
                            }}
                            className="block w-full text-left px-2 py-1 font-mono text-xs text-[#b9cacb] hover:bg-[#2a2d35] rounded mb-1"
                          >
                            {model}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-[#b9cacb] mb-2">Priority (Lower = Higher Priority)</label>
                    <input
                      type="number"
                      value={editingProvider.priority}
                      onChange={(e) => setEditingProvider({ ...editingProvider, priority: parseInt(e.target.value) || 1 })}
                      className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-[#b9cacb] mb-2">Request Timeout (ms)</label>
                    <input
                      type="number"
                      value={editingProvider.request_timeout}
                      onChange={(e) => setEditingProvider({ ...editingProvider, request_timeout: parseInt(e.target.value) || 30000 })}
                      className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                      min="1000"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="editFallbackEnabled"
                      checked={editingProvider.fallback_enabled}
                      onChange={(e) => setEditingProvider({ ...editingProvider, fallback_enabled: e.target.checked })}
                      className="w-4 h-4 rounded border-[#3b494b] bg-[#1f2229]"
                    />
                    <label htmlFor="editFallbackEnabled" className="font-mono text-xs text-[#b9cacb]">
                      Enable as fallback provider
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingProvider(null)
                      setEditApiKey('')
                      setShowModelSelector(false)
                    }}
                    className="flex-1 border border-[#3b494b] text-[#b9cacb] font-mono text-sm px-4 py-2 rounded hover:bg-[#1f2229] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#00f0ff] text-black font-bold font-mono text-sm px-4 py-2 rounded hover:bg-white transition-colors"
                  >
                    Save Changes
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
