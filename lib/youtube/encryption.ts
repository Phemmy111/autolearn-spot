import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// Re-use the existing ALEX key or require a new one
const ENCRYPTION_KEY = process.env.ALEX_PROVIDER_ENCRYPTION_KEY;

export function encryptToken(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured (ALEX_PROVIDER_ENCRYPTION_KEY)');
  }
  
  const key = Buffer.from(ENCRYPTION_KEY, 'base64');
  if (key.length !== 32) {
    throw new Error('Encryption key must be 32 bytes');
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encryptedText
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptToken(encryptedData: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured');
  }

  const key = Buffer.from(ENCRYPTION_KEY, 'base64');
  const parts = encryptedData.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
