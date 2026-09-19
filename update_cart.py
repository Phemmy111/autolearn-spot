import sys

file_path = "app/cart/page.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

text_to_replace = """              {!isSignedIn && (
                <div className="space-y-4 mb-6 pt-6 border-t border-border/50 text-left">
                  <p className="text-sm text-muted-foreground">Checking out as a guest. We'll automatically create an account for you.</p>
                  <div>
                    <label className="block text-xs font-semibold text-foreground uppercase mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Enter your full name" 
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground uppercase mb-1">Email Address <span className="text-destructive">*</span></label>
                    <input 
                      type="email" 
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="Enter your email" 
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-primary"
                      required
                    />
                  </div>
                </div>
              )}"""

replacement = """              <div className="space-y-4 mb-6 pt-6 border-t border-border/50 text-left">
                {!isSignedIn && (
                  <p className="text-sm text-muted-foreground">Checking out as a guest. We'll automatically create an account for you.</p>
                )}
                {isSignedIn && (
                  <p className="text-sm text-muted-foreground">Please confirm your name for your certificate.</p>
                )}
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase mb-1">Full Name <span className="text-destructive">*</span></label>
                  <input 
                    type="text" 
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g., Chioma Adeleke" 
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-primary"
                    required
                  />
                </div>
                {!isSignedIn && (
                  <div>
                    <label className="block text-xs font-semibold text-foreground uppercase mb-1">Email Address <span className="text-destructive">*</span></label>
                    <input 
                      type="email" 
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="Enter your email" 
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-primary"
                      required
                    />
                  </div>
                )}
              </div>"""

content = content.replace(text_to_replace, replacement)

# We also need to update the checkout function to pass the name even if signed in
text_to_replace2 = """      const res = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          !isSignedIn ? { email: guestEmail, fullName: guestName } : {}
        )
      });"""

replacement2 = """      if (!guestName || guestName.trim().length < 2) {
        toast.error('Please enter your full name for the certificate.');
        setCheckingOut(false);
        return;
      }
      
      const res = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: guestName,
          ...(!isSignedIn ? { email: guestEmail } : {})
        })
      });"""

content = content.replace(text_to_replace2, replacement2)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated cart page")
