/**
 * Error Classification Tests
 */

import { classifyError, isRetryableError, ProviderError } from '../provider-manager-types'

describe('Error Classification', () => {
  describe('classifyError', () => {
    it('should classify connection errors as retryable', () => {
      const error = { code: 'ECONNREFUSED', message: 'Connection refused' }
      const classified = classifyError(error)
      expect(classified.type).toBe('connection')
      expect(classified.retryable).toBe(true)
    })

    it('should classify timeout errors as retryable', () => {
      const error = { message: 'Request timeout' }
      const classified = classifyError(error)
      expect(classified.type).toBe('timeout')
      expect(classified.retryable).toBe(true)
    })

    it('should classify rate limit errors (429) as retryable', () => {
      const error = { message: 'Too many requests' }
      const classified = classifyError(error, 429)
      expect(classified.type).toBe('rate_limit')
      expect(classified.retryable).toBe(true)
      expect(classified.statusCode).toBe(429)
    })

    it('should classify server errors (5xx) as retryable', () => {
      const error = { message: 'Internal server error' }
      const classified = classifyError(error, 500)
      expect(classified.type).toBe('server_error')
      expect(classified.retryable).toBe(true)
      expect(classified.statusCode).toBe(500)
    })

    it('should classify authentication errors (401/403) as non-retryable', () => {
      const error = { message: 'Unauthorized' }
      const classified401 = classifyError(error, 401)
      expect(classified401.type).toBe('invalid_credentials')
      expect(classified401.retryable).toBe(false)

      const classified403 = classifyError(error, 403)
      expect(classified403.type).toBe('invalid_credentials')
      expect(classified403.retryable).toBe(false)
    })

    it('should classify 404 as invalid model (non-retryable)', () => {
      const error = { message: 'Model not found' }
      const classified = classifyError(error, 404)
      expect(classified.type).toBe('invalid_model')
      expect(classified.retryable).toBe(false)
    })

    it('should classify 400 as invalid request (non-retryable)', () => {
      const error = { message: 'Bad request' }
      const classified = classifyError(error, 400)
      expect(classified.type).toBe('invalid_request')
      expect(classified.retryable).toBe(false)
    })

    it('should classify unknown errors as non-retryable', () => {
      const error = { message: 'Unknown error' }
      const classified = classifyError(error)
      expect(classified.type).toBe('malformed_request')
      expect(classified.retryable).toBe(false)
    })
  })

  describe('isRetryableError', () => {
    it('should return true for retryable errors', () => {
      const retryableError: ProviderError = {
        type: 'timeout',
        message: 'Request timeout',
        retryable: true,
      }
      expect(isRetryableError(retryableError)).toBe(true)
    })

    it('should return false for non-retryable errors', () => {
      const nonRetryableError: ProviderError = {
        type: 'invalid_credentials',
        message: 'Unauthorized',
        retryable: false,
      }
      expect(isRetryableError(nonRetryableError)).toBe(false)
    })
  })
})
