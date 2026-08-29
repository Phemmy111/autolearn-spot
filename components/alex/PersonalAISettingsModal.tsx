import { useState, useEffect } from 'react'
import { X, Key, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

interface PersonalAISettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PersonalAISettingsModal({ isOpen, onClose }: PersonalAISettingsModalProps) {
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'gemini' | 'groq' | ''>('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [isSaved, setIsSaved] = useState(false)
  const [availableModels, setAvailableModels] = useState<{id: string, name: string}[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    if (isOpen) {
      const savedConfig = localStorage.getItem('alex_personal_provider')
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig)
          setProvider(config.provider || '')
          setApiKey(config.apiKey || '')
          setModel(config.model || '')
        } catch (e) {
          console.error('Failed to parse personal provider config')
        }
      }
      setIsSaved(false)
    }
  }, [isOpen])

  useEffect(() => {
    const fetchModels = async () => {
      if (!provider || apiKey.length < 10) {
        setAvailableModels([]);
        return;
      }
      
      setIsLoadingModels(true);
      setFetchError('');
      
      try {
        const res = await fetch('/api/alex/providers/models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, apiKey })
        });
        if (res.ok) {
          const data = await res.json();
          setAvailableModels(data.models || []);
        } else {
          const err = await res.json().catch(() => ({ error: 'Failed to fetch models' }));
          setFetchError(err.error || `Failed to fetch ${provider} models`);
        }
      } catch (e) {
        setFetchError('Network error');
      } finally {
        setIsLoadingModels(false);
      }
    }

    const timeout = setTimeout(() => {
      fetchModels();
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [apiKey, provider]);

  if (!isOpen) return null

  const handleSave = () => {
    if (provider && apiKey) {
      localStorage.setItem('alex_personal_provider', JSON.stringify({
        provider,
        apiKey,
        model
      }))
      setIsSaved(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    } else {
      localStorage.removeItem('alex_personal_provider')
      setProvider('')
      setApiKey('')
      setModel('')
      setIsSaved(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    }
  }

  const isModelInList = availableModels.some(m => m.id === model);
  const showCustomInput = model === 'custom' || (model !== '' && !isModelInList && availableModels.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan-400" />
            Personal AI Settings
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <div className="mb-6 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
            <p className="text-sm text-cyan-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Use your own API key to bypass general limits. This key is stored locally in your browser and sent securely to the server during chats. To clear your settings, just clear the form and save.</span>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Provider</label>
              <select 
                value={provider}
                onChange={(e) => setProvider(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="">Select a provider...</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="gemini">Google Gemini</option>
                <option value="groq">Groq</option>
              </select>
            </div>
            
            {provider && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">API Key</label>
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-medium text-slate-300">Model (Optional)</label>
                    {isLoadingModels && <RefreshCw className="w-3.5 h-3.5 text-cyan-500 animate-spin" />}
                  </div>
                  
                  {fetchError && (
                    <div className="text-xs text-red-400 mb-2">{fetchError}</div>
                  )}
                  
                  <select 
                    value={model === '' ? '' : (showCustomInput && model === 'custom' ? 'custom' : (isModelInList ? model : (availableModels.length > 0 ? 'custom' : model)))}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        if (isModelInList) setModel('');
                      } else {
                        setModel(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors mb-2"
                  >
                    <option value="">Default for provider</option>
                    {availableModels.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                    {!isModelInList && model !== '' && model !== 'custom' && availableModels.length === 0 && (
                      <option value={model}>{model}</option>
                    )}
                    <option value="custom">Custom...</option>
                  </select>
                  
                  {(showCustomInput || (model !== '' && !isModelInList && availableModels.length === 0)) && (
                    <input 
                      type="text" 
                      value={model === 'custom' ? '' : model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Enter custom model ID"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors mt-2 border-dashed"
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl font-medium transition-all"
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Saved
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
