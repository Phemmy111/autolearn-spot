import re

file_path = "app/author/settings/page.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern_providers = r'<Link\s+href="/author/ai-providers".*?</Link>'
content = re.sub(pattern_providers, '', content, flags=re.DOTALL)

pattern_prompts = r'<Link\s+href="/author/ai-prompts".*?</Link>'
content = re.sub(pattern_prompts, '', content, flags=re.DOTALL)

# update subtitle
content = content.replace("Manage your AI configuration", "Manage your profile")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Settings page updated")
