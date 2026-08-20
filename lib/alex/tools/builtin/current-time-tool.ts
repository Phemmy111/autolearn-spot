/**
 * Current Time Tool - Get current time for a timezone
 * 
 * This tool returns the current time for a requested timezone.
 */

import { ToolDefinition, ToolExecutor, ToolExecutionContext } from '../../types'

export const currentTimeToolDefinition: ToolDefinition = {
  name: 'current_time',
  description: 'MUST be used for questions asking for the current time, current date/time, or "right now" time in a location. Returns the actual current timestamp for any IANA timezone. Do NOT use web research, model knowledge, or stale timestamps for current-time queries. Examples: "What time is it in Lagos right now?", "What time is it in New York?", "Tell me the current time in Africa/Lagos."',
  inputSchema: {
    type: 'object',
    required: ['timezone'],
    properties: {
      timezone: {
        type: 'string',
        description: 'IANA timezone identifier (e.g., "Africa/Lagos" for Nigeria, "America/New_York", "Europe/London", "Asia/Tokyo"). Use standard IANA timezone names.',
        minLength: 1,
        maxLength: 100
      }
    }
  },
  category: 'information',
  permissions: [],
  enabled: true,
  timeoutMs: 3000 // 3 second timeout
}

export const currentTimeToolExecutor: ToolExecutor = {
  name: 'current_time',
  async execute(args: Record<string, any>, context: ToolExecutionContext): Promise<any> {
    const { timezone } = args

    if (!timezone || typeof timezone !== 'string') {
      throw new Error('Timezone is required and must be a string')
    }

    try {
      // Validate timezone by attempting to use it
      const now = new Date()
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'long'
      })

      const formatted = formatter.format(now)

      // Get ISO timestamp in the requested timezone
      const isoTimestamp = new Date().toISOString()

      // Parse the formatted time to extract components
      const parts = formatter.formatToParts(now)
      const hour = parts.find(p => p.type === 'hour')?.value
      const minute = parts.find(p => p.type === 'minute')?.value
      const second = parts.find(p => p.type === 'second')?.value
      const period = parts.find(p => p.type === 'dayPeriod')?.value
      const tzName = parts.find(p => p.type === 'timeZoneName')?.value

      return {
        timezone,
        isoTimestamp,
        formattedTime: formatted,
        hour,
        minute,
        second,
        period,
        timeZoneName: tzName,
        utcOffset: this.getUTCOffset(timezone)
      }
    } catch (error) {
      throw new Error(`Invalid timezone or failed to get time: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  /**
   * Get UTC offset for a timezone
   */
  getUTCOffset(timezone: string): string {
    try {
      const now = new Date()
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'shortOffset'
      })
      const parts = formatter.formatToParts(now)
      const offset = parts.find(p => p.type === 'timeZoneName')?.value || 'UTC'
      return offset
    } catch {
      return 'UTC'
    }
  }
}
