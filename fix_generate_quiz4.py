import sys

file_path = "app/api/author/generate-quiz/route.ts"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(".single()", ".maybeSingle()")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated route.ts to use maybeSingle() everywhere")
