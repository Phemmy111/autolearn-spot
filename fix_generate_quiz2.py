import sys

file_path = "app/api/author/generate-quiz/route.ts"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

text_to_replace = """    let activePrompt
    if (promptId) {
      const { data: prompt } = await supabaseAdmin
        .from('ai_prompts')
        .select('*')
        .eq('id', promptId)
        .eq('author_id', author.id)
        .single()
      activePrompt = prompt
    } else {
      const { data: prompt } = await supabaseAdmin
        .from('ai_prompts')
        .select('*')
        .eq('author_id', author.id)
        .eq('prompt_type', 'quiz_generation')
        .eq('is_active', true)
        .single()
      activePrompt = prompt
    }"""

replacement = """    let activePrompt
    if (promptId) {
      // First try matching author_id
      let { data: prompt } = await supabaseAdmin
        .from('ai_prompts')
        .select('*')
        .eq('id', promptId)
        .eq('author_id', author.id)
        .single()
        
      if (!prompt) {
        // Fallback to global prompt
        const { data: globalPrompt } = await supabaseAdmin
          .from('ai_prompts')
          .select('*')
          .eq('id', promptId)
          .is('author_id', null)
          .single()
        prompt = globalPrompt
      }
      activePrompt = prompt
    } else {
      let { data: prompt } = await supabaseAdmin
        .from('ai_prompts')
        .select('*')
        .eq('author_id', author.id)
        .eq('prompt_type', 'quiz_generation')
        .eq('is_active', true)
        .maybeSingle()
        
      if (!prompt) {
        const { data: globalPrompt } = await supabaseAdmin
          .from('ai_prompts')
          .select('*')
          .is('author_id', null)
          .eq('prompt_type', 'quiz_generation')
          .eq('is_active', true)
          .maybeSingle()
        prompt = globalPrompt
      }
      activePrompt = prompt
    }"""

content = content.replace(text_to_replace, replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated generate-quiz/route.ts with global fallback")
