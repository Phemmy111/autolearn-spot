const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim()
    }
  })
  console.log('✅ Loaded environment variables from .env.local')
}

// Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.argv[4]
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[5]

// Encryption key
const ENCRYPTION_KEY = process.env.ALEX_PROVIDER_ENCRYPTION_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'set' : 'missing')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'set' : 'missing')
  process.exit(1)
}

if (!ENCRYPTION_KEY) {
  console.error('Missing ALEX_PROVIDER_ENCRYPTION_KEY')
  process.exit(1)
}

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

async function updateProviderApiKey(providerId, apiKey) {
  try {
    const encryptedKey = encrypt(apiKey)
    
    const response = await fetch(`${supabaseUrl}/rest/v1/alex_provider_config?id=eq.${providerId}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ 
        api_key_encrypted: encryptedKey,
        updated_at: new Date().toISOString()
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Database error:', response.status, errorText)
      return false
    }

    console.log('✅ API key encrypted and saved successfully')
    return true
  } catch (error) {
    console.error('Error:', error)
    return false
  }
}

// Get command line arguments
const providerId = process.argv[2]
const apiKey = process.argv[3]
const overrideSupabaseUrl = process.argv[4]
const overrideSupabaseKey = process.argv[5]

if (!providerId || !apiKey) {
  console.log('Usage: node scripts/update-provider-key.js <provider_id> <api_key> [supabase_url] [supabase_key]')
  console.log('Example: node scripts/update-provider-key.js 4887ee8e-3eab-4cbb-ab6c-6912528a1fae gsk_abc123xyz...')
  console.log('Or with Supabase credentials: node scripts/update-provider-key.js 4887ee8e-3eab-4cbb-ab6c-6912528a1fae gsk_abc123xyz... "https://xxx.supabase.co" "your-service-role-key"')
  process.exit(1)
}

updateProviderApiKey(providerId, apiKey)
  .then(success => {
    if (success) {
      console.log('✅ Provider API key updated successfully')
      console.log('Provider ID:', providerId)
      console.log('You can now try fetching models from the admin UI')
    } else {
      console.log('❌ Failed to update provider API key')
    }
    process.exit(success ? 0 : 1)
  })
