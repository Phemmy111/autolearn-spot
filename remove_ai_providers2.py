import re

file_path = "app/author/products/[id]/curriculum/page.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove state variables
content = re.sub(r'const \[aiProviders, setAiProviders\] = useState<any\[\]>\(\[\]\);\s*', '', content)
content = re.sub(r'const \[selectedProviderId, setSelectedProviderId\] = useState\(\'\'\);\s*', '', content)
content = re.sub(r'const \[selectedModel, setSelectedModel\] = useState\(\'\'\);\s*', '', content)
content = re.sub(r'const \[fetchingModels, setFetchingModels\] = useState\(false\);\s*', '', content)

# Remove fetchAIProviders call from useEffect
content = content.replace("fetchAIProviders();", "")

# Remove fetchAIProviders function
content = re.sub(r'const fetchAIProviders = async \(\) => \{.*?\};\n', '', content, flags=re.DOTALL)

# Remove handleFetchModels function
content = re.sub(r'const handleFetchModels = async \(\) => \{.*?\};\n', '', content, flags=re.DOTALL)

# Remove the whole AI Providers warning div
content = re.sub(r'\{aiProviders\.length === 0 && \([\s\S]*?</div>\s*\)', '', content)

# Look for the grid inside the AI Quiz Generator Modal
target_grid = """            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  AI Provider
                </label>
                <select
                  className="w-full bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                  value={selectedProviderId}
                  onChange={(e) => {
                    setSelectedProviderId(e.target.value);
                    const provider = aiProviders.find((p: any) => p.id === e.target.value);
                    setSelectedModel(provider?.default_model || '');
                  }}
                >
                  {aiProviders.length === 0 ? (
                    <option value="">No providers</option>
                  ) : (
                    aiProviders.map((provider: any) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name} {provider.is_default && '(Default)'}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  AI Model
                </label>
                <div className="flex gap-2">
                  <select
                    className="w-full bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    {selectedProviderId ? (
                      (() => {
                        const provider = aiProviders.find((p: any) => p.id === selectedProviderId);
                        const models = provider?.models || [];
                        if (models.length === 0) {
                          return <option value="">No models</option>;
                        }
                        return models.map((m: string) => (
                          <option key={m} value={m}>{m}</option>
                        ));
                      })()
                    ) : (
                      <option value="">Select provider first</option>
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={handleFetchModels}
                    disabled={fetchingModels || !selectedProviderId}
                    className="px-3 py-2 bg-purple-100 text-purple-700 text-sm font-semibold rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Fetch available models"
                  >
                    <Bot className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>"""

if target_grid in content:
    content = content.replace(target_grid, "")

# Update disabled condition on Generate Quiz button
content = content.replace("disabled={aiGenerating || !aiScript.trim() || aiProviders.length === 0}", "disabled={aiGenerating || !aiScript.trim()}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed aiProviders logic properly")
