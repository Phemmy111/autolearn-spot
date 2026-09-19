import re

file_path = "app/author/products/[id]/curriculum/page.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("promptId: selectedPromptId,", "")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed selectedPromptId reference")
