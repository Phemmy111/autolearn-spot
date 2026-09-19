import os
import re

file_path = "app/author/products/[id]/curriculum/page.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove state variables
content = re.sub(r'const \[aiProviders, setAiProviders\] = useState<any\[\]>\(\[\]\);\s*', '', content)
content = re.sub(r'const \[selectedProviderId, setSelectedProviderId\] = useState\(\'\'\);\s*', '', content)
content = re.sub(r'const \[selectedModel, setSelectedModel\] = useState\(\'\'\);\s*', '', content)
content = re.sub(r'const \[fetchingModels, setFetchingModels\] = useState\(false\);\s*', '', content)

# Remove fetchAIProviders call from useEffect
content = content.replace("fetchAIProviders();", "")

# Remove fetchAIProviders function
content = re.sub(r'const fetchAIProviders = async \(\) => \{.*?\};\n', '', content, flags=re.DOTALL)

# Remove handleFetchModels function
content = re.sub(r'const handleFetchModels = async \(\) => \{.*?\};\n', '', content, flags=re.DOTALL)

# Remove the whole AI Providers warning div
content = re.sub(r'\{aiProviders\.length === 0 && \([\s\S]*?</div>\s*\)', '', content)

# Remove the AI Provider & AI Model dropdowns grid entirely.
# It starts with `<div className="grid grid-cols-1 gap-4">` and ends before `<div>\s*<label.*?Lesson Script`
pattern = r'<div className="grid grid-cols-1 gap-4">[\s\S]*?(?=<div>\s*<label className="block text-sm font-semibold text-neutral-700 mb-1\.5">\s*Lesson Script)'
content = re.sub(pattern, '', content)

# Update disabled condition on Generate Quiz button
content = content.replace("disabled={aiGenerating || !aiScript.trim() || aiProviders.length === 0}", "disabled={aiGenerating || !aiScript.trim()}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed aiProviders logic from curriculum page")
