import re

file_path = "app/author/products/[id]/curriculum/page.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """            <h3 className="text-lg font-bold text-brand-text mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Quiz Generator
            </h3>
            
            }"""
            
replacement = """            <h3 className="text-lg font-bold text-brand-text mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Quiz Generator
            </h3>"""

content = content.replace(target, replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed trailing brace")
