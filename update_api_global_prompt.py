import sys

file_path = "app/api/author/generate-quiz/route.ts"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the prompt fetching logic
text_to_replace = """    // Get the quiz generation prompt (use specific promptId if provided, otherwise get active for this author)
    let activePrompt
    if (promptId) {
      // First try matching author_id
      let { data: prompt } = await supabaseAdmin
        .from('ai_prompts')
        .select('*')
        .eq('id', promptId)
        .eq('author_id', author.id)
        .maybeSingle()
        
      if (!prompt) {
        // Fallback to global prompt
        const { data: globalPrompt } = await supabaseAdmin
          .from('ai_prompts')
          .select('*')
          .eq('id', promptId)
          .is('author_id', null)
          .maybeSingle()
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

replacement = """    // Get the global quiz generation prompt
    const { data: activePrompt } = await supabaseAdmin
      .from('ai_prompts')
      .select('*')
      .is('author_id', null)
      .eq('prompt_type', 'quiz_generation')
      .eq('is_active', true)
      .maybeSingle()"""

if text_to_replace in content:
    content = content.replace(text_to_replace, replacement)
else:
    print("Could not find prompt fetching logic")
    sys.exit(1)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated API to use global prompt")
