import sys

file_path = "app/author/products/[id]/curriculum/page.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target1 = """              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  YouTube URL
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg 
focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                  value={newLessonYoutubeUrl}
                  onChange={(e) => setNewLessonYoutubeUrl(e.target.value)}
                />
                <p className="text-xs text-brand-text/60 mt-1.5">YouTube video will be automatically embedded</p>
              </div>"""

replacement1 = """              <div className="space-y-4">
                <label className="block text-sm font-semibold text-neutral-700">
                  Video Content
                </label>
                
                <YouTubeResumableUploader 
                  onSuccess={(videoId, url) => setNewLessonYoutubeUrl(url)}
                  onError={(err) => setError(err)}
                />
                
                <div className="flex items-center gap-4 py-2">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <span className="text-xs text-gray-400 font-semibold uppercase">OR Paste Link</span>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>

                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                  value={newLessonYoutubeUrl}
                  onChange={(e) => setNewLessonYoutubeUrl(e.target.value)}
                />
                <p className="text-xs text-brand-text/60 mt-1.5">YouTube video will be automatically embedded</p>
              </div>"""

target2 = """                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                    YouTube URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg 
focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                    value={editYoutubeUrl}
                    onChange={(e) => setEditYoutubeUrl(e.target.value)}
                  />
                </div>"""

replacement2 = """                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-neutral-700">
                    Video Content
                  </label>
                  
                  <YouTubeResumableUploader 
                    onSuccess={(videoId, url) => setEditYoutubeUrl(url)}
                    onError={(err) => setError(err)}
                  />
                  
                  <div className="flex items-center gap-4 py-2">
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="text-xs text-gray-400 font-semibold uppercase">OR Paste Link</span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                  </div>

                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-brand-bg border border-brand-border text-brand-text text-sm rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 block p-3 transition-colors shadow-sm"
                    value={editYoutubeUrl}
                    onChange={(e) => setEditYoutubeUrl(e.target.value)}
                  />
                </div>"""

# Handle potential newline differences
import re
def normalize(text):
    return re.sub(r'\s+', ' ', text)

content_norm = normalize(content)
target1_norm = normalize(target1)
target2_norm = normalize(target2)

if target1_norm in content_norm:
    print("Found target1")
else:
    print("Could NOT find target1!")

if target2_norm in content_norm:
    print("Found target2")
else:
    print("Could NOT find target2!")

# Actually, a regex replacement is safer to ignore whitespace
import re
content = re.sub(r'<div>\s*<label[^>]*>\s*YouTube URL\s*</label>\s*<input[^>]*value=\{newLessonYoutubeUrl\}[^>]*/>\s*<p[^>]*>.*?</p>\s*</div>', replacement1, content, flags=re.DOTALL)
content = re.sub(r'<div>\s*<label[^>]*>\s*YouTube URL\s*</label>\s*<input[^>]*value=\{editYoutubeUrl\}[^>]*/>\s*</div>', replacement2, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
