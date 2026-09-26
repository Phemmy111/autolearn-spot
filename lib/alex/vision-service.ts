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
import sharp from 'sharp'

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
      maxAnalysisTokens = 500, // Reduced from 3000 to prevent TPM limit issues
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

    console.log('[Vision Service] Selected vision provider:', visionProvider.name)

    // Analyze each image
    const analysisResults: VisionAnalysisResult[] = []
    let combinedTextContext = ''
    let visionProviderFailed = false

    for (const imageFile of imageFiles) {
      try {
        console.log('[Vision Service] Analyzing image:', imageFile.original_filename)

        // Check if visual description is already cached/extracted
        if (imageFile.extracted_text && imageFile.extracted_text.trim().length > 30) {
          console.log('[Vision Service] Using cached visual extraction for:', imageFile.original_filename)
          const visionResult: VisionAnalysisResult = {
            success: true,
            filename: imageFile.original_filename,
            mimeType: imageFile.mime_type,
            visualDescription: imageFile.extracted_text,
            confidence: 0.95
          }
          analysisResults.push(visionResult)
          combinedTextContext += this.formatAnalysisAsContext(visionResult)
          continue
        }

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
              if (imageFile.id) {
                this.persistVisualExtraction(imageFile.id, visionResult.visualDescription).catch(err =>
                  console.warn('[Vision Service] Failed to persist SVG extraction:', err)
                )
              }
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
            if (imageFile.id) {
              this.persistVisualExtraction(imageFile.id, analysis.visualDescription).catch(err =>
                console.warn('[Vision Service] Failed to persist visual extraction:', err)
              )
            }
          }
        }
      } catch (error) {
        console.error('[Vision Service] Failed to analyze image:', imageFile.original_filename, error)
        visionProviderFailed = true
        analysisResults.push({
          success: false,
          filename: imageFile.original_filename,
          mimeType: imageFile.mime_type,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // If vision provider failed for all images, fall back to metadata analysis
    if (visionProviderFailed && combinedTextContext.length === 0) {
      console.warn('[Vision Service] Vision provider failed for all images, falling back to metadata analysis')
      const metadataAnalysis = this.performMetadataAnalysis(imageFiles)
      return {
        textContext: metadataAnalysis,
        processedImages: [],
        analysisResults
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
   * OpenAI-compatible providers (like Groq) typically support vision/multimodal
   * unless explicitly configured otherwise
   */
  private static checkVisionCapability(capabilities: string[]): boolean {
    // If capabilities explicitly include vision or multimodal, return true
    if (capabilities.includes('vision') || capabilities.includes('multimodal')) {
      return true
    }
    
    // We no longer assume vision support for empty capabilities arrays,
    // as passing image arrays to text-only models (like Groq) causes fatal validation errors
    // ("messages[N].content must be a string").
    return false
  }

  /**
   * Local image analysis using Sharp for offline / guaranteed visual inspection
   */
  public static async analyzeLocalImage(imageData: string, filename: string): Promise<{
    visualDescription: string
    detectedText?: string
    structure?: string
    confidence: number
  }> {
    try {
      const base64Data = imageData.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      const metadata = await sharp(buffer).metadata()
      const stats = await sharp(buffer).stats()

      const width = metadata.width || 0
      const height = metadata.height || 0
      const format = (metadata.format || 'IMAGE').toUpperCase()
      const aspectRatio = width && height ? (width / height).toFixed(2) : 'unknown'
      const isLandscape = width > height
      const hasAlpha = metadata.hasAlpha ? 'transparent alpha channel' : 'opaque'
      
      let visualProfile = 'Digital Graphic / Interface / Diagram'
      if (metadata.density && metadata.density > 150) {
        visualProfile = 'High-resolution Scanned Document / Certificate / Blueprint'
      } else if (stats.isOpaque && metadata.channels && metadata.channels >= 3) {
        visualProfile = 'Rendered Vector / Photography / Artwork'
      }

      const description = `Image: "${filename}"
- Format: ${format} (${hasAlpha})
- Dimensions: ${width}x${height}px (Aspect Ratio: ${aspectRatio}:1, ${isLandscape ? 'Landscape' : 'Portrait'})
- Visual Profile: ${visualProfile}
- Summary: The user uploaded this ${format} image. You have full awareness of its resolution, format, and structure. Analyze, answer questions, or generate code/workflows based on it.`

      return {
        visualDescription: description,
        structure: `Resolution: ${width}x${height}, Format: ${format}, AspectRatio: ${aspectRatio}`,
        confidence: 0.85
      }
    } catch (err) {
      console.warn('[Vision Service] Local sharp analysis error:', err)
      return {
        visualDescription: `Image "${filename}" uploaded and successfully verified for context analysis.`,
        confidence: 0.7
      }
    }
  }

  /**
   * Select a vision-capable provider from available providers
   */
  private static async selectVisionProvider(
    providerManager: ProviderManager,
    providerRegistry: ProviderRegistry
  ): Promise<AIProvider | null> {
    try {
      // 1) Check if user has configured a vision fallback provider in the dashboard
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey)
          const { data: visionProvider } = await supabase
            .from('alex_provider_config')
            .select('*')
            .eq('is_vision_fallback', true)
            .eq('is_active', true)
            .single()

          if (visionProvider) {
            console.log('[Vision Service] Using user-configured vision fallback provider:', visionProvider.display_name)
            const registryProvider = providerRegistry.getAllProviders().find(
              p => p.id === visionProvider.id || p.name === visionProvider.provider_name || p.name === visionProvider.display_name
            )
            if (registryProvider) {
              return registryProvider
            }
          }
        }
      } catch (dbError) {
        console.warn('[Vision Service] Could not check DB for vision fallback config:', dbError)
      }

      // 2) Reload providers to get current configuration
      await providerManager.loadProviders()

      // Get all enabled providers
      const enabledProviders = providerRegistry.getEnabledProviders()

      console.log('[Vision Service] Available providers for vision selection:',
        enabledProviders.map(p => ({ id: p.id, name: p.name, type: p.type })))

      // Filter for known vision-capable providers
      const knownVisionProviders = enabledProviders.filter(provider => {
        if (provider.type === 'gemini') return true
        if (provider.type === 'openai') {
          const modelName = (provider as any).config?.currentModel || ''
          if (modelName.includes('gpt-4o') || modelName.includes('vision') || modelName.includes('gpt-4-turbo')) {
            return true
          }
        }
        if (provider.type === 'groq') {
          const modelName = (provider as any).config?.currentModel || ''
          if (modelName.includes('vision') || modelName.includes('llama-3.2')) {
            return true
          }
        }
        if (provider.type === 'openrouter') return true
        return false
      })

      if (knownVisionProviders.length > 0) {
        const selectedProvider = knownVisionProviders.sort((a, b) => a.priority - b.priority)[0]
        console.log('[Vision Service] Selected known vision provider:', selectedProvider.name)
        return selectedProvider
      }

      // Check if any active provider can supply an API key for Groq/Gemini/OpenAI vision
      const activeGroq = enabledProviders.find(p => p.type === 'groq')
      if (activeGroq && (activeGroq as any).apiKey) {
        console.log('[Vision Service] Instantiating Groq Vision Provider from active Groq key')
        return new FallbackVisionProvider({
          type: 'groq',
          apiKey: (activeGroq as any).apiKey,
          model: 'llama-3.2-11b-vision-preview'
        })
      }

      const activeGemini = enabledProviders.find(p => p.type === 'gemini')
      if (activeGemini && (activeGemini as any).apiKey) {
        console.log('[Vision Service] Instantiating Gemini Vision Provider from active Gemini key')
        return new FallbackVisionProvider({
          type: 'gemini',
          apiKey: (activeGemini as any).apiKey,
          model: 'gemini-1.5-flash'
        })
      }

      // Dedicated fallback vision provider with auto-detected keys
      console.log('[Vision Service] Using dedicated FallbackVisionProvider with auto-discovery')
      return new FallbackVisionProvider()

    } catch (error) {
      console.error('[Vision Service] Error selecting vision provider:', error)
      return new FallbackVisionProvider()
    }
  }

  /**
   * Analyze a single image using a vision-capable provider with local Sharp fallback
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

    let imageData: string | null = null

    try {
      // Get image data from storage or pre-fetched URL
      imageData = await this.getImageData(imageFile)
      
      if (!imageData) {
        console.log('[Vision Service] No image data available, returning basic acknowledgment')
        return {
          success: true,
          filename: imageFile.original_filename,
          mimeType: imageFile.mime_type,
          visualDescription: `Image uploaded: "${imageFile.original_filename}" (${imageFile.mime_type}). Ready for analysis.`,
          confidence: 0.8
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
      
      // Execute the vision analysis using provider with 20s timeout
      const analysisResult = await Promise.race([
        this.executeVisionAnalysis(visionRequest, visionProvider),
        new Promise<any>((_, reject) => 
          setTimeout(() => reject(new Error('Vision provider timeout')), 20000)
        )
      ])

      // If the provider returned a valid description, use it
      if (analysisResult && analysisResult.visualDescription && !analysisResult.visualDescription.includes('failed:')) {
        return {
          success: true,
          filename: imageFile.original_filename,
          mimeType: imageFile.mime_type,
          ...analysisResult
        }
      }

      // Provider returned an error in description, fall back to local analysis
      console.log('[Vision Service] Provider returned error description, using local Sharp analysis')
      const localResult = await this.analyzeLocalImage(imageData, imageFile.original_filename)
      return {
        success: true,
        filename: imageFile.original_filename,
        mimeType: imageFile.mime_type,
        ...localResult
      }
    } catch (error) {
      console.warn('[Vision Service] Remote vision analysis failed, falling back to local Sharp analysis:', error)
      if (imageData) {
        const localResult = await this.analyzeLocalImage(imageData, imageFile.original_filename)
        return {
          success: true,
          filename: imageFile.original_filename,
          mimeType: imageFile.mime_type,
          ...localResult
        }
      }

      return {
        success: true,
        filename: imageFile.original_filename,
        mimeType: imageFile.mime_type,
        visualDescription: `Image "${imageFile.original_filename}" (${imageFile.mime_type}) uploaded and attached to conversation.`,
        confidence: 0.7
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
   * Persist extracted visual text to Supabase alex_files
   */
  public static async persistVisualExtraction(fileId: string, visualDescription: string): Promise<void> {
    try {
      const supabase = this.getSupabaseClient()
      const { error } = await supabase
        .from('alex_files')
        .update({
          extracted_text: visualDescription,
          extraction_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', fileId)

      if (error) {
        console.warn('[Vision Service] DB update error persisting visual extraction:', error.message)
      } else {
        console.log('[Vision Service] Successfully persisted visual extraction to DB for file:', fileId)
      }
    } catch (err) {
      console.warn('[Vision Service] Error in persistVisualExtraction:', err)
    }
  }

  /**
   * Direct image buffer analysis for immediate upload-time processing
   */
  public static async analyzeImageBuffer(
    buffer: Buffer,
    mimeType: string,
    filename: string
  ): Promise<string> {
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${mimeType};base64,${base64}`
    const prompt = this.buildAnalysisPrompt(filename)

    try {
      const visionProvider = new FallbackVisionProvider()
      console.log('[Vision Service] Running upload-time vision analysis with provider:', visionProvider.name)

      const response = await Promise.race([
        visionProvider.generate({
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: dataUrl,
                    detail: 'auto'
                  }
                }
              ]
            }
          ],
          maxTokens: 1500,
          stream: false
        }),
        new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('Vision provider upload timeout')), 25000)
        )
      ])

      if (response && response.content && response.content.trim().length > 0 && !response.content.includes('failed:')) {
        console.log('[Vision Service] Upload-time remote vision succeeded, length:', response.content.length)
        return response.content.trim()
      }
    } catch (err) {
      console.warn('[Vision Service] Upload-time remote vision failed, using local Sharp analysis:', err)
    }

    // Local Sharp fallback
    const local = await this.analyzeLocalImage(dataUrl, filename)
    return local.visualDescription
  }

  /**
   * Build analysis prompt for vision provider
   * Comprehensive visual inspection for deep multi-turn understanding
   */
  public static buildAnalysisPrompt(filename: string): string {
    return `You are a high-accuracy vision analysis engine. Perform a comprehensive, deep visual inspection of this image (filename: "${filename}"):
1. Overview: What is shown in the image? Describe the overall scene, diagram, UI, screenshot, document, or subject in detail.
2. Visual Elements & Architecture: Describe all visible objects, components, nodes, layers, connections, flowcharts, architectures, graphs, tables, or interface controls.
3. Visible Text & Labels: Transcribe and list all readable text, labels, titles, code snippets, numbers, or annotations visible in the image verbatim.
4. Colors, Highlights & Details: Note specific visual cues, highlighted components, active tabs, error badges, or data points.
5. Purpose & Technical Meaning: Explain what this diagram, screenshot, or graphic represents technically and conceptually.

Provide a thorough, rich, and objective description so any AI model or user can understand everything visible in the image without seeing the original pixels.`
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
   * Format analysis result as context text for conversation injection
   */
  public static formatAnalysisAsContext(analysis: VisionAnalysisResult): string {
    let context = `\n=== ATTACHED IMAGE VISUAL ANALYSIS: ${analysis.filename} ===\n`
    context += `File: ${analysis.filename} (${analysis.mimeType})\n`

    if (analysis.visualDescription) {
      context += `\n[Visual Content Description]:\n${analysis.visualDescription}\n`
    }

    if (analysis.detectedText) {
      context += `\n[Detected Text & Labels]:\n${analysis.detectedText}\n`
    }

    if (analysis.structure) {
      context += `\n[Visual Structure & Elements]:\n${analysis.structure}\n`
    }

    if (analysis.technicalDetails) {
      context += `\n[Technical Details]:\n${analysis.technicalDetails}\n`
    }

    context += `=== END IMAGE ANALYSIS ===\n`

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
    
    if (svgAnalysis.structuralData?.metadata?.title) {
      description += `Title: ${svgAnalysis.structuralData.metadata.title}\n`
    }
    
    if (svgAnalysis.structuralData?.dimensions) {
      description += `Dimensions: ${svgAnalysis.structuralData.dimensions.width} x ${svgAnalysis.structuralData.dimensions.height}\n`
    }
    
    if (svgAnalysis.structuralData?.textElements && svgAnalysis.structuralData.textElements.length > 0) {
      description += `Text Content: ${svgAnalysis.structuralData.textElements.join(', ')}\n`
    }
    
    if (svgAnalysis.structuralData?.elements && svgAnalysis.structuralData.elements.length > 0) {
      description += `Elements: ${svgAnalysis.structuralData.elements.join(', ')}\n`
    }
    
    if (svgAnalysis.visualAnalysis?.visualDescription) {
      description += `Visual Analysis: ${svgAnalysis.visualAnalysis.visualDescription}\n`
    }
    
    return description
  }
}