import re

file_path = "app/api/author/generate-quiz/route.ts"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """export const dynamic = 'force-dynamic'"""

replacement = """export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for AI generation"""

content = content.replace(target, replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added maxDuration")
