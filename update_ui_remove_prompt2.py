import sys

file_path = "app/author/products/[id]/curriculum/page.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

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
                            {prompt.name} (v{prompt.version}) {prompt.is_active && '(Active)'}
                          </option>
                        ))
                      )}
                    </select>
                  </div>"""

if dropdown_old in content:
    content = content.replace(dropdown_old, "")
    print("Dropdown removed")
else:
    print("Could not find dropdown")

warning_old = """            {aiPrompts.length === 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      You haven't configured any AI prompts for quiz generation. The system will use a global default prompt, which might not be optimized for your content.
                    </p>
                  </div>
                </div>
              </div>
            )}"""

if warning_old in content:
    content = content.replace(warning_old, "")
    print("Warning removed")

warning2_old = """            {aiPrompts.length === 0 && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="text-yellow-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-sm text-yellow-800">
                    No quiz generation prompts configured.{' '}
                    <a href="/author/ai-prompts" className="underline hover:text-yellow-900">
                      Configure AI prompts ?
                    </a>
                  </p>
                </div>
              </div>
            )}"""

if warning2_old in content:
    content = content.replace(warning2_old, "")
    print("Warning 2 removed")
    
# Remove grid-cols-2 class from the div containing the model select so it takes full width
grid_old = """                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                      AI Model"""
grid_new = """                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                      AI Model"""
if grid_old in content:
    content = content.replace(grid_old, grid_new)
    print("Grid layout updated")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
