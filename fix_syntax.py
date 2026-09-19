import sys
import re

file_path = "app/api/certificate/complete/route.ts"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the syntax error by commenting out the closing brace properly
pattern = re.compile(r'(\s*\)\s*\*/\s*\})', re.DOTALL)
new_content = pattern.sub(r'\n      ) \n    } */', content)

# Or better yet, just completely rewrite the file without the broken comments
# Let's write a python script to pull the file, remove the bad block entirely!
