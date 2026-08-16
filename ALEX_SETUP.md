# ALEX AI Provider Configuration

## Required Environment Variables

To enable ALEX with Groq AI, set the following environment variables in your deployment dashboard:

### Groq API Configuration

```bash
ALEX_SELF_HOSTED_ENDPOINT=https://api.groq.com/openai/v1
ALEX_SELF_HOSTED_MODEL=llama-3.3-70b-versatile
ALEX_SELF_HOSTED_API_KEY=your_groq_api_key_here
```

### Getting Your Groq API Key

1. Visit [console.groq.com](https://console.groq.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key and set it as `ALEX_SELF_HOSTED_API_KEY`

### Available Groq Models

- `llama-3.3-70b-versatile` (Recommended) - Balanced performance and quality
- `llama-3.1-8b-instant` - Faster responses, smaller model
- `openai/gpt-oss-120b` - High quality OpenAI model
- `openai/gpt-oss-20b` - Fast, good quality OpenAI model

### Alternative Providers

The SelfHostedProvider is OpenAI-compatible, so you can also use:

- **Together AI**: `https://api.together.xyz/v1`
- **OpenRouter**: `https://openrouter.ai/api/v1`
- **Custom OpenAI-compatible endpoints**

Simply change `ALEX_SELF_HOSTED_ENDPOINT` and `ALEX_SELF_HOSTED_MODEL` accordingly.

## Streaming Support

ALEX supports Server-Sent Events (SSE) streaming for real-time responses. The Groq API fully supports streaming, providing an excellent chat experience.

## Configuration Verification

The ALEX provider will log initialization status:
- ✅ Provider initialized successfully
- ⚠️ Missing required environment variables
- ❌ Provider health check failed

Check your application logs for provider status.
