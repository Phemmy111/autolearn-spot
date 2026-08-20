/**
 * Current Time Tool Tests
 */

import { currentTimeToolDefinition, currentTimeToolExecutor } from '../tools/builtin/current-time-tool'
import { ToolExecutionContext } from '../types'

describe('Current Time Tool', () => {
  let context: ToolExecutionContext

  beforeEach(() => {
    context = {
      userId: 'test-user-id'
    }
  })

  describe('Tool Definition', () => {
    test('should have correct definition', () => {
      expect(currentTimeToolDefinition.name).toBe('current_time')
      expect(currentTimeToolDefinition.category).toBe('information')
      expect(currentTimeToolDefinition.enabled).toBe(true)
      expect(currentTimeToolDefinition.inputSchema.required).toContain('timezone')
    })
  })

  describe('Tool Execution', () => {
    test('should get time for valid timezone', async () => {
      const result = await currentTimeToolExecutor.execute({ timezone: 'America/New_York' }, context)
      expect(result.timezone).toBe('America/New_York')
      expect(result.isoTimestamp).toBeDefined()
      expect(result.formattedTime).toBeDefined()
      expect(result.hour).toBeDefined()
      expect(result.minute).toBeDefined()
      expect(result.second).toBeDefined()
    })

    test('should get time for Lagos timezone', async () => {
      const result = await currentTimeToolExecutor.execute({ timezone: 'Africa/Lagos' }, context)
      expect(result.timezone).toBe('Africa/Lagos')
      expect(result.isoTimestamp).toBeDefined()
    })

    test('should get time for UTC', async () => {
      const result = await currentTimeToolExecutor.execute({ timezone: 'UTC' }, context)
      expect(result.timezone).toBe('UTC')
      expect(result.isoTimestamp).toBeDefined()
    })

    test('should reject invalid timezone', async () => {
      await expect(
        currentTimeToolExecutor.execute({ timezone: 'Invalid/Timezone' }, context)
      ).rejects.toThrow('Invalid timezone')
    })

    test('should reject non-string timezone', async () => {
      await expect(
        currentTimeToolExecutor.execute({ timezone: 123 }, context)
      ).rejects.toThrow('must be a string')
    })

    test('should reject missing timezone', async () => {
      await expect(
        currentTimeToolExecutor.execute({}, context)
      ).rejects.toThrow('required')
    })

    test('should return UTC offset', async () => {
      const result = await currentTimeToolExecutor.execute({ timezone: 'America/New_York' }, context)
      expect(result.utcOffset).toBeDefined()
    })
  })
})
