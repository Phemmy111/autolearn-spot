import re

file_path = "app/api/author/generate-quiz/route.ts"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """    const chatResult = await AIEngine.processChat({
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

replacement = """    const providerManager = AIEngine.getProviderManager()
    let fullContent = ''
    
    for await (const chunk of providerManager.executeStreamingWithFallback({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-4o', // fallback will auto-select if this fails
      temperature: 0.7,
      maxTokens: 4000,
      stream: true,
      disableTools: true
    })) {
      if (chunk.type === 'delta') {
        fullContent += chunk.data?.content || chunk.data?.text || ''
      } else if (chunk.type === 'error') {
        throw new Error(chunk.data?.error || 'Streaming error')
      }
    }

    const result = {
      success: true,
      content: fullContent,
      error: null
    }"""

content = content.replace(target, replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated generate-quiz to use streaming fallback")
