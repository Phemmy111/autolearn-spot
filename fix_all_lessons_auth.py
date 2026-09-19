import os
import glob
import re

base_path = "app/api/author/products/[id]/lessons/"

# Find all route.ts files recursively under lessons
files = glob.glob(base_path + "**/*.ts", recursive=True)

replacement_pattern = """    // Get internal author_id from clerk userId
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    if (!author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 403 })
    }

    if (!product || product.author_id !== author.id) {"""

count = 0
for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if "product.author_id !== userId" in content:
        # We also need to change .single() to .maybeSingle() for the learning_products query to prevent 500 error
        # So let's do a targeted replace
        
        # Replace the product fetch .single() with .maybeSingle()
        content = re.sub(r'(\.from\(\'learning_products\'\)\s*\n\s*\.select\([^\)]+\)\s*\n\s*\.eq\([^\)]+\)\s*\n\s*)\.single\(\)', r'\1.maybeSingle()', content)
        
        # Replace the auth check
        content = content.replace("if (!product || product.author_id !== userId) {", replacement_pattern)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {file_path}")
        count += 1

print(f"Total files fixed: {count}")
