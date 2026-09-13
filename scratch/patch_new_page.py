import re

file_path = 'C:/Users/ACER/Desktop/autolearn-spot/app/author/products/new/page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add States
content = content.replace(
    "const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);",
    "const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);\n  const [mediaGallery, setMediaGallery] = useState<string[]>([]);\n  const [mediaFiles, setMediaFiles] = useState<File[]>([]);"
)

# 4. Save and Upload media files
auto_save_patch = '''    let uploadedThumbnailUrl = null;
    if (thumbnailFile) {
      try {
        uploadedThumbnailUrl = await uploadThumbnail(thumbnailFile);
      } catch (err) {
        console.error('Thumbnail upload failed', err);
      }
    }
    
    let uploadedMediaGallery = [];
    if (mediaFiles.length > 0) {
      try {
        const newUrls = await Promise.all(mediaFiles.map(file => uploadThumbnail(file)));
        uploadedMediaGallery = newUrls.filter(Boolean) as string[];
      } catch (e) {
        console.error('Failed to upload additional media');
      }
    }'''

content = content.replace(
    "    let uploadedThumbnailUrl = null;\n    if (thumbnailFile) {\n      try {\n        uploadedThumbnailUrl = await uploadThumbnail(thumbnailFile);\n      } catch (err) {\n        console.error('Thumbnail upload failed', err);\n      }\n    }",
    auto_save_patch
)

# 5. structuredDescription payload
desc_patch = '''    const structuredDescription = JSON.stringify({
      short_description: shortDesc,
      full_description: fullDesc,
      category,
      difficulty,
      learning_outcomes: learningOutcomes,
      requirements,
      target_audience: targetAudience,
      media_gallery: uploadedMediaGallery
    });'''

content = re.sub(r'const structuredDescription = JSON\.stringify\(\{.*?\target_audience: targetAudience\n    \}\);', desc_patch, content, flags=re.DOTALL)

# 6. Handlers
handlers = '''  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnailFile(e.target.files[0]);
      setThumbnailPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setMediaFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };'''

content = content.replace(
    "  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {\n    if (e.target.files && e.target.files[0]) {\n      setThumbnailFile(e.target.files[0]);\n      setThumbnailPreview(URL.createObjectURL(e.target.files[0]));\n    }\n  };",
    handlers
)

# 7. UI update
ui_patch = '''            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Additional Media Gallery (Images & Short Videos)</label>
            <div className="p-6 border-2 border-dashed border-brand-border rounded-xl bg-brand-bg">
              <div className="flex flex-wrap gap-4 mb-4">
                {mediaFiles.map((file, idx) => (
                  <div key={ile-} className="relative w-24 h-24 rounded-lg overflow-hidden border border-brand-border bg-neutral-200 flex items-center justify-center opacity-70 group">
                    <span className="text-[10px] text-center px-1 break-all text-neutral-600">{file.name}</span>
                    <button type="button" onClick={() => removeMediaFile(idx)} className="absolute top-1 right-1 bg-red-100 text-red-600 rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">?</button>
                  </div>
                ))}
              </div>
              <input type="file" id="additional-media" multiple accept="image/png, image/jpeg, image/webp, video/mp4, video/webm" className="hidden" onChange={handleMediaChange} />
              <label htmlFor="additional-media" className="cursor-pointer inline-flex px-4 py-2 bg-[var(--card)] border border-brand-border text-neutral-700 text-sm font-semibold rounded-lg hover:bg-brand-bg transition-colors shadow-sm">
                + Add Media
              </label>
            </div>
          </div>
        </div>

        {/* ACTIONS */}'''

content = content.replace(
    "            </div>\n          </div>\n        </div>\n\n        {/* ACTIONS */}",
    ui_patch
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Patch applied successfully to new page')
