import os

file_path = "app/author/page.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """    // 5. Fetch Earnings from author_earnings ledger
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();
      
    if (author) {"""

replacement = """    // 5. Fetch Earnings from author_earnings ledger
    // author is already fetched at the top of the block
    if (author) {"""

content = content.replace(target, replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("author page fixed")
