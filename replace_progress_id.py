import sys

file_path = "app/api/certificate/complete/route.ts"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

text_to_replace = ".in('lesson_id', lessonIds)"
replacement = ".in('lesson_uuid_id', lessonIds)"

new_content = content.replace(text_to_replace, replacement)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Fixed lessonIds query field")
else:
    print("Could not find text to replace")
