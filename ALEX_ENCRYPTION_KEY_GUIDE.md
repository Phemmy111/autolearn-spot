# Generate a secure 32-byte encryption key for ALEX Provider Manager
# This key will be used to encrypt/decrypt API keys in the database

# Option 1: Generate with Node.js (recommended)
# Run: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 2: Generate with Python
# Run: python -c "import secrets, base64; print(base64.b64encode(secrets.token_bytes(32)).decode())"

# Option 3: Generate with OpenSSL
# Run: openssl rand -base64 32

# Copy the generated key below:
ALEX_PROVIDER_ENCRYPTION_KEY=YOUR_GENERATED_KEY_HERE
