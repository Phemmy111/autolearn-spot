import sys
import re

file_path = "app/api/certificate/complete/route.ts"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'(    console\.log\(\'\[cert/complete\] Eligibility check:\', \{.*?\n    \}\))', re.DOTALL)
replacement = r"""\1

    if (!videoProgressComplete) {
      return NextResponse.json({
        error: 'Not eligible for certificate yet. Complete all lessons.',
        eligibility: { videoProgress: videoProgressComplete }
      }, { status: 400 })
    }
"""

new_content = pattern.sub(replacement, content)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Added eligibility check back")
else:
    print("Could not find text to replace")
