import sys
import re

file_path = "app/api/certificate/complete/route.ts"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# I will find the floating `}` and just comment it out.
# Let's look exactly at the text.
text_to_replace = """      ) */
    }"""
replacement = """      ) 
    } */"""

new_content = content.replace(text_to_replace, replacement)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Fixed syntax error!")
else:
    print("Could not find the exact text.")
