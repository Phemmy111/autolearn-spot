import sys

file_path = "app/author/page.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the userId logic with author.id logic
text_to_replace = """  if (userId) {
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

    if (author) {
      // 1. Fetch Products count
      const { count } = await supabaseAdmin
        .from('learning_products')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', author.id);
      productsCount = count || 0;

      // 2. Fetch author's product IDs (needed for students & sales)
      const { data: authorProducts } = await supabaseAdmin
        .from('learning_products')
        .select('id')
        .eq('author_id', author.id);"""

# Also we need to close the `if (author) {` bracket at the end of the `if (userId)` block.
# Wait, it might be easier to just change `userId` to `author.id` in the queries.
# Let's see if we can just define authorId early on.

text_to_replace2 = """  if (userId) {
    // 1. Fetch Products count"""
    
replacement2 = """  if (userId) {
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .maybeSingle();
      
    const internalAuthorId = author?.id || userId; // fallback in case it's actually storing clerk ID in some rows somehow? No, it's UUID.
    
    // 1. Fetch Products count"""

# We can just inject the fetch and replace userId with internalAuthorId
content = content.replace("if (userId) {", """if (userId) {
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .maybeSingle();
    const internalAuthorId = author?.id;
    
    if (internalAuthorId) {""")

content = content.replace(".eq('author_id', userId)", ".eq('author_id', internalAuthorId)")

# Now we need an extra closing brace.
# Wait, it's safer to just replace precisely.
