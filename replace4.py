import sys

file_path = "app/author/products/[id]/curriculum/page.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

import re

# We want to replace the whole <div> block that contains "YouTube URL".
# Find the start of the div that contains "YouTube URL" and ends after <p>...</p></div>

regex1 = re.compile(r'<div>\s*<label[^>]*>\s*YouTube URL\s*</label>.*?onChange=\{\(e\) => setNewLessonYoutubeUrl\(e\.target\.value\)\}\s*/>\s*<p[^>]*>.*?</p>\s*</div>', re.DOTALL)
regex2 = re.compile(r'<div>\s*<label[^>]*>\s*YouTube URL\s*</label>.*?onChange=\{\(e\) => setEditYoutubeUrl\(e\.target\.value\)\}\s*/>\s*</div>', re.DOTALL)

replacement1 = """<div className="space-y-4">
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

replacement2 = """<div className="space-y-4">
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

new_content = regex1.sub(replacement1, content)
new_content = regex2.sub(replacement2, new_content)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Regex matched and replaced successfully!")
else:
    print("Regex STILL did not match anything :(")
