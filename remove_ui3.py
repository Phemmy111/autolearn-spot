import re

file_path = "app/author/products/[id]/curriculum/page.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the grid section that contains AI Provider and AI Model
pattern = r'<div className="grid grid-cols-1 gap-4">[\s\S]*?(?=<div>\s*<label className="block text-sm font-semibold text-neutral-700 mb-1\.5">\s*Lesson Script)'

# Let's just find the actual block
pattern2 = r'<div>\s*<label className="block text-sm font-semibold text-neutral-700 mb-1\.5">\s*AI Provider\s*</label>[\s\S]*?(?=<div>\s*<label className="block text-sm font-semibold text-neutral-700 mb-1\.5">\s*Lesson Script)'
content = re.sub(pattern2, '', content)

# But wait, they might be in a wrapper div. Let's look for `<div className="space-y-4">`
# Let's just remove the specific blocks.
pattern_provider = r'<div>\s*<label className="block text-sm font-semibold text-neutral-700 mb-1\.5">\s*AI Provider\s*</label>[\s\S]*?</div>'
content = re.sub(pattern_provider, '', content)

pattern_model = r'<div>\s*<label className="block text-sm font-semibold text-neutral-700 mb-1\.5">\s*AI Model\s*</label>[\s\S]*?</div>\s*</div>\s*</div>'
content = re.sub(pattern_model, '', content)

# Fix handleAIGenerate
pattern_generate = r'if \(!selectedProviderId\) \{[\s\S]*?if \(!selectedModel\) \{[\s\S]*?return;\s*\}'
content = re.sub(pattern_generate, '', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed AI provider UI")
