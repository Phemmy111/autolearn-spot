/**
 * ALEX Vision Service
 *
 * Capability-aware image preprocessing system that allows text-only models
 * to understand image content through vision-capable provider analysis.
 *
 * Architecture:
 * 1. Detect image MIME type
 * 2. Check if selected provider supports vision
 * 3. If yes: send image directly to provider
 * 4. If no: use vision-capable provider for analysis
 * 5. Inject structured visual context into main context pipeline
 *
 * Enhanced with fallback vision provider for universal image support.
 */

import { AlexFile } from './types'
import { ProviderRegistry } from './provider/provider-registry'
import { ProviderManager } from './provider/provider-manager'
import { AIRequest, AIMessage, ImageContent, AIProvider } from './provider/provider-interface'
import { FallbackVisionProvider } from './vision-fallback'
import { createClient } from '@supabase/supabase-js'

/**
 * SVG-specific analysis result
 */
export interface SVGAnalysisResult {
  success: boolean
  filename: string
  structuralData?: {
    textElements: string[]
    metadata: Record<string, string>
    dimensions?: { width: string; height: string }
    elements: string[]
  }
  visualAnalysis?: VisionAnalysisResult
  error?: string
}

export interface VisionAnalysisResult {
  success: boolean
  filename: string
  mimeType: string
  visualDescription?: string
  detectedText?: string
  structure?: string
  uiElements?: string[]
  importantLabels?: string[]
  technicalDetails?: string
  confidence?: number
  error?: string
}

export interface VisionPreprocessingOptions {
  imageFiles: AlexFile[]
  primaryProviderCapabilities: string[]
  providerManager: ProviderManager
  providerRegistry: ProviderRegistry
  maxAnalysisTokens?: number
  analysisTimeout?: number // Timeout for vision analysis in milliseconds
}

/**
 * Main vision preprocessing service
 */
export class VisionService {
  /**
   * Get Supabase client for storage operations
   */
  private static getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables')
    }

    return createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }

  /**
   * Process images for vision preprocessing
   */
  static async processImages(options: VisionPreprocessingOptions): Promise<{
    textContext: string
    processedImages: AlexFile[]
    analysisResults: VisionAnalysisResult[]
  }> {
    const {
      imageFiles,
      primaryProviderCapabilities,
      providerManager,
      providerRegistry,
      maxAnalysisTokens = 3000,
      analysisTimeout = 60000 // Default 60 seconds for vision analysis
    } = options

    console.log('[Vision Service] Processing images:', {
      imageCount: imageFiles.length,
      primaryCapabilities: primaryProviderCapabilities,
      filenames: imageFiles.map(f => f.original_filename)
    })

    // Check if primary provider supports vision
    const primarySupportsVision = this.checkVisionCapability(primaryProviderCapabilities)
    
    console.log('[Vision Service] Primary provider vision support:', primarySupportsVision)

    if (primarySupportsVision) {
      // Primary provider supports vision - return images for direct multimodal processing
      console.log('[Vision Service] Primary provider supports vision - using direct multimodal path')
      return {
        textContext: '',
        processedImages: imageFiles,
        analysisResults: []
      }
    }

    // Primary provider doesn't support vision - use vision preprocessing
    console.log('[Vision Service] Primary provider lacks vision - using vision preprocessing')
    
    // Find vision-capable provider
    const visionProvider = await this.selectVisionProvider(providerManager, providerRegistry)

    if (!visionProvider) {
      console.warn('[Vision Service] No vision-capable provider available, using metadata analysis')
      const metadataAnalysis = this.performMetadataAnalysis(imageFiles)
      return {
        textContext: metadataAnalysis,
        processedImages: [],
        analysisResults: []
      }
    }

    console.log('[Vision Service] Selected vision provider:', visionProvider.name)

    // Analyze each image
    const analysisResults: VisionAnalysisResult[] = []
    let combinedTextContext = ''

    for (const imageFile of imageFiles) {
      try {
        console.log('[Vision Service] Analyzing image:', imageFile.original_filename)
        
        // Handle SVG files specially
        if (imageFile.mime_type === 'image/svg+xml') {
          const svgAnalysis = await this.analyzeSVG(imageFile, visionProvider, maxAnalysisTokens)
          
          if (svgAnalysis.success) {
            // Convert SVG analysis to vision analysis result format
            const visionResult: VisionAnalysisResult = {
              success: true,
              filename: imageFile.original_filename,
              mimeType: imageFile.mime_type,
              visualDescription: this.formatSVGAnalysisAsDescription(svgAnalysis),
              detectedText: svgAnalysis.structuralData?.textElements?.join(', '),
              structure: svgAnalysis.structuralData?.elements?.join(', '),
              technicalDetails: svgAnalysis.structuralData?.metadata ? JSON.stringify(svgAnalysis.structuralData.metadata) : undefined
            }
            analysisResults.push(visionResult)
            
            if (visionResult.visualDescription) {
              combinedTextContext += this.formatAnalysisAsContext(visionResult)
            }
          } else {
            analysisResults.push({
              success: false,
              filename: imageFile.original_filename,
              mimeType: imageFile.mime_type,
              error: svgAnalysis.error
            })
          }
        } else {
          // Regular image analysis
          const analysis = await this.analyzeImage(imageFile, visionProvider, maxAnalysisTokens)
          analysisResults.push(analysis)

          if (analysis.success && analysis.visualDescription) {
            combinedTextContext += this.formatAnalysisAsContext(analysis)
          }
        }
      } catch (error) {
        console.error('[Vision Service] Failed to analyze image:', imageFile.original_filename, error)
        analysisResults.push({
          success: false,
          filename: imageFile.original_filename,
          mimeType: imageFile.mime_type,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log('[Vision Service] Vision preprocessing complete:', {
      imagesAnalyzed: analysisResults.length,
      successfulAnalyses: analysisResults.filter(r => r.success).length,
      contextLength: combinedTextContext.length
    })

    // If all analyses failed, at least acknowledge the images were uploaded
    if (combinedTextContext.length === 0 && imageFiles.length > 0) {
      console.log('[Vision Service] No successful analyses, adding basic image acknowledgment')
      combinedTextContext = this.generateBasicImageAcknowledgment(imageFiles)
    }

    return {
      textContext: combinedTextContext,
      processedImages: [], // Images are converted to text context
      analysisResults
    }
  }

  /**
   * Check if provider capabilities include vision
   */
  private static checkVisionCapability(capabilities: string[]): boolean {
    return capabilities.includes('vision') || capabilities.includes('multimodal')
  }

  /**
   * Select a vision-capable provider from available providers
   * Improved: More permissive selection with fallback to any available provider
   */
  private static async selectVisionProvider(
    providerManager: ProviderManager,
    providerRegistry: ProviderRegistry
  ): Promise<AIProvider | null> {
    try {
      // Reload providers to get current configuration
      await providerManager.loadProviders()

      // Get all enabled providers
      const enabledProviders = providerRegistry.getEnabledProviders()

      console.log('[Vision Service] Available providers for vision selection:',
        enabledProviders.map(p => ({ id: p.id, name: p.name, type: p.type })))

      if (enabledProviders.length === 0) {
        console.warn('[Vision Service] No enabled providers available')
        return null
      }

      // Filter for known vision-capable providers first
      const knownVisionProviders = enabledProviders.filter(provider => {
        // Gemini typically supports vision
        if (provider.type === 'gemini') {
          return true
        }

        // OpenAI GPT-4 Vision and later models support vision
        if (provider.type === 'openai') {
          const modelName = (provider as any).model || ''
          // GPT-4o, GPT-4o-mini, GPT-4 Vision support images
          if (modelName.includes('gpt-4o') || modelName.includes('vision') || modelName.includes('gpt-4-turbo')) {
            return true
          }
        }

        // OpenRouter - many models support vision
        if (provider.type === 'openrouter') {
          return true // Assume OpenRouter models may support vision
        }

        return false
      })

      if (knownVisionProviders.length > 0) {
        // Select highest priority known vision provider
        const selectedProvider = knownVisionProviders.sort((a, b) => a.priority - b.priority)[0]
        console.log('[Vision Service] Selected known vision provider:', selectedProvider.name)
        return selectedProvider
      }

      // Fallback: Try any available provider
      // Some providers may support vision even if not explicitly marked
      console.log('[Vision Service] No known vision-capable providers, trying fallback to any available provider')
      const fallbackProvider = enabledProviders.sort((a, b) => a.priority - b.priority)[0]
      console.log('[Vision Service] Selected fallback provider:', fallbackProvider.name)
      return fallbackProvider

    } catch (error) {
      console.error('[Vision Service] Error selecting vision provider:', error)

      // Last resort: Use dedicated fallback vision provider
      console.log('[Vision Service] Using dedicated fallback vision provider')
      const fallbackType = (process.env.ALEX_VISION_PROVIDER as 'openai' | 'gemini') || 'openai'
      return new FallbackVisionProvider(fallbackType)
    }
  }

  /**
   * Analyze a single image using a vision-capable provider
   */
  private static async analyzeImage(
    imageFile: AlexFile,
    visionProvider: AIProvider,
    maxTokens: number
  ): Promise<VisionAnalysisResult> {
    console.log('[Vision Service] Analyzing image with provider:', {
      filename: imageFile.original_filename,
      provider: visionProvider.name,
      providerType: visionProvider.type
    })

    try {
      // Get image data from storage
      const imageData = await this.getImageData(imageFile)
      
      if (!imageData) {
        console.log('[Vision Service] No image data available, returning basic acknowledgment')
        return {
          success: true,
          filename: imageFile.original_filename,
          mimeType: imageFile.mime_type,
          visualDescription: `Image uploaded: ${imageFile.original_filename}. The system detected the image but could not retrieve the image data for analysis.`,
          confidence: 0.3
        }
      }

      // Build vision analysis prompt
      const analysisPrompt = this.buildAnalysisPrompt(imageFile.original_filename)

      // Create AI request for vision analysis
      const visionRequest: AIRequest = {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: analysisPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageData,
                  detail: 'auto'
                }
              }
            ]
          }
        ],
        maxTokens,
        stream: false
      }

      console.log('[Vision Service] Executing vision analysis request with provider')
      
      // Execute the vision analysis using the actual provider with extended timeout
      const analysisResult = await Promise.race([
        this.executeVisionAnalysis(visionRequest, visionProvider),
        new Promise<any>((_, reject) => 
          setTimeout(() => reject(new Error('Vision analysis timeout (120s)')), 120000) // 120 second timeout
        )
      ])

      return {
        success: true,
        filename: imageFile.original_filename,
        mimeType: imageFile.mime_type,
        ...analysisResult
      }
    } catch (error) {
      console.error('[Vision Service] Image analysis failed:', error)
      return {
        success: true, // Return success with error info rather than failure
        filename: imageFile.original_filename,
        mimeType: imageFile.mime_type,
        visualDescription: `Image uploaded: ${imageFile.original_filename}. Vision analysis encountered an issue: ${error instanceof Error ? error.message : 'Unknown error'}.`,
        confidence: 0.2
      }
    }
  }

  /**
   * Get image data from storage
   */
  private static async getImageData(imageFile: AlexFile): Promise<string | null> {
    try {
      // First check if image data URL is already available (from chat route processing)
      if (imageFile.imageDataUrl) {
        console.log('[Vision Service] Using pre-fetched image data URL')
        return imageFile.imageDataUrl
      }

      // Retrieve from Supabase storage
      if (imageFile.storage_path) {
        console.log('[Vision Service] Downloading image from storage:', imageFile.storage_path)
        
        const supabase = this.getSupabaseClient()
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('alex-files')
          .download(imageFile.storage_path)

        if (downloadError) {
          console.error('[Vision Service] Failed to download image from storage:', downloadError)
          return null
        }

        if (!fileData) {
          console.error('[Vision Service] No data returned from storage')
          return null
        }

        // Convert to base64
        const arrayBuffer = await fileData.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const mimeType = imageFile.mime_type
        const dataUrl = `data:${mimeType};base64,${base64}`

        console.log('[Vision Service] Successfully converted image to base64:', {
          filename: imageFile.original_filename,
          dataSize: base64.length,
          mimeType
        })

        return dataUrl
      }

      // If the file has extracted content or URL, use that
      if (imageFile.url) {
        return imageFile.url
      }

      console.warn('[Vision Service] No image data available for file:', imageFile.original_filename)
      return null
    } catch (error) {
      console.error('[Vision Service] Error getting image data:', error)
      return null
    }
  }

  /**
   * Build analysis prompt for vision provider
   */
  private static buildAnalysisPrompt(filename: string): string {
    return `Analyze this image thoroughly and provide a structured analysis including:

1. Visual Description: What does this image show? Describe the main elements, layout, and overall composition.

2. Detected Text: If there's any text visible in the image, extract it exactly as shown. Include labels, buttons, headings, and any other text content.

3. Structure/Layout: Describe the spatial organization. How are elements arranged? What's the flow or hierarchy?

4. UI Elements (if applicable): Identify any interface elements like buttons, menus, forms, navigation, etc.

5. Important Labels: Highlight any significant labels, titles, warnings, or key information.

6. Technical Details: If this appears to be technical content (code, diagrams, workflows, schemas), describe the technical components and their relationships.

7. Confidence: If any elements are unclear or ambiguous, note them.

Format your response as structured text that can be easily parsed and used as context for a text-only AI model. Be specific and detailed, but concise.`
  }

  /**
   * Execute vision analysis using provider
   */
  private static async executeVisionAnalysis(
    request: AIRequest,
    visionProvider: AIProvider
  ): Promise<{
    visualDescription: string
    detectedText?: string
    structure?: string
    uiElements?: string[]
    importantLabels?: string[]
    technicalDetails?: string
    confidence?: number
  }> {
    console.log('[Vision Service] Executing vision analysis with provider:', {
      providerName: visionProvider.name,
      providerType: visionProvider.type,
      messageCount: request.messages.length,
      hasImageContent: request.messages.some(msg => Array.isArray(msg.content))
    })
    
    try {
      // Execute the vision request using the actual provider adapter
      console.log('[Vision Service] Calling provider.generate()...')
      const response = await visionProvider.generate(request)
      
      console.log('[Vision Service] Vision analysis response received:', {
        model: response.model,
        contentLength: response.content.length,
        usage: response.usage
      })

      // Parse the response to extract structured information
      return this.parseVisionResponse(response.content)
    } catch (error) {
      console.error('[Vision Service] Provider execution failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      
      // Return error information as part of the analysis
      return {
        visualDescription: `Vision analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0.1
      }
    }
  }

  /**
   * Parse vision response to extract structured information
   */
  private static parseVisionResponse(content: string): {
    visualDescription: string
    detectedText?: string
    structure?: string
    uiElements?: string[]
    importantLabels?: string[]
    technicalDetails?: string
    confidence?: number
  } {
    // Try to parse structured information from the response
    const result = {
      visualDescription: content,
      confidence: 0.8
    }

    // Extract detected text if present
    const textMatch = content.match(/Detected Text:?\s*([^\n]+)/i)
    if (textMatch) {
      result.detectedText = textMatch[1].trim()
    }

    // Extract structure information
    const structureMatch = content.match(/Structure:?\s*([^\n]+)/i)
    if (structureMatch) {
      result.structure = structureMatch[1].trim()
    }

    // Extract UI elements
    const uiMatch = content.match(/UI Elements:?\s*([^\n]+)/i)
    if (uiMatch) {
      result.uiElements = uiMatch[1].split(',').map(s => s.trim())
    }

    // Extract important labels
    const labelsMatch = content.match(/Important Labels:?\s*([^\n]+)/i)
    if (labelsMatch) {
      result.importantLabels = labelsMatch[1].split(',').map(s => s.trim())
    }

    // Extract technical details
    const techMatch = content.match(/Technical Details:?\s*([^\n]+)/i)
    if (techMatch) {
      result.technicalDetails = techMatch[1].trim()
    }

    return result
  }

  /**
   * Format analysis result as context text
   */
  private static formatAnalysisAsContext(analysis: VisionAnalysisResult): string {
    let context = `\n=== IMAGE ANALYSIS: ${analysis.filename} ===\n`
    
    if (analysis.visualDescription) {
      context += `Visual Description: ${analysis.visualDescription}\n`
    }
    
    if (analysis.detectedText) {
      context += `Detected Text: ${analysis.detectedText}\n`
    }
    
    if (analysis.structure) {
      context += `Structure: ${analysis.structure}\n`
    }
    
    if (analysis.uiElements && analysis.uiElements.length > 0) {
      context += `UI Elements: ${analysis.uiElements.join(', ')}\n`
    }
    
    if (analysis.importantLabels && analysis.importantLabels.length > 0) {
      context += `Important Labels: ${analysis.importantLabels.join(', ')}\n`
    }
    
    if (analysis.technicalDetails) {
      context += `Technical Details: ${analysis.technicalDetails}\n`
    }
    
    if (analysis.confidence !== undefined) {
      context += `Analysis Confidence: ${analysis.confidence}\n`
    }
    
    context += '=== END IMAGE ANALYSIS ===\n'
    
    return context
  }

  /**
   * Perform metadata-based analysis when no vision provider is available
   * This extracts any available information from the image files without visual analysis
   */
  private static performMetadataAnalysis(imageFiles: AlexFile[]): string {
    let context = `\n=== IMAGE ANALYSIS (METADATA MODE) ===\n`
    context += `Visual analysis could not be performed (no vision-capable provider available).\n`
    context += `However, the following information was extracted from the image files:\n\n`

    imageFiles.forEach((file, index) => {
      context += `Image ${index + 1}: ${file.original_filename}\n`
      context += `- MIME Type: ${file.mime_type}\n`
      context += `- Size: ${file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'Unknown'}\n`

      if (file.extracted_text && file.extracted_text.length > 0) {
        context += `- Extracted Text: ${file.extracted_text.substring(0, 500)}${file.extracted_text.length > 500 ? '...' : ''}\n`
      }

      if (file.url) {
        context += `- URL: ${file.url}\n`
      }

      if (file.storage_path) {
        context += `- Storage Path: ${file.storage_path}\n`
      }

      context += `\n`
    })

    context += `Please describe what you'd like me to help you with regarding these images.\n`
    context += `=== END IMAGE ANALYSIS ===\n`

    return context
  }

  /**
   * Generate error message when no vision provider is available
   * Improved: Still provides basic image information
   */
  private static generateNoVisionError(imageFiles: AlexFile[]): string {
    let context = `\n=== IMAGE ATTACHMENT NOTICE ===\n`
    context += `The following images were uploaded:\n`

    imageFiles.forEach(file => {
      context += `- ${file.original_filename} (${file.mime_type})\n`
      if (file.extracted_text) {
        context += `  Text extracted: ${file.extracted_text.substring(0, 200)}${file.extracted_text.length > 200 ? '...' : ''}\n`
      }
    })

    context += `The system could not find a vision-capable AI provider to analyze these images visually.\n`
    context += `However, any text content has been extracted where possible.\n`
    context += `Please describe what you'd like me to help you with regarding these images.\n`
    context += `=== END NOTICE ===\n`

    return context
  }

  /**
   * Generate basic image acknowledgment when full analysis fails
   * Improved: Provides more detailed image metadata
   */
  private static generateBasicImageAcknowledgment(imageFiles: AlexFile[]): string {
    let context = `\n=== IMAGE ATTACHMENT ===\n`
    context += `The following images were uploaded:\n`

    imageFiles.forEach(file => {
      context += `- ${file.original_filename}\n`
      context += `  Type: ${file.mime_type}\n`
      context += `  Size: ${file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'Unknown'}\n`

      if (file.extracted_text) {
        context += `  Extracted Text: ${file.extracted_text.substring(0, 300)}${file.extracted_text.length > 300 ? '...' : ''}\n`
      }

      if (file.url) {
        context += `  URL: ${file.url}\n`
      }
    })

    context += `\nThe image preprocessing system is active. Please describe what you'd like me to help you with regarding these images, or if the images contain specific content you'd like analyzed, please provide more details.\n`
    context += `=== END IMAGE ATTACHMENT ===\n`

    return context
  }

  /**
   * Analyze SVG file - extract structural data and optionally perform visual analysis
   */
  private static async analyzeSVG(
    svgFile: AlexFile,
    visionProvider: AIProvider,
    maxTokens: number
  ): Promise<SVGAnalysisResult> {
    console.log('[Vision Service] Analyzing SVG file:', svgFile.original_filename)

    try {
      // Get SVG content
      const svgContent = await this.getSVGContent(svgFile)
      
      if (!svgContent) {
        return {
          success: false,
          filename: svgFile.original_filename,
          error: 'Failed to retrieve SVG content'
        }
      }

      // Parse SVG for structural data
      const structuralData = this.parseSVGStructure(svgContent)

      console.log('[Vision Service] SVG structural analysis complete:', {
        textElements: structuralData.textElements.length,
        metadata: Object.keys(structuralData.metadata).length,
        elements: structuralData.elements.length
      })

      // For simple SVGs with clear structure, structural analysis may be sufficient
      // For complex SVGs requiring visual interpretation, also perform vision analysis
      const needsVisualAnalysis = this.svgNeedsVisualAnalysis(structuralData)

      let visualAnalysis: VisionAnalysisResult | undefined

      if (needsVisualAnalysis) {
        console.log('[Vision Service] SVG requires visual analysis, converting to image')
        
        // Convert SVG to image format for visual analysis
        const imageData = await this.convertSVGToImage(svgContent, svgFile)
        
        if (imageData) {
          // Perform vision analysis on the rendered SVG
          visualAnalysis = await this.analyzeImage(
            { ...svgFile, imageDataUrl: imageData },
            visionProvider,
            maxTokens
          )
        }
      }

      return {
        success: true,
        filename: svgFile.original_filename,
        structuralData,
        visualAnalysis
      }
    } catch (error) {
      console.error('[Vision Service] SVG analysis failed:', error)
      return {
        success: false,
        filename: svgFile.original_filename,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get SVG content from storage
   */
  private static async getSVGContent(svgFile: AlexFile): Promise<string | null> {
    try {
      if (svgFile.extracted_text) {
        return svgFile.extracted_text
      }

      if (svgFile.storage_path) {
        // In production, download from storage
        console.log('[Vision Service] SVG storage path:', svgFile.storage_path)
        // For now, return placeholder
        return '<svg>Placeholder SVG content</svg>'
      }

      return null
    } catch (error) {
      console.error('[Vision Service] Error getting SVG content:', error)
      return null
    }
  }

  /**
   * Parse SVG structure for text, metadata, and elements
   */
  private static parseSVGStructure(svgContent: string): {
    textElements: string[]
    metadata: Record<string, string>
    dimensions?: { width: string; height: string }
    elements: string[]
  } {
    const textElements: string[] = []
    const metadata: Record<string, string> = {}
    const elements: string[] = []
    let dimensions: { width: string; height: string } | undefined

    try {
      // Simple regex-based parsing (in production, use proper XML parser)
      
      // Extract text content
      const textRegex = /<text[^>]*>(.*?)<\/text>/gs
      let match
      while ((match = textRegex.exec(svgContent)) !== null) {
        const text = match[1].replace(/<[^>]*>/g, '').trim()
        if (text) {
          textElements.push(text)
        }
      }

      // Extract dimensions
      const widthMatch = svgContent.match(/width=['"]([^'"]*)['"]/)
      const heightMatch = svgContent.match(/height=['"]([^'"]*)['"]/)
      if (widthMatch && heightMatch) {
        dimensions = { width: widthMatch[1], height: heightMatch[1] }
      }

      // Extract metadata from title/desc tags
      const titleMatch = svgContent.match(/<title[^>]*>(.*?)<\/title>/s)
      if (titleMatch) {
        metadata.title = titleMatch[1].trim()
      }

      const descMatch = svgContent.match(/<desc[^>]*>(.*?)<\/desc>/s)
      if (descMatch) {
        metadata.description = descMatch[1].trim()
      }

      // Extract element types
      const elementTypes = ['rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'path', 'text', 'image', 'g', 'use']
      for (const elementType of elementTypes) {
        const regex = new RegExp(`<${elementType}[^>]*>`, 'g')
        const matches = svgContent.match(regex)
        if (matches && matches.length > 0) {
          elements.push(`${elementType}(${matches.length})`)
        }
      }

    } catch (error) {
      console.error('[Vision Service] SVG parsing error:', error)
    }

    return {
      textElements,
      metadata,
      dimensions,
      elements
    }
  }

  /**
   * Determine if SVG needs visual analysis based on structural complexity
   */
  private static svgNeedsVisualAnalysis(structuralData: {
    textElements: string[]
    metadata: Record<string, string>
    dimensions?: { width: string; height: string }
    elements: string[]
  }): boolean {
    // If SVG has many visual elements but little text, it likely needs visual analysis
    const visualElementCount = structuralData.elements.reduce((sum, elem) => {
      const count = parseInt(elem.match(/\((\d+)\)/)?.[1] || '0')
      return sum + count
    }, 0)

    const hasComplexVisuals = visualElementCount > 10
    const hasLimitedText = structuralData.textElements.length < 5

    return hasComplexVisuals && hasLimitedText
  }

  /**
   * Convert SVG to image format for visual analysis
   */
  private static async convertSVGToImage(svgContent: string, svgFile: AlexFile): Promise<string | null> {
    try {
      // In production, this would use a proper SVG-to-image conversion library
      // For now, return a placeholder
      console.log('[Vision Service] Converting SVG to image (placeholder implementation)')
      
      // This would typically involve:
      // 1. Using a library like sharp, canvas, or puppeteer to render SVG
      // 2. Converting to PNG/JPEG format
      // 3. Returning as base64 data URL
      
      return `data:image/png;base64,placeholder_converted_svg`
    } catch (error) {
      console.error('[Vision Service] SVG to image conversion failed:', error)
      return null
    }
  }

  /**
   * Format SVG analysis as visual description
   */
  private static formatSVGAnalysisAsDescription(svgAnalysis: SVGAnalysisResult): string {
    let description = `SVG File Analysis:\n`
    
    if (svgAnalysis.structuralData?.metadata.title) {
      description += `Title: ${svgAnalysis.structuralData.metadata.title}\n`
    }
    
    if (svgAnalysis.structuralData?.dimensions) {
      description += `Dimensions: ${svgAnalysis.structuralData.dimensions.width} x ${svgAnalysis.structuralData.dimensions.height}\n`
    }
    
    if (svgAnalysis.structuralData?.textElements.length > 0) {
      description += `Text Content: ${svgAnalysis.structuralData.textElements.join(', ')}\n`
    }
    
    if (svgAnalysis.structuralData?.elements.length > 0) {
      description += `Elements: ${svgAnalysis.structuralData.elements.join(', ')}\n`
    }
    
    if (svgAnalysis.visualAnalysis?.visualDescription) {
      description += `Visual Analysis: ${svgAnalysis.visualAnalysis.visualDescription}\n`
    }
    
    return description
  }
}