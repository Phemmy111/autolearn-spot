import sys
import re

file_path = "app/api/certificate/complete/route.ts"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'    // Normalize JSONB string \??" trim and compare as strings.*?    if \(configuredFinalLessonId && configuredFinalLessonId !== submittedLessonId\) \{.*?      \)', re.DOTALL)
# wait, there's a return NextResponse...
# let's just comment out the whole block
pattern = re.compile(r'(\s*// Normalize JSONB string.*?status: 400 \}\s*\))', re.DOTALL)
new_content = pattern.sub(r'/* \1 */', content)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Removed finalLessonId check")
else:
    print("Could not find finalLessonId check")
