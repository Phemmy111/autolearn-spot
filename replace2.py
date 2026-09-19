import sys
file_path = "app/author/products/[id]/curriculum/page.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

import re

target1_match = re.search(r'<label[^>]*>\s*YouTube URL\s*</label>\s*<input[^>]*value=\{newLessonYoutubeUrl\}[^>]*/>\s*<p[^>]*>.*?</p>', content, flags=re.DOTALL)
if target1_match:
    print("Regex 1 matched!")
else:
    print("Regex 1 did not match!")

