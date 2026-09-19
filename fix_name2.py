import sys
import re

file_path = "app/api/certificate/download/route.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r"const userName = userNameParam \|\| \[user\?\.firstName, user\?\.lastName\]\.filter\(Boolean\)\.join\(' '\) \|\| user\?\.username \|\| certificateRecord\?\.user_name \|\| 'Student'")
replacement = r"const userName = userNameParam || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || certificateRecord?.user_name || (user?.emailAddresses?.[0]?.emailAddress?.split('@')[0]) || 'Student'"

new_content = pattern.sub(replacement, content)

# Let's also remove the hardcoded cName ternary entirely and rely entirely on lpTitle or cName
pattern2 = re.compile(r"const dbCourseTitle = lpTitle \|\| \(cName === 'Cohort 1' \? 'AI Automation with n8n' : cName === 'Cohort 2' \? 'AI Video Content Creation' : cName\);")
replacement2 = r"const dbCourseTitle = lpTitle || cName || 'AI Automation Training';"
new_content = pattern2.sub(replacement2, new_content)


if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Fixed download route")
else:
    print("Could not find targets in download route")
