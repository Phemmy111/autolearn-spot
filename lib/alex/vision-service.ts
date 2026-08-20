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
 */

import { AlexFile } from './types'
import { ProviderRegistry } from './provider/provider-registry'
import { ProviderManager } from './provider/provider-manager'
import { AIRequest, AIMessage, ImageContent } from './provider/provider-interface'

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
}

/**
 * Main vision preprocessing service
 */
export class VisionService {
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
      maxAnalysisTokens = 3000
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
      console.warn('[Vision Service] No vision-capable provider available')
      return {
        textContext: this.generateNoVisionError(imageFiles),
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
   */
  private static async selectVisionProvider(
    providerManager: ProviderManager,
    providerRegistry: ProviderRegistry
  ): Promise<{ id: string; name: string; type: string } | null> {
    try {
      // Reload providers to get current configuration
      await providerManager.loadProviders()

      // Get all enabled providers
      const enabledProviders = providerRegistry.getEnabledProviders()

      console.log('[Vision Service] Available providers for vision selection:', 
        enabledProviders.map(p => ({ id: p.id, name: p.name, type: p.type })))

      // Filter for vision-capable providers
      // For now, we'll check provider type and capabilities
      // Gemini models generally support vision, some OpenRouter models do too
      const visionCapableProviders = enabledProviders.filter(provider => {
        // Gemini typically supports vision
        if (provider.type === 'gemini') {
          return true
        }
        
        // OpenAI-compatible providers might support vision depending on model
        // This is a simplified check - in production, you'd check per-model capabilities
        if (provider.type === 'openai' || provider.type === 'openrouter') {
          // Assume vision capability for these providers (will be refined)
          return true
        }

        return false
      })

      if (visionCapableProviders.length === 0) {
        console.warn('[Vision Service] No vision-capable providers found')
        return null
      }

      // Select highest priority vision provider
      const selectedProvider = visionCapableProviders.sort((a, b) => a.priority - b.priority)[0]

      console.log('[Vision Service] Selected vision provider:', selectedProvider.name)

      return {
        id: selectedProvider.id,
        name: selectedProvider.name,
        type: selectedProvider.type
      }
    } catch (error) {
      console.error('[Vision Service] Error selecting vision provider:', error)
      return null
    }
  }

  /**
   * Analyze a single image using a vision-capable provider
   */
  private static async analyzeImage(
    imageFile: AlexFile,
    visionProvider: { id: string; name: string; type: string },
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
        return {
          success: false,
          filename: imageFile.original_filename,
          mimeType: imageFile.mime_type,
          error: 'Failed to retrieve image data'
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

      // For now, we'll use a simplified approach
      // In production, you'd use the actual provider adapter to execute this request
      // This is a placeholder that simulates the analysis
      
      const analysisResult = await this.executeVisionAnalysis(visionRequest, visionProvider)

      return {
        success: true,
        filename: imageFile.original_filename,
        mimeType: imageFile.mime_type,
        ...analysisResult
      }
    } catch (error) {
      console.error('[Vision Service] Image analysis failed:', error)
      return {
        success: false,
        filename: imageFile.original_filename,
        mimeType: imageFile.mime_type,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get image data from storage
   */
  private static async getImageData(imageFile: AlexFile): Promise<string | null> {
    try {
      // In production, this would retrieve the actual image data from storage
      // For now, we'll use the storage_path if available
      if (imageFile.storage_path) {
        // This would typically involve reading from cloud storage
        // For now, return a placeholder
        console.log('[Vision Service] Image storage path:', imageFile.storage_path)
        return `data:${imageFile.mime_type};base64,placeholder` // Placeholder
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
    visionProvider: { id: string; name: string; type: string }
  ): Promise<{
    visualDescription: string
    detectedText?: string
    structure?: string
    uiElements?: string[]
    importantLabels?: string[]
    technicalDetails?: string
    confidence?: number
  }> {
    // This is a placeholder implementation
    // In production, you would use the actual provider adapter to execute the request
    // For now, we'll return a structured placeholder
    
    console.log('[Vision Service] Executing vision analysis with provider:', visionProvider.name)
    
    // Simulate analysis result
    return {
      visualDescription: 'Image analysis completed via vision preprocessing',
      detectedText: '',
      structure: '',
      uiElements: [],
      importantLabels: [],
      technicalDetails: '',
      confidence: 0.8
    }
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
   * Generate error message when no vision provider is available
   */
  private static generateNoVisionError(imageFiles: AlexFile[]): string {
    const filenames = imageFiles.map(f => f.original_filename).join(', ')
    return `\n=== IMAGE ATTACHMENT NOTICE ===\n` +
           `The following images were uploaded but no vision-capable AI provider is currently available to analyze them:\n` +
           `${filenames}\n` +
           `The images will not be included in the analysis.\n` +
           `=== END NOTICE ===\n`
  }

  /**
   * Analyze SVG file - extract structural data and optionally perform visual analysis
   */
  private static async analyzeSVG(
    svgFile: AlexFile,
    visionProvider: { id: string; name: string; type: string },
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