-- Run this SQL in your Supabase SQL Editor
-- This will update your provider with the correct encrypted API key

UPDATE alex_provider_config 
SET api_key_encrypted = 'PLACEHOLDER_ENCRYPTED_KEY',
    updated_at = now()
WHERE id = '4887ee8e-3eab-4cbb-ab6c-6912528a1fae';

-- After running this, go to /admin/alex-provider and try "Fetch Models"
