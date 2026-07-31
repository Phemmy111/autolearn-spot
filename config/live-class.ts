/**
 * Live Class Configuration
 * Centralized configuration for live class scheduling
 * Update this file to change live class times across the entire platform
 */

export const LIVE_CLASS_CONFIG = {
  // Day of the week when live classes are held
  day: 'Saturday',
  
  // Start time in 24-hour format (8:00 PM = 20:00)
  startTime: '20:00',
  
  // Timezone
  timezone: 'WAT', // West Africa Time
  
  // Duration in minutes
  durationMinutes: 60,
  
  // Room prefix for generating meeting room names
  roomPrefix: 'autolearn-spot-live',
  
  // Format for displaying time to users
  get displayTime(): string {
    const [hours, minutes] = this.startTime.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm} ${this.timezone}`
  },
  
  // Format for short display (e.g., "8PM WAT")
  get shortDisplayTime(): string {
    const [hours, minutes] = this.startTime.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour
    return `${displayHour}${minutes !== '00' ? ':' + minutes : ''}${ampm} ${this.timezone}`
  }
} as const

/**
 * Get live class time for notifications
 */
export function getLiveClassTimeForNotification(): string {
  return LIVE_CLASS_CONFIG.displayTime
}

/**
 * Get live class time for short display
 */
export function getLiveClassTimeShort(): string {
  return LIVE_CLASS_CONFIG.shortDisplayTime
}