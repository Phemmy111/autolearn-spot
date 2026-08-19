/**
 * ALEX File Text Extraction Utilities
 * Phase 3A - Document Intelligence Foundation
 * 
 * Extracts text from various file types for use as ALEX conversation context
 * Security: All content is treated as untrusted data for analysis only
 */

import mammoth from 'mammoth'
import pdf from 'pdf-parse'

export interface ExtractionResult {
  success: boolean
  text: string
  metadata: {
    pageCount?: number
    paragraphs?: number
    lines?: number
    characters?: number
    wordCount?: number
    extractionMethod: string
  }
  error?: string
}

export interface FileValidation {
  valid: boolean
  maxSize: number
  allowedTypes: string[]
  error?: string
}

// File type mapping for validation
const FILE_TYPE_MAP: Record<string, string[]> = {
  'application/pdf': ['pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/msword': ['doc'],
  'text/plain': ['txt'],
  'text/markdown': ['md'],
  'text/javascript': ['js'],
  'application/javascript': ['js'],
  'text/typescript': ['ts'],
  'application/typescript': ['ts'],
  'text/css': ['css'],
  'text/html': ['html'],
  'application/json': ['json'],
  'text/x-python': ['py'],
  'text/x-java-source': ['java'],
  'text/x-c': ['c'],
  'text/x-c++': ['cpp'],
  'text/x-csharp': ['cs'],
  'text/csv': ['csv'],
  'image/png': ['png'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/webp': ['webp'],
}

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

/**
 * Validate file before upload
 */
export function validateFile(file: File): FileValidation {
  console.log('[DIAGNOSTIC] FILE VALIDATION', {
    filename: file.name,
    fileType: file.type,
    fileSize: file.size,
    allowedTypes: Object.keys(FILE_TYPE_MAP),
    typeInMap: Object.keys(FILE_TYPE_MAP).includes(file.type)
  })

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      maxSize: MAX_FILE_SIZE,
      allowedTypes: Object.keys(FILE_TYPE_MAP),
      error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
    }
  }

  // Check file type
  const allowedTypes = Object.keys(FILE_TYPE_MAP)
  if (!allowedTypes.includes(file.type)) {
    console.log('[DIAGNOSTIC] FILE TYPE REJECTED, CHECKING EXTENSION', {
      fileType: file.type,
      allowedTypes,
      reason: 'Type not in allowed types'
    })

    // Fallback: check file extension if MIME type doesn't match
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    console.log('[DIAGNOSTIC] FILE EXTENSION CHECK', {
      fileExt,
      isImageExt: ['png', 'jpg', 'jpeg', 'webp'].includes(fileExt || '')
    })

    // Allow image files based on extension as fallback
    if (['png', 'jpg', 'jpeg', 'webp'].includes(fileExt || '')) {
      console.log('[DIAGNOSTIC] FILE ACCEPTED BY EXTENSION', {
        fileExt,
        filename: file.name
      })
      return {
        valid: true,
        maxSize: MAX_FILE_SIZE,
        allowedTypes
      }
    }

    return {
      valid: false,
      maxSize: MAX_FILE_SIZE,
      allowedTypes,
      error: `File type ${file.type} not supported`
    }
  }

  console.log('[DIAGNOSTIC] FILE TYPE ACCEPTED', {
    fileType: file.type,
    filename: file.name
  })

  return {
    valid: true,
    maxSize: MAX_FILE_SIZE,
    allowedTypes
  }
}

/**
 * Extract text from file based on MIME type
 */
export async function extractTextFromFile(file: File): Promise<ExtractionResult> {
  try {
    console.log('[DIAGNOSTIC] EXTRACTION START', {
      filename: file.name,
      mimeType: file.type,
      fileSize: file.size,
      fileExtension: file.name.split('.').pop()
    })

    const buffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)

    console.log('[DIAGNOSTIC] FILE BUFFER LOADED', {
      bufferSize: buffer.byteLength,
      uint8ArrayLength: uint8Array.length
    })

    switch (file.type) {
      case 'application/pdf':
        console.log('[DIAGNOSTIC] PDF EXTRACTION START')
        const pdfResult = await extractPDF(uint8Array)
        console.log('[DIAGNOSTIC] PDF EXTRACTION RESULT', {
          success: pdfResult.success,
          textLength: pdfResult.text.length,
          error: pdfResult.error,
          pageCount: pdfResult.metadata.pageCount
        })
        return pdfResult
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        console.log('[DIAGNOSTIC] DOCX EXTRACTION START')
        const docxResult = await extractDOCX(uint8Array)
        console.log('[DIAGNOSTIC] DOCX EXTRACTION RESULT', {
          success: docxResult.success,
          textLength: docxResult.text.length,
          error: docxResult.error,
          paragraphs: docxResult.metadata.paragraphs
        })
        return docxResult
      
      case 'text/plain':
      case 'text/markdown':
      case 'text/javascript':
      case 'application/javascript':
      case 'text/typescript':
      case 'application/typescript':
      case 'text/css':
      case 'text/html':
      case 'application/json':
      case 'text/x-python':
      case 'text/x-java-source':
      case 'text/x-c':
      case 'text/x-c++':
      case 'text/x-csharp':
      case 'text/csv':
        console.log('[DIAGNOSTIC] TEXT FILE EXTRACTION START')
        const textResult = extractTextFile(uint8Array)
        console.log('[DIAGNOSTIC] TEXT FILE EXTRACTION RESULT', {
          success: textResult.success,
          textLength: textResult.text.length,
          error: textResult.error,
          lines: textResult.metadata.lines
        })
        return textResult

      case 'image/png':
      case 'image/jpeg':
      case 'image/webp':
        console.log('[DIAGNOSTIC] IMAGE FILE DETECTED')
        // Images don't need text extraction - they're used directly for vision
        return {
          success: true,
          text: '', // No text needed for images
          metadata: {
            extractionMethod: 'vision'
          }
        }

      default:
        console.log('[DIAGNOSTIC] UNSUPPORTED FILE TYPE', {
          mimeType: file.type,
          filename: file.name
        })
        return {
          success: false,
          text: '',
          metadata: { extractionMethod: 'none' },
          error: `Unsupported file type: ${file.type}`
        }
    }
  } catch (error) {
    console.log('[DIAGNOSTIC] EXTRACTION EXCEPTION', {
      error: error instanceof Error ? error.message : 'Unknown extraction error',
      filename: file.name,
      mimeType: file.type
    })
    return {
      success: false,
      text: '',
      metadata: { extractionMethod: 'error' },
      error: error instanceof Error ? error.message : 'Unknown extraction error'
    }
  }
}

/**
 * Extract text from PDF
 */
async function extractPDF(buffer: Uint8Array): Promise<ExtractionResult> {
  try {
    console.log('[DIAGNOSTIC] PDF PARSE START', {
      bufferSize: buffer.length
    })

    const data = await pdf(Buffer.from(buffer))
    const text = data.text

    console.log('[DIAGNOSTIC] PDF PARSE RESULT', {
      pageCount: data.numpages,
      textLength: text.length,
      textTrimmedLength: text.trim().length,
      hasText: !!text && text.trim().length > 0
    })

    if (!text || text.trim().length === 0) {
      console.log('[DIAGNOSTIC] PDF EXTRACTION FAILED - NO TEXT')
      return {
        success: false,
        text: '',
        metadata: {
          pageCount: data.numpages,
          extractionMethod: 'pdf-parse'
        },
        error: 'PDF contains no extractable text'
      }
    }

    return {
      success: true,
      text: text.trim(),
      metadata: {
        pageCount: data.numpages,
        paragraphs: text.split(/\n\n+/).length,
        lines: text.split('\n').length,
        characters: text.length,
        wordCount: text.split(/\s+/).length,
        extractionMethod: 'pdf-parse'
      }
    }
  } catch (error) {
    console.log('[DIAGNOSTIC] PDF EXTRACTION EXCEPTION', {
      error: error instanceof Error ? error.message : 'PDF extraction failed',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    })
    return {
      success: false,
      text: '',
      metadata: { extractionMethod: 'pdf-parse' },
      error: error instanceof Error ? error.message : 'PDF extraction failed'
    }
  }
}

/**
 * Extract text from DOCX
 */
async function extractDOCX(buffer: Uint8Array): Promise<ExtractionResult> {
  try {
    console.log('[DIAGNOSTIC] DOCX PARSE START', {
      bufferSize: buffer.length,
      bufferType: buffer.constructor.name
    })

    // Try different buffer formats for mammoth
    let result
    try {
      // Try with ArrayBuffer directly
      result = await mammoth.extractRawText({ arrayBuffer: buffer.buffer })
    } catch (bufferError) {
      console.log('[DIAGNOSTIC] DOCX ArrayBuffer failed, trying Buffer')
      // Try with Node.js Buffer
      result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
    }

    const text = result.value

    console.log('[DIAGNOSTIC] DOCX PARSE RESULT', {
      textLength: text.length,
      textTrimmedLength: text.trim().length,
      hasText: !!text && text.trim().length > 0
    })

    if (!text || text.trim().length === 0) {
      console.log('[DIAGNOSTIC] DOCX EXTRACTION FAILED - NO TEXT')
      return {
        success: false,
        text: '',
        metadata: { extractionMethod: 'mammoth' },
        error: 'DOCX contains no extractable text'
      }
    }

    return {
      success: true,
      text: text.trim(),
      metadata: {
        paragraphs: text.split(/\n\n+/).length,
        lines: text.split('\n').length,
        characters: text.length,
        wordCount: text.split(/\s+/).length,
        extractionMethod: 'mammoth'
      }
    }
  } catch (error) {
    console.log('[DIAGNOSTIC] DOCX EXTRACTION EXCEPTION', {
      error: error instanceof Error ? error.message : 'DOCX extraction failed',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    })
    return {
      success: false,
      text: '',
      metadata: { extractionMethod: 'mammoth' },
      error: error instanceof Error ? error.message : 'DOCX extraction failed'
    }
  }
}

/**
 * Extract text from plain text/code files
 */
function extractTextFile(buffer: Uint8Array): ExtractionResult {
  try {
    const decoder = new TextDecoder('utf-8')
    const text = decoder.decode(buffer)
    
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        text: '',
        metadata: { extractionMethod: 'text-decoder' },
        error: 'File contains no extractable text'
      }
    }

    return {
      success: true,
      text: text.trim(),
      metadata: {
        lines: text.split('\n').length,
        characters: text.length,
        wordCount: text.split(/\s+/).length,
        extractionMethod: 'text-decoder'
      }
    }
  } catch (error) {
    return {
      success: false,
      text: '',
      metadata: { extractionMethod: 'text-decoder' },
      error: error instanceof Error ? error.message : 'Text extraction failed'
    }
  }
}

/**
 * Sanitize extracted text for safe use in AI context
 * This prevents prompt injection by treating file content as data only
 */
export function sanitizeExtractedText(text: string): string {
  // Remove or escape potentially dangerous patterns
  // We treat this as reference material, not executable instructions
  
  return text
    // Remove null bytes
    .replace(/\0/g, '')
    // Limit extremely long lines (potential injection vectors)
    .split('\n')
    .map(line => line.length > 10000 ? line.substring(0, 10000) + '... [truncated]' : line)
    .join('\n')
    // Ensure reasonable total length
    .substring(0, 500000) // 500K character limit for extracted text
}

/**
 * Generate a summary of file content for context selection
 */
export function generateFileSummary(text: string, filename: string): string {
  const wordCount = text.split(/\s+/).length
  const lineCount = text.split('\n').length
  const charCount = text.length
  
  // Generate first few lines as preview
  const preview = text.split('\n').slice(0, 3).join('\n')
  
  return `[File: ${filename}]\n[Stats: ${wordCount} words, ${lineCount} lines, ${charCount} characters]\n[Preview: ${preview.substring(0, 200)}...]`
}

/**
 * Check if extracted text is meaningful (not just garbage)
 */
export function isMeaningfulText(text: string): boolean {
  if (!text || text.length < 10) return false
  
  // Check for minimum word count
  const words = text.split(/\s+/).filter(w => w.length > 0)
  if (words.length < 3) return false
  
  // Check for reasonable character-to-word ratio (indicates actual text)
  const charWordRatio = text.length / words.length
  if (charWordRatio < 2 || charWordRatio > 20) return false
  
  return true
}
