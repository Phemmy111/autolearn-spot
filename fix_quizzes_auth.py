import sys

file_path = "app/api/author/products/[id]/lessons/[lessonId]/quizzes/route.ts"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the incorrect authorization logic
text_to_replace = """    const { data: product } = await supabaseAdmin
      .from('learning_products')
      .select('author_id')
      .eq('id', params.id)
      .single()

    if (!product || product.author_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }"""

replacement = """    // Get internal author_id from clerk userId
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    if (!author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 403 })
    }

    const { data: product } = await supabaseAdmin
      .from('learning_products')
      .select('author_id')
      .eq('id', params.id)
      .maybeSingle()

    if (!product || product.author_id !== author.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }"""

if text_to_replace in content:
    content = content.replace(text_to_replace, replacement)
    print("Replaced authorization logic successfully")
else:
    print("Could not find the exact authorization logic to replace")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
