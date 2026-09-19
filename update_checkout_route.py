import sys

file_path = "app/api/cart/checkout/route.ts"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

text_to_replace = """  // If guest
   if (!userId) {
     const cookieStore = await cookies();
     userId = cookieStore.get('guest_cart_id')?.value || '';
     if (!userId) {
       return NextResponse.json({ error: 'Cart is empty or expired' }, { status: 400 });
     }
     
     email = guestEmail;
     fullName = guestName || 'Guest Student';
   }"""

replacement = """  // Use name from checkout form if provided (even for logged in users)
  if (guestName && guestName.trim().length > 0) {
    fullName = guestName;
  }

  // If guest
  if (!userId) {
    const cookieStore = await cookies();
    userId = cookieStore.get('guest_cart_id')?.value || '';
    if (!userId) {
      return NextResponse.json({ error: 'Cart is empty or expired' }, { status: 400 });
    }
    
    email = guestEmail;
    if (!fullName || fullName === 'Student') {
      fullName = 'Guest Student';
    }
  }"""

content = content.replace(text_to_replace, replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated route.ts")
