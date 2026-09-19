import os
import re

base_path = "app/api/author/products/[id]/lessons"

count = 0
for root, dirs, files in os.walk(base_path):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Regex to match the exact block we want to remove
            pattern = r'\s*const\s*\{\s*data:\s*product\s*\}\s*=\s*await\s*supabaseAdmin\s*\n\s*\.from\(\'learning_products\'\)\s*\n\s*\.select\(\'author_id\'\)\s*\n\s*\.eq\(\'id\',\s*params\.id\)\s*\n\s*\.maybeSingle\(\)'
            
            # Since we have another `const { data: product } = ...` above it, we want to remove ONLY the second one.
            # But the second one uses `.select('author_id')` exactly, while the first one might use `.select('author_id, status')` or something.
            if re.search(pattern, content):
                content = re.sub(pattern, '', content)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Fixed syntax error in {file_path}")
                count += 1

print(f"Total files fixed: {count}")
