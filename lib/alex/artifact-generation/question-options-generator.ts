/**
 * Question Options Generator
 * 
 * Generates enriched options for common artifact generation questions
 * This provides structured, interactive options for the AI to use
 */

import { InteractiveOption } from '../orchestration/types'

export class QuestionOptionsGenerator {
  /**
   * Generate platform selection options
   */
  static generatePlatformOptions(): InteractiveOption[] {
    return [
      {
        label: 'n8n',
        value: 'n8n',
        description: 'Visual workflow automation with 400+ integrations',
        recommended: true
      },
      {
        label: 'Zapier',
        value: 'zapier',
        description: 'Easy-to-use automation with 5,000+ app integrations'
      },
      {
        label: 'Make (Integromat)',
        value: 'make',
        description: 'Advanced scenarios with powerful data transformation'
      },
      {
        label: 'Custom Script',
        value: 'custom',
        description: 'Python/Node.js script for maximum flexibility'
      }
    ]
  }

  /**
   * Generate trigger type options
   */
  static generateTriggerOptions(): InteractiveOption[] {
    return [
      {
        label: 'Manual',
        value: 'manual',
        description: 'Trigger workflow manually via button or API call',
        recommended: true
      },
      {
        label: 'Schedule',
        value: 'schedule',
        description: 'Run on a schedule (cron, interval)'
      },
      {
        label: 'Webhook',
        value: 'webhook',
        description: 'Trigger via HTTP webhook from external services'
      },
      {
        label: 'Event-based',
        value: 'event',
        description: 'Trigger when specific events occur in connected apps'
      }
    ]
  }

  /**
   * Generate complexity level options
   */
  static generateComplexityOptions(): InteractiveOption[] {
    return [
      {
        label: 'Simple',
        value: 'simple',
        description: '1-3 steps, linear flow, minimal logic',
        recommended: true
      },
      {
        label: 'Moderate',
        value: 'moderate',
        description: '4-8 steps, some branching/conditions'
      },
      {
        label: 'Complex',
        value: 'complex',
        description: '9+ steps, complex logic, multiple integrations'
      }
    ]
  }

  /**
   * Generate notification preference options
   */
  static generateNotificationOptions(): InteractiveOption[] {
    return [
      {
        label: 'Email',
        value: 'email',
        description: 'Send email notifications',
        recommended: true
      },
      {
        label: 'Slack',
        value: 'slack',
        description: 'Send Slack messages'
      },
      {
        label: 'SMS',
        value: 'sms',
        description: 'Send text message notifications'
      },
      {
        label: 'None',
        value: 'none',
        description: 'No notifications'
      }
    ]
  }

  /**
   * Generate error handling strategy options
   */
  static generateErrorHandlingOptions(): InteractiveOption[] {
    return [
      {
        label: 'Retry with backoff',
        value: 'retry-backoff',
        description: 'Automatically retry with exponential backoff',
        recommended: true
      },
      {
        label: 'Log and continue',
        value: 'log-continue',
        description: 'Log error and continue with next steps'
      },
      {
        label: 'Stop and notify',
        value: 'stop-notify',
        description: 'Stop workflow and send notification'
      },
      {
        label: 'Custom handling',
        value: 'custom',
        description: 'Define custom error handling logic'
      }
    ]
  }

  /**
   * Generate data format options
   */
  static generateDataFormatOptions(): InteractiveOption[] {
    return [
      {
        label: 'JSON',
        value: 'json',
        description: 'Structured data format',
        recommended: true
      },
      {
        label: 'CSV',
        value: 'csv',
        description: 'Comma-separated values for spreadsheets'
      },
      {
        label: 'XML',
        value: 'xml',
        description: 'Structured markup format'
      },
      {
        label: 'Plain Text',
        value: 'text',
        description: 'Unstructured text data'
      }
    ]
  }

  /**
   * Get options for a given question context
   */
  static getOptionsForContext(context: string): InteractiveOption[] | null {
    const contextLower = context.toLowerCase()
    
    if (contextLower.includes('platform') || contextLower.includes('automation platform')) {
      return this.generatePlatformOptions()
    }
    if (contextLower.includes('trigger') || contextLower.includes('when should') || contextLower.includes('start')) {
      return this.generateTriggerOptions()
    }
    if (contextLower.includes('complex') || contextLower.includes('complexity')) {
      return this.generateComplexityOptions()
    }
    if (contextLower.includes('notification') || contextLower.includes('alert') || contextLower.includes('message')) {
      return this.generateNotificationOptions()
    }
    if (contextLower.includes('error') || contextLower.includes('fail') || contextLower.includes('handle')) {
      return this.generateErrorHandlingOptions()
    }
    if (contextLower.includes('format') || contextLower.includes('data')) {
      return this.generateDataFormatOptions()
    }
    if (contextLower.includes('email') && contextLower.includes('provider')) {
      return [
        { label: 'Gmail', value: 'gmail', description: 'Google\'s email service', recommended: true },
        { label: 'Outlook', value: 'outlook', description: 'Microsoft\'s email service' },
        { label: 'Yahoo Mail', value: 'yahoo', description: 'Yahoo\'s email service' },
        { label: 'Other/IMAP', value: 'imap', description: 'Custom IMAP email server' }
      ]
    }
    if (contextLower.includes('slack') && contextLower.includes('channel')) {
      return [
        { label: '#general', value: '#general', description: 'Main team channel', recommended: true },
        { label: '#alerts', value: '#alerts', description: 'Dedicated alerts channel' },
        { label: '#notifications', value: '#notifications', description: 'Notification-specific channel' },
        { label: 'Custom channel', value: 'custom', description: 'Specify your own channel' }
      ]
    }
    
    return null
  }
}