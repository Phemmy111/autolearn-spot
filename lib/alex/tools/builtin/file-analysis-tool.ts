/**
 * File Analysis Tool
 * 
 * Analyzes uploaded files and provides insights
 * Concrete useful tool for Phase 3 vertical slice
 */

import { ToolDefinition, ToolExecutor, ToolExecutionContext } from '../../types'

export const fileAnalysisToolDefinition: ToolDefinition = {
  name: 'file_analysis',
  description: 'Analyze uploaded files and provide insights about their content, structure, and key information',
  inputSchema: {
    type: 'object',
    properties: {
      fileId: {
        type: 'string',
        description: 'ID of the file to analyze'
      },
      analysisType: {
        type: 'string',
        enum: ['summary', 'structure', 'key_points', 'statistics'],
        description: 'Type of analysis to perform'
      }
    },
    required: ['fileId']
  },
  category: 'information',
  permissions: ['read'],
  enabled: true,
  timeoutMs: 30000
}

export const fileAnalysisToolExecutor: ToolExecutor = {
  name: 'file_analysis',
  async execute(args: Record<string, any>, context: ToolExecutionContext): Promise<any> {
    const { fileId, analysisType = 'summary' } = args

    console.log('[File Analysis Tool] Executing analysis', { fileId, analysisType, userId: context.userId })

    try {
      // Import file extraction functionality
      const { generateFileSummary } = await import('../../file-extraction')
      const { createClient } = await import('@supabase/supabase-js')

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error('Missing Supabase environment variables')
      }

      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      // Fetch file from database
      const { data: file, error: fileError } = await supabase
        .from('alex_files')
        .select('*')
        .eq('id', fileId)
        .eq('user_id', context.userId)
        .single()

      if (fileError || !file) {
        throw new Error(`File not found or access denied: ${fileError?.message || 'Unknown error'}`)
      }

      // Check if file is ready
      if (file.status !== 'ready') {
        return {
          success: false,
          error: `File is not ready for analysis. Current status: ${file.status}`,
          fileId,
          analysisType
        }
      }

      // Perform analysis based on type
      let analysisResult: any

      switch (analysisType) {
        case 'summary':
          analysisResult = await performSummaryAnalysis(file)
          break
        case 'structure':
          analysisResult = await performStructureAnalysis(file)
          break
        case 'key_points':
          analysisResult = await performKeyPointsAnalysis(file)
          break
        case 'statistics':
          analysisResult = await performStatisticsAnalysis(file)
          break
        default:
          analysisResult = await performSummaryAnalysis(file)
      }

      return {
        success: true,
        fileId,
        fileName: file.original_filename,
        fileType: file.mime_type,
        analysisType,
        result: analysisResult,
        analyzedAt: new Date().toISOString()
      }

    } catch (error) {
      console.error('[File Analysis Tool] Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fileId,
        analysisType
      }
    }
  }
}

/**
 * Perform summary analysis
 */
async function performSummaryAnalysis(file: any): Promise<any> {
  if (file.extracted_text) {
    const text = file.extracted_text
    const wordCount = text.split(/\s+/).length
    const charCount = text.length
    const sentenceCount = text.split(/[.!?]+/).length

    return {
      summary: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
      wordCount,
      charCount,
      sentenceCount,
      hasContent: text.length > 0
    }
  }

  return {
    summary: 'No extracted text available',
    wordCount: 0,
    charCount: 0,
    sentenceCount: 0,
    hasContent: false
  }
}

/**
 * Perform structure analysis
 */
async function performStructureAnalysis(file: any): Promise<any> {
  if (file.extracted_text) {
    const text = file.extracted_text
    const lines = text.split('\n')
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim())

    // Detect common structures
    const hasHeadings = /^#+\s/.test(text)
    const hasLists = /^\s*[-*+]\s/.test(text) || /^\s*\d+\.\s/.test(text)
    const hasCodeBlocks = /```/.test(text)

    return {
      lineCount: lines.length,
      paragraphCount: paragraphs.length,
      hasHeadings,
      hasLists,
      hasCodeBlocks,
      structureType: detectStructureType(hasHeadings, hasLists, hasCodeBlocks)
    }
  }

  return {
    lineCount: 0,
    paragraphCount: 0,
    hasHeadings: false,
    hasLists: false,
    hasCodeBlocks: false,
    structureType: 'unknown'
  }
}

/**
 * Perform key points analysis
 */
async function performKeyPointsAnalysis(file: any): Promise<any> {
  if (file.extracted_text) {
    const text = file.extracted_text
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)

    // Simple extraction of sentences with keywords
    const keywordSentences = sentences.filter(sentence => {
      const keywords = ['important', 'key', 'main', 'primary', 'essential', 'critical', 'significant']
      return keywords.some(keyword => sentence.toLowerCase().includes(keyword))
    })

    return {
      totalSentences: sentences.length,
      keyPoints: keywordSentences.slice(0, 5).map(s => s.trim()),
      hasKeyPoints: keywordSentences.length > 0
    }
  }

  return {
    totalSentences: 0,
    keyPoints: [],
    hasKeyPoints: false
  }
}

/**
 * Perform statistics analysis
 */
async function performStatisticsAnalysis(file: any): Promise<any> {
  if (file.extracted_text) {
    const text = file.extracted_text
    const words = text.split(/\s+/)
    const chars = text.split('')

    // Character frequency
    const charFrequency: Record<string, number> = {}
    for (const char of chars) {
      if (char.match(/[a-zA-Z]/)) {
        charFrequency[char] = (charFrequency[char] || 0) + 1
      }
    }

    // Word length distribution
    const wordLengths = words.map(w => w.length)
    const avgWordLength = wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length

    return {
      totalWords: words.length,
      totalChars: chars.length,
      avgWordLength: avgWordLength.toFixed(2),
      uniqueWords: new Set(words.map(w => w.toLowerCase())).size,
      mostCommonChars: Object.entries(charFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    }
  }

  return {
    totalWords: 0,
    totalChars: 0,
    avgWordLength: 0,
    uniqueWords: 0,
    mostCommonChars: []
  }
}

/**
 * Detect document structure type
 */
function detectStructureType(hasHeadings: boolean, hasLists: boolean, hasCodeBlocks: boolean): string {
  if (hasCodeBlocks) return 'code_document'
  if (hasHeadings && hasLists) return 'structured_document'
  if (hasHeadings) return 'document_with_headings'
  if (hasLists) return 'list_document'
  return 'plain_text'
}
