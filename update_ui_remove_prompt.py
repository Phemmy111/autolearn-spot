import sys

file_path = "app/author/products/[id]/curriculum/page.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove fetchAIPrompts call
content = content.replace("fetchAIPrompts();", "")

# 2. Remove aiPrompts state
content = content.replace("const [aiPrompts, setAiPrompts] = useState<any[]>([]);", "")
content = content.replace("const [selectedPromptId, setSelectedPromptId] = useState('');", "")

# 3. Remove promptId from payload
payload_old = """            providerId: selectedProviderId,
            model: selectedModel,
            promptId: selectedPromptId,"""
payload_new = """            providerId: selectedProviderId,
            model: selectedModel,"""
content = content.replace(payload_old, payload_new)

# 4. Remove UI dropdown for prompt
dropdown_old = """                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                      AI Prompt
                    </label>
                    <select
                      className="w-full bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                      value={selectedPromptId}
                      onChange={(e) => setSelectedPromptId(e.target.value)}
                    >
                      {aiPrompts.length === 0 ? (
                        <option value="">No prompts</option>
                      ) : (
                        aiPrompts.map((prompt: any) => (
                          <option key={prompt.id} value={prompt.id}>
                            {prompt.name} {prompt.is_active && '(Active)'}
                          </option>
                        ))
                      )}
                    </select>
                  </div>"""

if dropdown_old in content:
    content = content.replace(dropdown_old, "")
else:
    # Use simpler replace if exact match fails
    print("Warning: Could not find exact UI dropdown string to remove, might need manual edit")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated UI to remove prompt selection")
