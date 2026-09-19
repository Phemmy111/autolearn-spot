import sys
import re

file_path = "app/author/products/[id]/curriculum/page.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the AI Prompt dropdown wrapper div using regex
pattern = r'<div>\s*<label[^>]*>\s*AI Prompt\s*</label>\s*<select[^>]*>.*?</select>\s*</div>'
content = re.sub(pattern, '', content, flags=re.DOTALL)

# Also fix the grid layout
content = content.replace('<div className="grid grid-cols-2 gap-4">', '<div className="grid grid-cols-1 gap-4">')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Regex replace done")
