# AI Provider Manager Guide

## Overview

The AI Provider Manager is a centralized system for managing multiple AI providers (OpenRouter, OpenAI, Gemini, Groq) with secure API key storage and flexible model selection.

## Features

- **Multi-Provider Support**: OpenRouter, OpenAI, Google Gemini, Groq
- **Secure Storage**: API keys encrypted in the database
- **Model Management**: Automatic model fetching from provider APIs
- **Default Provider**: Set a default provider for all AI operations
- **Connection Testing**: Validate API keys before saving
- **AI Playground**: Test prompts and responses in real-time

## Setup

### 1. Database Migration

Run the updated `supabase-schema.sql` to create the `ai_providers` table:

```sql
-- This creates the ai_providers table with encryption support
-- and enables pgcrypto for encryption functions
```

### 2. Environment Variables

Set the encryption key for API key storage (optional but recommended):

```env
AI_PROVIDER_ENCRYPTION_KEY=your-secure-encryption-key-here
```

**Note**: In production, use a strong, randomly generated encryption key.

## Adding AI Providers

### Via Admin Dashboard

1. Navigate to `/admin/ai-providers` (Super Admin only)
2. Click "Add Provider"
3. Fill in the required fields:
   - **Provider Name**: A descriptive name (e.g., "Production OpenRouter")
   - **Provider Type**: Select from OpenRouter, OpenAI, Gemini, or Groq
   - **API Key**: Your API key for the provider
   - **Base URL** (Optional): Custom API endpoint
   - **Default Model** (Optional): Default model for this provider
4. Check "Set as default provider" if this should be the default
5. Click "Add Provider"

### Supported Providers

#### OpenRouter
- **Base URL**: `https://openrouter.ai/api/v1`
- **Models Endpoint**: Automatically fetches available models
- **Example Model**: `anthropic/claude-3.5-sonnet`

#### OpenAI
- **Base URL**: `https://api.openai.com/v1`
- **Models Endpoint**: Automatically fetches available models
- **Example Model**: `gpt-4`

#### Google Gemini
- **Base URL**: `https://generativelanguage.googleapis.com/v1beta`
- **Models Endpoint**: None (uses maintained model list)
- **Example Model**: `gemini-1.5-pro`

#### Groq
- **Base URL**: `https://api.groq.com/openai/v1`
- **Models Endpoint**: Automatically fetches available models
- **Example Model**: `llama3-70b-8192`

## Managing Providers

### Testing Connection

1. Go to `/admin/ai-providers`
2. Click the refresh icon next to a provider
3. The system will test the API connection
4. You'll receive a success or error message

### Fetching Models

1. Go to `/admin/ai-providers`
2. Click the settings icon next to a provider
3. The system will fetch available models from the provider
4. Models are cached in the database for faster access

### Setting Default Provider

1. Go to `/admin/ai-providers`
2. Click the star icon next to a provider
3. This provider becomes the default for all AI operations
4. Only one provider can be default at a time

### Deleting a Provider

1. Go to `/admin/ai-providers`
2. Click the trash icon next to a provider
3. Confirm the deletion
4. The provider and its encrypted API key are permanently removed

## AI Playground

The AI Playground allows you to test prompts and responses in real-time.

### Access

Navigate to `/admin/ai-playground` (Admin access required)

### Usage

1. **Select Provider**: Choose from your configured AI providers
2. **Select Model**: Choose a model from the provider's available models
3. **Enter Prompt**: Type your prompt in the text area
4. **Generate Response**: Click "Generate Response"
5. **View Output**: The AI response appears in the output panel
6. **Copy Response**: Use the copy button to copy the response

### Refreshing Models

If a provider's models are outdated, click "Refresh Models" to fetch the latest list.

## Using the Provider Manager in Code

### Basic Usage

```typescript
import { AIProviderManager } from '@/lib/ai-provider'

// Get the default provider
const provider = await AIProviderManager.getDefaultProvider()

// Generate a completion
const result = await AIProviderManager.completion('Your prompt here')

if (result.success) {
  console.log(result.content)
} else {
  console.error(result.error)
}
```

### With Specific Provider

```typescript
const result = await AIProviderManager.completion('Your prompt here', {
  providerId: 'provider-uuid-here',
  model: 'anthropic/claude-3.5-sonnet',
  temperature: 0.7,
  maxTokens: 4000,
})
```

### Quiz Generation

The quiz generation API now uses the Provider Manager:

```typescript
const response = await fetch('/api/admin/generate-quiz', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    script: lessonScript,
    weekNumber: 1,
    phase: 'WEEK_1',
    providerId: 'provider-uuid', // Optional, uses default if not provided
    model: 'anthropic/claude-3.5-sonnet', // Optional, uses provider default if not provided
  }),
})
```

## Security

### API Key Encryption

- API keys are encrypted using pgcrypto before storage
- Keys are decrypted only in memory when needed
- Encrypted keys are never logged or exposed

### Access Control

- **Super Admin Only**: Adding, editing, deleting providers
- **Admin**: Can use AI features (quiz generation, playground)
- **RLS Policies**: Database-level protection on the `ai_providers` table

### Best Practices

1. **Use Strong Encryption Keys**: Set `AI_PROVIDER_ENCRYPTION_KEY` in production
2. **Rotate API Keys**: Regularly update API keys for security
3. **Limit Access**: Only grant Super Admin access to trusted users
4. **Monitor Usage**: Track AI usage and costs
5. **Test Connections**: Always test new providers before using them

## Troubleshooting

### Provider Connection Failed

1. **Verify API Key**: Ensure the API key is correct and active
2. **Check Base URL**: Verify the custom base URL (if used)
3. **Test Connection**: Use the test connection feature
4. **Check Provider Status**: Verify the provider's service is operational

### Models Not Fetching

1. **Provider Without Models Endpoint**: Some providers (like Gemini) don't have public models endpoints
2. **API Key Permissions**: Ensure the API key has permissions to list models
3. **Rate Limiting**: Wait if you've hit rate limits
4. **Manual Entry**: You can manually specify a model name

### Quiz Generation Fails

1. **Check Default Provider**: Ensure a default provider is set
2. **Verify Model**: Check the default model exists for the provider
3. **Test in Playground**: Try the same prompt in the AI Playground
4. **Check Logs**: Review server logs for detailed error messages

### Encryption Key Issues

1. **Set Encryption Key**: Ensure `AI_PROVIDER_ENCRYPTION_KEY` is set
2. **Key Consistency**: Use the same encryption key across all environments
3. **Re-encrypt Keys**: If changing keys, you may need to re-enter API keys

## Migration from Environment Variables

If you were previously using `OPENROUTER_API_KEY` environment variable:

1. **Add Provider**: Create a new provider in the admin dashboard
2. **Enter API Key**: Use your existing OpenRouter API key
3. **Set as Default**: Mark it as the default provider
4. **Test**: Test the connection in the AI Playground
5. **Remove Old Key**: You can now remove `OPENROUTER_API_KEY` from environment variables

## API Reference

### AIProviderManager Class

#### Methods

- `getDefaultProvider()`: Get the default active provider
- `getActiveProviders()`: Get all active providers
- `getProvider(id)`: Get a specific provider by ID
- `createProvider(config, createdBy)`: Create a new provider
- `updateProvider(id, config)`: Update an existing provider
- `deleteProvider(id)`: Delete a provider
- `setDefaultProvider(id)`: Set a provider as default
- `testProvider(id)`: Test provider connection
- `fetchModels(id)`: Fetch models from a provider
- `getProviderModels(id)`: Get cached or fetch models
- `completion(prompt, options)`: Generate AI completion

### API Routes

#### Provider Management

- `GET /api/admin/ai-providers` - List all providers (Super Admin)
- `POST /api/admin/ai-providers` - Create provider (Super Admin)
- `PUT /api/admin/ai-providers/[id]` - Update provider (Super Admin)
- `DELETE /api/admin/ai-providers/[id]` - Delete provider (Super Admin)
- `POST /api/admin/ai-providers/[id]/test` - Test connection (Super Admin)
- `POST /api/admin/ai-providers/[id]/models` - Fetch models (Super Admin)
- `POST /api/admin/ai-providers/[id]/default` - Set as default (Super Admin)

#### AI Operations

- `POST /api/admin/ai-playground/completion` - Generate completion (Admin)
- `POST /api/admin/generate-quiz` - Generate quiz (Admin)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs for detailed error messages
3. Test in the AI Playground to isolate issues
4. Contact your system administrator for access issues
