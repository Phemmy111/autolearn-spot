import os
import re

file_path = "app/author/products/[id]/curriculum/page.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove fetchAIPrompts definition
pattern_fetch_prompts = r'const fetchAIPrompts = async \(\) => \{.*?\};\n'
content = re.sub(pattern_fetch_prompts, '', content, flags=re.DOTALL)

# Remove the AI prompts warning
pattern_warning = r'\{aiPrompts\.length === 0 && \(.*?\)\}'
content = re.sub(pattern_warning, '', content, flags=re.DOTALL)

# Also the user wants to remove AI Provider and AI Model selections from the UI
# We need to remove the whole grid section for Provider and Model
pattern_provider_model_ui = r'<div className="grid grid-cols-1 gap-4">.*?<label.*?AI Model.*?</select>\s*</div>\s*</div>'
content = re.sub(pattern_provider_model_ui, '', content, flags=re.DOTALL)

# We should also remove provider/model state if possible, or just leave it since they won't be used
# Let's remove the whole configuration section in the UI entirely
# Wait, let's just make it simple. The user only needs the script text area now.

# Also, update the payload to not require providerId and model for generation
content = content.replace("providerId: selectedProviderId,", "")
content = content.replace("model: selectedModel,", "")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Curriculum UI fixed")
