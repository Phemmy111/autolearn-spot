'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bot, 
  Save, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ArrowLeft,
  Key,
  Globe,
  Settings,
  AlertCircle
} from 'lucide-react'
import { AlexProviderType } from '@/lib/alex/alex-provider'

export default function AlexProviderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [config, setConfig] = useState({
    provider_name: 'ALEX Primary Provider',
    provider_type: 'openrouter' as AlexProviderType,
    api_key: '',
    base_url: '',
    maxTokens: 4000,
    temperature: 0.7,
    dailyRequestLimit: 100,
    monthlyRequestLimit: 3000,
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/admin/alex-provider')
      if (res.ok) {
        const data = await res.json()
        if (data.provider) {
          setConfig({
            provider_name: data.provider.provider_name,
            provider_type: data.provider.provider_type,
            api_key: '', // Never load actual API key for security
            base_url: data.provider.base_url || '',
            maxTokens: data.provider.cost_controls?.maxTokens || 4000,
            temperature: data.provider.cost_controls?.temperature || 0.7,
            dailyRequestLimit: data.provider.cost_controls?.dailyRequestLimit || 100,
            monthlyRequestLimit: data.provider.cost_controls?.monthlyRequestLimit || 3000,
          })
        }
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const res = await fetch('/api/admin/alex-provider/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_type: config.provider_type,
          api_key: config.api_key,
          base_url: config.base_url,
        }),
      })
      
      const data = await res.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({ success: false, error: 'Connection test failed' })
    } finally {
      setTesting(false)
    }
  }

  const saveConfig = async () => {
    if (!config.api_key) {
      setError('API key is required')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/admin/alex-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_name: config.provider_name,
          provider_type: config.provider_type,
          api_key: config.api_key,
          base_url: config.base_url,
          cost_controls: {
            maxTokens: config.maxTokens,
            temperature: config.temperature,
            dailyRequestLimit: config.dailyRequestLimit,
            monthlyRequestLimit: config.monthlyRequestLimit,
          },
        }),
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save configuration')
      }
    } catch (error) {
      setError('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0e12] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-[#00f0ff] animate-spin mx-auto mb-4" />
          <p className="text-[#b9cacb]">Loading ALEX provider configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0c0e12]">
      {/* Header */}
      <div className="border-b border-[#1f2229] bg-[#0c0e12]/95 backdrop-blur-xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="text-[#b9cacb] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-[#00f0ff]/10 rounded-lg">
                <Bot className="h-5 w-5 text-[#00f0ff]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">ALEX Provider Configuration</h1>
                <p className="text-xs text-[#b9cacb]">Configure independent AI provider for ALEX</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">Provider Settings</h2>
            <p className="text-sm text-[#b9cacb]">
              Configure the AI provider that ALEX will use. This is independent from the general admin AI system.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-400">Configuration saved successfully</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Provider Name */}
            <div>
              <label className="block text-sm font-medium text-[#b9cacb] mb-2">Provider Name</label>
              <input
                type="text"
                value={config.provider_name}
                onChange={(e) => setConfig({ ...config, provider_name: e.target.value })}
                className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                placeholder="e.g., ALEX Primary Provider"
              />
            </div>

            {/* Provider Type */}
            <div>
              <label className="block text-sm font-medium text-[#b9cacb] mb-2">Provider Type</label>
              <select
                value={config.provider_type}
                onChange={(e) => setConfig({ ...config, provider_type: e.target.value as AlexProviderType })}
                className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
              >
                <option value="openrouter">OpenRouter</option>
                <option value="openai">OpenAI</option>
                <option value="gemini">Google Gemini</option>
                <option value="groq">Groq</option>
              </select>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-[#b9cacb] mb-2">API Key</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b9cacb]" />
                <input
                  type="password"
                  value={config.api_key}
                  onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  placeholder="Enter your API key"
                />
              </div>
              <p className="text-xs text-[#b9cacb] mt-1">This will be encrypted and stored securely</p>
            </div>

            {/* Base URL */}
            <div>
              <label className="block text-sm font-medium text-[#b9cacb] mb-2">Base URL (Optional)</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b9cacb]" />
                <input
                  type="text"
                  value={config.base_url}
                  onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  placeholder="Custom base URL if needed"
                />
              </div>
              <p className="text-xs text-[#b9cacb] mt-1">Leave empty to use provider's default URL</p>
            </div>

            {/* Cost Controls */}
            <div className="border-t border-[#1f2229] pt-6">
              <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Cost Controls
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">Max Tokens</label>
                  <input
                    type="number"
                    value={config.maxTokens}
                    onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">Temperature</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={config.temperature}
                    onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">Daily Request Limit</label>
                  <input
                    type="number"
                    value={config.dailyRequestLimit}
                    onChange={(e) => setConfig({ ...config, dailyRequestLimit: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">Monthly Request Limit</label>
                  <input
                    type="number"
                    value={config.monthlyRequestLimit}
                    onChange={(e) => setConfig({ ...config, monthlyRequestLimit: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>
              </div>
            </div>

            {/* Test Connection */}
            <div className="border-t border-[#1f2229] pt-6">
              <button
                onClick={testConnection}
                disabled={testing || !config.api_key}
                className="flex items-center gap-2 px-4 py-2 bg-[#1f2229] border border-[#1f2229] rounded-lg text-sm text-[#b9cacb] hover:text-white hover:border-[#00f0ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Test Connection
                  </>
                )}
              </button>

              {testResult && (
                <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                  testResult.success 
                    ? 'bg-green-500/10 border border-green-500/20' 
                    : 'bg-red-500/10 border border-red-500/20'
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <p className={`text-sm ${
                    testResult.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {testResult.success ? 'Connection successful!' : testResult.error}
                  </p>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6">
              <button
                onClick={saveConfig}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-[#00f0ff] text-[#00363a] rounded-lg font-medium hover:bg-[#00f0ff]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Configuration
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}