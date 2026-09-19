import os

base_path = "app/api/author/products/[id]/lessons"

# we need to remove the duplicate `const { data: product } = await supabaseAdmin` block that we injected
bad_block = """    const { data: product } = await supabaseAdmin
      .from('learning_products')
      .select('author_id')
      .eq('id', params.id)
      .maybeSingle()"""

count = 0
for root, dirs, files in os.walk(base_path):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            if bad_block in content:
                content = content.replace(bad_block, "")
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Fixed syntax error in {file_path}")
                count += 1

print(f"Total files fixed: {count}")
