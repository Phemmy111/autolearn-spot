import sys

file_path = "app/cart/page.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

text_to_replace = """import { useAuth } from '@clerk/nextjs';"""
replacement = """import { useAuth, useUser } from '@clerk/nextjs';"""
content = content.replace(text_to_replace, replacement)

text_to_replace2 = """  const { isSignedIn } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  
  // Guest checkout state
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');"""

replacement2 = """  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  
  // Guest checkout state
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');

  // Pre-fill name if signed in
  useEffect(() => {
    if (user && !guestName) {
      const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (name) setGuestName(name);
    }
  }, [user]);"""

content = content.replace(text_to_replace2, replacement2)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated cart page with useUser")
