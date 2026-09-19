require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const crypto = require('crypto');

async function testProvider() {
  const providerId = 'e38f5325-bd79-42d0-a891-336f469e05fd';
  const { data, error } = await supabase
    .from('ai_providers')
    .select('*')
    .eq('id', providerId)
    .single();
    
  console.log('Provider fetched:', data?.name);
  console.log('Provider error:', error);
  
  // Try decrypt
  try {
    const textParts = data.api_key_encrypted.split(':')
    const iv = Buffer.from(textParts.shift(), 'hex')
    const authTag = Buffer.from(textParts.shift(), 'hex')
    const encryptedData = Buffer.from(textParts.join(':'), 'hex')
    const decipher = crypto.createDecipheriv('aes-256-gcm', process.env.ENCRYPTION_KEY, iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encryptedData)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    console.log('Decrypted successfully!');
  } catch (e) {
    console.error('Decrypt failed:', e);
  }
}
testProvider();
