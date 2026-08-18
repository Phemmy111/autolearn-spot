import crypto from 'crypto'

// Generate a secure 32-byte encryption key (base64 encoded)
const key = crypto.randomBytes(32).toString('base64')
console.log('Generated encryption key (base64):', key)
console.log('Copy this to your .env file as ALEX_PROVIDER_ENCRYPTION_KEY')
