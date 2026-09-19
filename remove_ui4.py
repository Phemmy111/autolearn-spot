import re

file_path = "app/author/products/[id]/curriculum/page.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The grid containing the Model dropdown:
#               <div className="grid grid-cols-1 gap-4">
#                 <div>
#                   <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
#                     Model
#                   </label>
#                   <div className="flex gap-2">...</div></div>
pattern = r'<div className="grid grid-cols-1 gap-4">\s*<div>\s*<label className="block text-sm font-semibold text-neutral-700 mb-1\.5">\s*Model\s*</label>[\s\S]*?</div>\s*</div>\s*</div>'
content = re.sub(pattern, '', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed Model dropdown")
