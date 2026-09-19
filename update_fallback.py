import sys

file_path = "app/api/certificate/download/route.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

text_to_replace = """    let userName =
      user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.username || 'Student'
    let targetUserId = userId"""

replacement = """    let fallbackName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || '';
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    
    // Fallback to enrollment table if name is missing
    if (!fallbackName || fallbackName === 'Student' || fallbackName === userEmail?.split('@')[0]) {
      if (userEmail) {
        const { data: enrollment } = await supabaseAdmin
          .from('enrollments')
          .select('full_name')
          .eq('email', userEmail)
          .order('enrolled_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (enrollment?.full_name) {
          fallbackName = enrollment.full_name;
        }
      }
    }
    
    let userName = fallbackName || (userEmail?.split('@')[0]) || 'Student'
    let targetUserId = userId"""

new_content = content.replace(text_to_replace, replacement)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated download route")
else:
    print("Could not find text to replace")
