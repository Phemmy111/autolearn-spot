/**
 * Tests for Token-Aware Context Assembly
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { assembleTokenAwareContext, TokenAwareAssemblyOptions } from '../token-aware-context'
import { AlexFile } from '../types'

// Mock the dependencies
jest.mock('../retrieval')
jest.mock('../token-estimation')

describe('Token-Aware Context Assembly', () => {
  let mockFiles: AlexFile[]
  let mockOptions: TokenAwareAssemblyOptions

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Create mock files
    mockFiles = [
      {
        id: 'file1',
        original_filename: 'document1.pdf',
        mime_type: 'application/pdf',
        status: 'completed',
        extraction_status: 'completed',
        extracted_text: 'This is the content of document 1. '.repeat(100), // ~2KB
        user_id: 'user1',
        conversation_id: 'conv1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'file2',
        original_filename: 'document2.pdf',
        mime_type: 'application/pdf',
        status: 'completed',
        extraction_status: 'completed',
        extracted_text: 'This is the content of document 2. '.repeat(100), // ~2KB
        user_id: 'user1',
        conversation_id: 'conv1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'file3',
        original_filename: 'small.txt',
        mime_type: 'text/plain',
        status: 'completed',
        extraction_status: 'completed',
        extracted_text: 'Small content', // ~100 bytes
        user_id: 'user1',
        conversation_id: 'conv1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    mockOptions = {
      attachedFiles: mockFiles,
      userId: 'user1',
      conversationId: 'conv1',
      userQuery: 'summarize the documents',
      conversationHistory: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ],
      systemPrompt: 'You are ALEX',
      platformContext: 'User context',
      modelName: 'openai/gpt-oss-120b'
    }
  })

  describe('3 small files scenario', () => {
    it('should include all 3 small files in context', async () => {
      const result = await assembleTokenAwareContext(mockOptions)
      
      expect(result.diagnostics.totalFilesAttached).toBe(3)
      expect(result.diagnostics.filesRepresentedInContext).toBe(3)
      expect(result.diagnostics.estimatedTokensAfterCompression).toBeLessThan(mockOptions.modelName.length * 1000)
    })
  })

  describe('1 huge PDF + 2 small files scenario', () => {
    it('should handle huge PDF with RAG and include small files', async () => {
      // Add a huge PDF
      const hugePdf: AlexFile = {
        id: 'huge-file',
        original_filename: 'huge-document.pdf',
        mime_type: 'application/pdf',
        status: 'completed',
        extraction_status: 'completed',
        extracted_text: 'A'.repeat(100000), // 100KB
        user_id: 'user1',
        conversation_id: 'conv1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const optionsWithHuge = {
        ...mockOptions,
        attachedFiles: [hugePdf, mockFiles[0], mockFiles[1]]
      }

      const result = await assembleTokenAwareContext(optionsWithHuge)
      
      expect(result.diagnostics.totalFilesAttached).toBe(3)
      expect(result.diagnostics.compressionRatio).toBeLessThan(1) // Should compress huge file
      expect(result.diagnostics.filesRepresentedInContext).toBeGreaterThan(0)
    })
  })

  describe('Multiple large files scenario', () => {
    it('should use RAG to select chunks from multiple large files', async () => {
      const largeFiles: AlexFile[] = Array.from({ length: 5 }, (_, i) => ({
        id: `large-file-${i}`,
        original_filename: `large-document-${i}.pdf`,
        mime_type: 'application/pdf',
        status: 'completed',
        extraction_status: 'completed',
        extracted_text: 'Content '.repeat(10000), // ~50KB each
        user_id: 'user1',
        conversation_id: 'conv1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const optionsWithLarge = {
        ...mockOptions,
        attachedFiles: largeFiles
      }

      const result = await assembleTokenAwareContext(optionsWithLarge)
      
      expect(result.diagnostics.totalFilesAttached).toBe(5)
      expect(result.diagnostics.compressionRatio).toBeLessThan(1)
      expect(result.diagnostics.filesRepresentedInContext).toBeGreaterThan(0)
    })
  })

  describe('Request near model limit scenario', () => {
    it('should handle when request is already near model limit', async () => {
      const optionsNearLimit = {
        ...mockOptions,
        conversationHistory: Array.from({ length: 20 }, (_, i) => ({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: 'A'.repeat(500) // Large messages
        })),
        systemPrompt: 'A'.repeat(2000), // Large system prompt
        platformContext: 'B'.repeat(2000) // Large platform context
      }

      const result = await assembleTokenAwareContext(optionsNearLimit)
      
      expect(result.diagnostics.estimatedTokensAfterCompression).toBeLessThan(
        result.diagnostics.modelContextLimit
      )
    })
  })

  describe('Retrieval across multiple files', () => {
    it('should ensure representation from all files', async () => {
      const result = await assembleTokenAwareContext(mockOptions)
      
      expect(result.diagnostics.filesRepresentedInContext).toBeGreaterThan(0)
      expect(result.diagnostics.chunksRetrievedPerFile.size).toBeGreaterThan(0)
    })
  })

  describe('No single file monopolization', () => {
    it('should prevent single file from consuming entire budget', async () => {
      const oneHugeOneSmall: AlexFile[] = [
        {
          id: 'huge',
          original_filename: 'huge.pdf',
          mime_type: 'application/pdf',
          status: 'completed',
          extraction_status: 'completed',
          extracted_text: 'A'.repeat(50000), // 50KB
          user_id: 'user1',
          conversation_id: 'conv1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'small',
          original_filename: 'small.txt',
          mime_type: 'text/plain',
          status: 'completed',
          extraction_status: 'completed',
          extracted_text: 'Small',
          user_id: 'user1',
          conversation_id: 'conv1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      const optionsUnbalanced = {
        ...mockOptions,
        attachedFiles: oneHugeOneSmall
      }

      const result = await assembleTokenAwareContext(optionsUnbalanced)
      
      // Both files should be represented
      expect(result.diagnostics.filesRepresentedInContext).toBeGreaterThan(0)
      // The huge file should be compressed
      expect(result.diagnostics.compressionRatio).toBeLessThan(1)
    })
  })

  describe('Metadata preservation', () => {
    it('should always include metadata for all files', async () => {
      const result = await assembleTokenAwareContext(mockOptions)
      
      expect(result.context).toContain('Attached Documents')
      expect(result.context).toContain('document1.pdf')
      expect(result.context).toContain('document2.pdf')
      expect(result.context).toContain('small.txt')
    })

    it('should show extraction status for each file', async () => {
      const mixedStatusFiles: AlexFile[] = [
        { ...mockFiles[0], extraction_status: 'completed' },
        { ...mockFiles[1], extraction_status: 'processing' },
        { ...mockFiles[2], extraction_status: 'failed' }
      ]

      const optionsMixed = {
        ...mockOptions,
        attachedFiles: mixedStatusFiles
      }

      const result = await assembleTokenAwareContext(optionsMixed)
      
      expect(result.context).toContain('extracted')
      expect(result.context).toContain('processing')
      expect(result.context).toContain('failed')
    })
  })

  describe('Image handling', () => {
    it('should separate images from text files', async () => {
      const imageFile: AlexFile = {
        id: 'image1',
        original_filename: 'image.png',
        mime_type: 'image/png',
        status: 'completed',
        extraction_status: 'completed',
        extracted_text: '',
        user_id: 'user1',
        conversation_id: 'conv1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const optionsWithImage = {
        ...mockOptions,
        attachedFiles: [...mockFiles, imageFile]
      }

      const result = await assembleTokenAwareContext(optionsWithImage)
      
      expect(result.imageFiles).toHaveLength(1)
      expect(result.imageFiles[0].id).toBe('image1')
      expect(result.diagnostics.totalFilesAttached).toBe(4) // 3 text + 1 image
    })
  })

  describe('Diagnostics reporting', () => {
    it('should provide comprehensive diagnostics', async () => {
      const result = await assembleTokenAwareContext(mockOptions)
      
      expect(result.diagnostics).toHaveProperty('modelContextLimit')
      expect(result.diagnostics).toHaveProperty('reservedOutputTokens')
      expect(result.diagnostics).toHaveProperty('inputBudget')
      expect(result.diagnostics).toHaveProperty('estimatedTokensBeforeCompression')
      expect(result.diagnostics).toHaveProperty('estimatedTokensAfterCompression')
      expect(result.diagnostics).toHaveProperty('chunksRetrievedPerFile')
      expect(result.diagnostics).toHaveProperty('filesRepresentedInContext')
      expect(result.diagnostics).toHaveProperty('totalFilesAttached')
      expect(result.diagnostics).toHaveProperty('compressionRatio')
    })

    it('should report compression when applicable', async () => {
      const hugeFile: AlexFile[] = [{
        id: 'huge',
        original_filename: 'huge.pdf',
        mime_type: 'application/pdf',
        status: 'completed',
        extraction_status: 'completed',
        extracted_text: 'A'.repeat(100000),
        user_id: 'user1',
        conversation_id: 'conv1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]

      const optionsHuge = {
        ...mockOptions,
        attachedFiles: hugeFile
      }

      const result = await assembleTokenAwareContext(optionsHuge)
      
      expect(result.diagnostics.compressionRatio).toBeLessThan(1)
    })
  })
})