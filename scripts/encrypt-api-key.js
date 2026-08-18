const crypto = require('crypto')

const ENCRYPTION_KEY = 'lQrULS/H9ZsJmrxz8sl6wG/DFTYtE4baAvxw5QnkAj4='
const API_KEY = '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'

function encrypt(text) {
  try {
    const key = Buffer.from(ENCRYPTION_KEY, 'base64')
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ])

    return combined.toString('base64')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt')
  }
}

const encryptedKey = encrypt(API_KEY)
console.log('Encrypted API Key (copy this to Supabase):')
console.log(encryptedKey)
console.log('\nRun this SQL in Supabase SQL Editor:')
console.log(`UPDATE alex_provider_config SET api_key_encrypted = '${encryptedKey}', updated_at = now() WHERE id = '4887ee8e-3eab-4cbb-ab6c-6912528a1fae';`)
