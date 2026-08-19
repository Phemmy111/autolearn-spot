/**
 * ALEX Provider Manager Types
 * 
 * Types for multi-provider management, health monitoring, and fallback
 */

export type ProviderType = 'self_hosted' | 'groq' | 'openrouter' | 'gemini' | 'openai_compatible' | 'openai'

export type HealthStatus = 'healthy' | 'degraded' | 'unavailable' | 'unknown'

export type AuthType = 'bearer' | 'none' | 'api_key' | 'custom'

export interface ProviderConfig {
  id: string
  providerName: string
  displayName: string
  providerType: ProviderType
  apiKeyEncrypted: string
  baseUrl?: string
  currentModel: string
  models?: Record<string, any>
  costControls?: Record<string, any>
  isActive: boolean
  priority: number
  healthStatus: HealthStatus
  lastHealthCheck?: string
  latencyMs?: number
  healthError?: string
  fallbackEnabled: boolean
  capabilities: string[]
  requestTimeout: number
  modelListMetadata: Record<string, any>
  lastSuccessAt?: string
  failureCount: number
  consecutiveFailureCount: number
  authType: AuthType
  createdAt: string
  updatedAt: string
}

export interface ProviderHealthCheck {
  providerId: string
  healthy: boolean
  model?: string
  latency: number
  streaming: boolean
  capabilities: string[]
  error?: string
  timestamp: string
}

export interface ProviderTestResult {
  success: boolean
  providerId: string
  providerName: string
  model: string
  latency: number
  streaming: boolean
  capabilities: string[]
  error?: string
}

export interface ModelInfo {
  id: string
  name: string
  contextWindow?: number
  maxTokens?: number
  description?: string
}

export interface FallbackAttempt {
  providerId: string
  providerName: string
  success: boolean
  error?: string
  latency: number
}

export interface ProviderRequestResult {
  success: boolean
  providerId: string
  providerName: string
  model: string
  latency: number
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  estimatedCost?: number
  fallbackOccurred: boolean
  fallbackAttempts: FallbackAttempt[]
}

export type RetryableErrorType = 'timeout' | 'connection' | 'rate_limit' | 'provider_unavailable' | 'server_error'

export type NonRetryableErrorType = 'invalid_request' | 'invalid_credentials' | 'invalid_model' | 'malformed_request' | 'auth_error'

export interface ProviderError {
  type: RetryableErrorType | NonRetryableErrorType
  message: string
  statusCode?: number
  retryable: boolean
}

export function isRetryableError(error: ProviderError): boolean {
  return error.retryable
}

export function classifyError(error: any, statusCode?: number): ProviderError {
  // Extract status code from error message if not provided
  if (!statusCode && error.message) {
    const match = error.message.match(/(\d{3})/)
    if (match) {
      statusCode = parseInt(match[1], 10)
    }
  }

  // Connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return { type: 'connection', message: error.message, retryable: true }
  }

  // Timeout
  if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
    return { type: 'timeout', message: error.message, retryable: true }
  }

  // Rate limiting
  if (statusCode === 429 || error.message?.includes('Rate limit')) {
    return { type: 'rate_limit', message: 'Rate limit exceeded', retryable: true, statusCode }
  }

  // Server errors
  if (statusCode && statusCode >= 500) {
    return { type: 'server_error', message: 'Server error', retryable: true, statusCode }
  }

  // Authentication errors
  if (statusCode === 401 || statusCode === 403 || error.message?.includes('Authentication') || error.message?.includes('auth')) {
    return { type: 'invalid_credentials', message: 'Authentication failed', retryable: false, statusCode }
  }

  // Invalid model
  if (error.message?.includes('model') || statusCode === 404) {
    return { type: 'invalid_model', message: 'Invalid model', retryable: false, statusCode }
  }

  // Invalid request
  if (statusCode === 400) {
    return { type: 'invalid_request', message: 'Invalid request', retryable: false, statusCode }
  }

  // Default to non-retryable for unknown errors
  return { type: 'malformed_request', message: error.message || 'Unknown error', retryable: false }
}
