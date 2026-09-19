import os

file_path = "app/author/page.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """  if (userId) {
    // 1. Fetch Products count
    const { count } = await supabaseAdmin
      .from('learning_products')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', userId);
    productsCount = count || 0;

    // 2. Fetch author's product IDs (needed for students & sales)
    const { data: authorProducts } = await supabaseAdmin
      .from('learning_products')
      .select('id')
      .eq('author_id', userId);"""

replacement = """  if (userId) {
    // Get internal author.id
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .maybeSingle();

    const internalAuthorId = author?.id;

    if (internalAuthorId) {
      // 1. Fetch Products count
      const { count } = await supabaseAdmin
        .from('learning_products')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', internalAuthorId);
      productsCount = count || 0;

      // 2. Fetch author's product IDs (needed for students & sales)
      const { data: authorProducts } = await supabaseAdmin
        .from('learning_products')
        .select('id')
        .eq('author_id', internalAuthorId);"""

if target in content:
    # Replace target
    content = content.replace(target, replacement)
    
    # We opened a new `if (internalAuthorId) {`, so we need to add a closing brace before the end of `if (userId) {` block
    # Let's find the end of `if (userId) {` block. It ends before `  return (`
    end_target = """  return ("""
    end_replacement = """    }
  }

  return ("""
    # Actually wait! The `if (userId)` block currently ends with `  }` before `return`.
    
    # Let's just do a simple replacement of `.eq('author_id', userId)` to `.eq('author_id', internalAuthorId)`
    pass

# Better approach:
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

text_to_find = """  if (userId) {
    // 1. Fetch Products count"""
    
text_to_insert = """  if (userId) {
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .maybeSingle();
      
    if (!author) return null; // or handle empty state better? Wait, we can just use author.id safely if author exists
    
    const internalAuthorId = author.id;
    // 1. Fetch Products count"""

content = content.replace(text_to_find, text_to_insert)
content = content.replace(".eq('author_id', userId);", ".eq('author_id', internalAuthorId);")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Dashboard fixed")
