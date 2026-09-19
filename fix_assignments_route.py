import re

file_path = "app/api/author/assignments/route.ts"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """    // Get all assignments for the author's lessons
    const { data: assignments, error } = await supabaseAdmin
      .from('assignments')
      .select(`
        *,
        lesson:lessons!inner (
          uuid_id,
          title,
          product:learning_products!inner (
            id,
            title,
            author_id
          )
        )
      `)
      .eq('lesson.product.author_id', userId)
      .order('created_at', { ascending: false })"""

replacement = """    // Get internal author_id from clerk userId
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 403 })
    }

    // Get all assignments for the author's lessons
    const { data: assignments, error } = await supabaseAdmin
      .from('assignments')
      .select(`
        *,
        lesson:lessons!inner (
          uuid_id,
          title,
          product:learning_products!inner (
            id,
            title,
            author_id
          )
        )
      `)
      .eq('lesson.product.author_id', author.id)
      .order('created_at', { ascending: false })"""

content = content.replace(target, replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated assignments route to use internal author.id")
