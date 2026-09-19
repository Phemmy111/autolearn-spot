import sys
import re

file_path = "app/api/certificate/complete/route.ts"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r"const userName = \[user\?\.firstName, user\?\.lastName\]\.filter\(Boolean\)\.join\(' '\) \|\| user\?\.username \|\| 'Student'")
replacement = r"const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || (user?.emailAddresses?.[0]?.emailAddress?.split('@')[0]) || 'Student'"

new_content = pattern.sub(replacement, content)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Fixed complete route userName")
else:
    print("Could not find userName in complete route")
