/**
 * ALEX Error Handler
 * Centralized error handling for ALEX operations
 */

export class AlexError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'AlexError'
  }
}

export class AlexErrors {
  static UNAUTHORIZED = new AlexError('Unauthorized access', 'UNAUTHORIZED', 401)
  static FORBIDDEN = new AlexError('Access forbidden', 'FORBIDDEN', 403)
  static NOT_FOUND = new AlexError('Resource not found', 'NOT_FOUND', 404)
  static RATE_LIMITED = new AlexError('Rate limit exceeded', 'RATE_LIMITED', 429)
  static PROVIDER_NOT_CONFIGURED = new AlexError('ALEX provider not configured', 'PROVIDER_NOT_CONFIGURED', 503)
  static PROVIDER_ERROR = new AlexError('ALEX provider error', 'PROVIDER_ERROR', 502)
  static INVALID_REQUEST = new AlexError('Invalid request', 'INVALID_REQUEST', 400)
  static CONVERSATION_NOT_FOUND = new AlexError('Conversation not found', 'CONVERSATION_NOT_FOUND', 404)
  static MODE_NOT_SUPPORTED = new AlexError('Mode not supported', 'MODE_NOT_SUPPORTED', 400)
}

/**
 * Handle ALEX errors and return appropriate response
 */
export function handleAlexError(error: unknown): {
  statusCode: number
  message: string
  code: string
  details?: any
} {
  if (error instanceof AlexError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      details: error.details,
    }
  }

  if (error instanceof Error) {
    console.error('ALEX Error:', error)
    return {
      statusCode: 500,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }
  }

  console.error('Unknown ALEX Error:', error)
  return {
    statusCode: 500,
    message: 'Internal server error',
    code: 'UNKNOWN_ERROR',
  }
}

/**
 * Wrap async functions with error handling
 */
export function withAlexErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      const handled = handleAlexError(error)
      throw new AlexError(handled.message, handled.code, handled.statusCode, handled.details)
    }
  }) as T
}