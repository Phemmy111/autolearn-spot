import sys

file_path = "app/author/products/[id]/curriculum/page.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_content = content.replace("lessons/${editingLesson.id}", "lessons/${editingLesson.uuid_id}")

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Replaced editingLesson.id successfully")
else:
    print("Failed to replace!")
