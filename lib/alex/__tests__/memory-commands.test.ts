/**
 * ALEX Phase 4 - Memory Command Detection Tests
 */

import { describe, it, expect } from '@jest/globals'
import { detectMemoryCommand, classifyMemoryFromContent, containsSensitivePattern } from '../memory/memory-commands'

describe('Memory Command Detection', () => {
  describe('detectMemoryCommand', () => {
    it('should detect "remember that X" command', () => {
      const command = detectMemoryCommand('Remember that I prefer TypeScript')
      
      expect(command).not.toBeNull()
      expect(command?.type).toBe('remember')
      expect(command?.extractedMemory).toBe('I prefer TypeScript')
    })

    it('should detect "remember X" command', () => {
      const command = detectMemoryCommand('Remember I like TypeScript')
      
      expect(command).not.toBeNull()
      expect(command?.type).toBe('remember')
      expect(command?.extractedMemory).toBe('I like TypeScript')
    })

    it('should detect "forget that X" command', () => {
      const command = detectMemoryCommand('Forget that I prefer Python')
      
      expect(command).not.toBeNull()
      expect(command?.type).toBe('forget')
      expect(command?.extractedMemory).toBe('I prefer Python')
    })

    it('should detect "forget X" command', () => {
      const command = detectMemoryCommand('Forget I like Python')
      
      expect(command).not.toBeNull()
      expect(command?.type).toBe('forget')
      expect(command?.extractedMemory).toBe('I like Python')
    })

    it('should detect "what do you remember about me?" command', () => {
      const command = detectMemoryCommand('What do you remember about me?')
      
      expect(command).not.toBeNull()
      expect(command?.type).toBe('list')
    })

    it('should detect "show me what you remember" command', () => {
      const command = detectMemoryCommand('Show me what you remember')
      
      expect(command).not.toBeNull()
      expect(command?.type).toBe('list')
    })

    it('should detect "delete all memories" command', () => {
      const command = detectMemoryCommand('Delete all memories')
      
      expect(command).not.toBeNull()
      expect(command?.type).toBe('clear')
    })

    it('should detect "clear all memories" command', () => {
      const command = detectMemoryCommand('Clear all memories')
      
      expect(command).not.toBeNull()
      expect(command?.type).toBe('clear')
    })

    it('should return null for non-memory commands', () => {
      const command = detectMemoryCommand('What is JavaScript?')
      
      expect(command).toBeNull()
    })

    it('should be case insensitive', () => {
      const command = detectMemoryCommand('REMEMBER THAT I prefer TypeScript')
      
      expect(command).not.toBeNull()
      expect(command?.type).toBe('remember')
    })
  })

  describe('classifyMemoryFromContent', () => {
    it('should classify preference correctly', () => {
      const type = classifyMemoryFromContent('I prefer TypeScript')
      expect(type).toBe('preference')
    })

    it('should classify instruction correctly', () => {
      const type = classifyMemoryFromContent('Always provide code examples')
      expect(type).toBe('instruction')
    })

    it('should classify fact by default', () => {
      const type = classifyMemoryFromContent('I work at a tech company')
      expect(type).toBe('fact')
    })

    it('should classify "like" as preference', () => {
      const type = classifyMemoryFromContent('I like TypeScript')
      expect(type).toBe('preference')
    })

    it('should classify "want" as preference', () => {
      const type = classifyMemoryFromContent('I want concise answers')
      expect(type).toBe('preference')
    })

    it('should classify "should" as instruction', () => {
      const type = classifyMemoryFromContent('You should explain step by step')
      expect(type).toBe('instruction')
    })

    it('should classify "never" as instruction', () => {
      const type = classifyMemoryFromContent('Never use jargon')
      expect(type).toBe('instruction')
    })
  })

  describe('containsSensitivePattern', () => {
    it('should detect password pattern', () => {
      const result = containsSensitivePattern('My password is secret123')
      expect(result).toBe(true)
    })

    it('should detect API key pattern', () => {
      const result = containsSensitivePattern('My API key is sk-1234567890')
      expect(result).toBe(true)
    })

    it('should detect secret pattern', () => {
      const result = containsSensitivePattern('The secret is confidential')
      expect(result).toBe(true)
    })

    it('should detect token pattern', () => {
      const result = containsSensitivePattern('Access token: abc123xyz')
      expect(result).toBe(true)
    })

    it('should detect credit card pattern', () => {
      const result = containsSensitivePattern('Card: 4111-1111-1111-1111')
      expect(result).toBe(true)
    })

    it('should not detect normal text as sensitive', () => {
      const result = containsSensitivePattern('I prefer TypeScript for development')
      expect(result).toBe(false)
    })

    it('should not detect normal factual statements as sensitive', () => {
      const result = containsSensitivePattern('I work at AutoLearn Spot')
      expect(result).toBe(false)
    })
  })
})
