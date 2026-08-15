/**
 * ALEX Logger
 * Centralized logging for ALEX operations
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  component: string
  message: string
  data?: any
  userId?: string
  conversationId?: string
}

class AlexLogger {
  private logs: LogEntry[] = []
  private maxLogs = 1000 // Keep last 1000 logs in memory

  /**
   * Log a message
   */
  private log(level: LogLevel, component: string, message: string, data?: any, context?: { userId?: string; conversationId?: string }) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data,
      ...context,
    }

    // Add to in-memory logs
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Console output based on level
    const consoleMethod = level === LogLevel.ERROR ? 'error' : level === LogLevel.WARN ? 'warn' : 'log'
    console[consoleMethod](`[ALEX ${level}] [${component}] ${message}`, data || '', context || '')
  }

  debug(component: string, message: string, data?: any, context?: { userId?: string; conversationId?: string }) {
    this.log(LogLevel.DEBUG, component, message, data, context)
  }

  info(component: string, message: string, data?: any, context?: { userId?: string; conversationId?: string }) {
    this.log(LogLevel.INFO, component, message, data, context)
  }

  warn(component: string, message: string, data?: any, context?: { userId?: string; conversationId?: string }) {
    this.log(LogLevel.WARN, component, message, data, context)
  }

  error(component: string, message: string, data?: any, context?: { userId?: string; conversationId?: string }) {
    this.log(LogLevel.ERROR, component, message, data, context)
  }

  /**
   * Get recent logs
   */
  getLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
    let filtered = this.logs
    
    if (level) {
      filtered = filtered.filter(log => log.level === level)
    }

    return filtered.slice(-limit)
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = []
  }
}

// Export singleton instance
export const alexLogger = new AlexLogger()