import sys

file_path = "app/api/webhooks/paystack/route.ts"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

text_to_replace = """    // 6. Create enrollments for each order item
    
    const firstName = data.customer.first_name;
    const lastName = data.customer.last_name;
    const fullName = [firstName, lastName].filter(Boolean).join(' ');"""

replacement = """    // 6. Create enrollments for each order item
    
    const firstName = data.customer.first_name;
    const lastName = data.customer.last_name;
    const fullName = data.metadata?.full_name || [firstName, lastName].filter(Boolean).join(' ') || data.customer.email.split('@')[0];"""

content = content.replace(text_to_replace, replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated route.ts")
