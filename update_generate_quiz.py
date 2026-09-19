import os
import re

file_path = "app/api/author/generate-quiz/route.ts"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
content = content.replace("import { AIProviderManager } from '@/lib/ai-provider'", "import { AIEngine } from '@/lib/alex/ai-engine'")

# 2. Update destructuring from request to remove providerId and model
text_destructure = "const { script, lessonId, questionCount, providerId, model, promptId } = await request.json()"
replacement_destructure = "const { script, lessonId, questionCount } = await request.json()"
content = content.replace(text_destructure, replacement_destructure)

# 3. Update AI call
ai_call_pattern = r'const result = await AIProviderManager\.completion\(prompt, \{\s*providerId,\s*model,\s*temperature: 0\.7,\s*maxTokens: 4000,\s*\}\)'
ai_call_replacement = """const chatResult = await AIEngine.processChat({
      content: prompt,
      mode: 'chat',
      conversationHistory: [],
      userId
    })

    const result = {
      success: true,
      content: chatResult.orchestratorResponse.response,
      error: null
    }"""
content = re.sub(ai_call_pattern, ai_call_replacement, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("generate-quiz route updated to use Alex AI models")
