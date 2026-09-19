import sys

file_path = "lib/certificate-layout.ts"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("'GreatVibes'", "'Playfair Display'")
content = content.replace("fontFamily: 'GreatVibes'", "fontFamily: 'Playfair Display'")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated certificate-layout.ts")
