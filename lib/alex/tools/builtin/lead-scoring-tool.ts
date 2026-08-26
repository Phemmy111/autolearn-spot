/**
 * Lead Scoring Tool - AI-powered lead evaluation
 * 
 * This tool evaluates lead/submission data using AI to determine quality scores.
 * The AI independently determines the score (0-100) based on available information.
 * No hard-coded qualification formulas - AI evaluates the complete context.
 */

import { ToolDefinition, ToolExecutor, ToolExecutionContext } from '../../types'
import { WorkflowAIService } from '../../artifact-generation/workflow-ai-service'

export interface LeadScoringResponse {
  score: number
  reasoning: string
  positive_factors?: string[]
  concerns?: string[]
  confidence?: number
}

export const leadScoringToolDefinition: ToolDefinition = {
  name: 'lead_scoring',
  description: 'Evaluate a lead or form submission to determine quality score (0-100). The AI independently assesses the lead based on available information without using fixed qualification formulas. Returns structured score with reasoning.',
  inputSchema: {
    type: 'object',
    required: ['leadData'],
    properties: {
      leadData: {
        type: 'object',
        description: 'Lead/form submission data as key-value pairs (e.g., name, company, budget, timeline, requirements, etc.)',
        additionalProperties: true
      }
    }
  },
  outputSchema: {
    type: 'object',
    required: ['score', 'reasoning'],
    properties: {
      score: {
        type: 'integer',
        minimum: 0,
        maximum: 100,
        description: 'Lead quality score from 0-100'
      },
      reasoning: {
        type: 'string',
        description: 'Concise explanation of the score based on evidence in the submission'
      },
      positive_factors: {
        type: 'array',
        items: { type: 'string' },
        description: 'Factors that make this lead strong'
      },
      concerns: {
        type: 'array',
        items: { type: 'string' },
        description: 'Factors that might prevent conversion'
      },
      confidence: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Confidence in the score assessment (0-1)'
      }
    }
  },
  category: 'computation',
  permissions: [],
  enabled: true,
  timeoutMs: 15000 // 15 second timeout
}

export const leadScoringToolExecutor: ToolExecutor = {
  name: 'lead_scoring',
  async execute(args: Record<string, any>, context: ToolExecutionContext): Promise<LeadScoringResponse> {
    const { leadData } = args

    if (!leadData || typeof leadData !== 'object') {
      throw new Error('leadData is required and must be an object')
    }

    // Build compact prompt with lead data
    const leadDataString = JSON.stringify(leadData, null, 2)
    const prompt = `You are evaluating a lead or form submission to determine its quality score.

SCORING RANGE: 0-100
- Higher scores indicate stronger overall lead quality/potential
- Lower scores indicate weaker leads or insufficient information

IMPORTANT RULES:
1. Evaluate ONLY the evidence contained in the supplied lead data
2. Do NOT invent information that is not provided
3. Do NOT use fixed qualification formulas (e.g., budget > X = points)
4. Consider the complete context: requirements, timeline, budget, company size, decision-making authority, urgency, etc.
5. Acknowledge when information is insufficient for confident scoring

LEAD DATA:
${leadDataString}

Return your evaluation as valid JSON with this exact structure:
{
  "score": <integer 0-100>,
  "reasoning": "<concise explanation of the score based on evidence>",
  "positive_factors": ["<factor1>", "<factor2>"],
  "concerns": ["<concern1>", "<concern2>"],
  "confidence": <0-1>
}

Return ONLY the JSON. No markdown, no code blocks, no explanations outside the JSON.`

    try {
      // Use existing WorkflowAIService for AI call (reuses provider infrastructure)
      const aiService = WorkflowAIService.getInstance()
      const response = await aiService.generateResponse(prompt)

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('AI response did not contain valid JSON')
      }

      const parsed = JSON.parse(jsonMatch[0])

      // Validate response structure
      const validated = this.validateLeadScoringResponse(parsed)

      console.log('[Lead Scoring Tool] Successfully scored lead:', {
        score: validated.score,
        reasoningLength: validated.reasoning.length,
        hasPositiveFactors: !!validated.positive_factors,
        hasConcerns: !!validated.concerns,
        confidence: validated.confidence
      })

      return validated
    } catch (error) {
      console.error('[Lead Scoring Tool] Failed to score lead:', error)
      throw new Error(`Lead scoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  /**
   * Validate lead scoring response structure and values
   */
  validateLeadScoringResponse(data: any): LeadScoringResponse {
    // Validate score
    if (typeof data.score !== 'number' || !Number.isInteger(data.score)) {
      throw new Error('Score must be an integer')
    }
    if (data.score < 0 || data.score > 100) {
      throw new Error('Score must be between 0 and 100')
    }

    // Validate reasoning
    if (typeof data.reasoning !== 'string' || data.reasoning.trim().length === 0) {
      throw new Error('Reasoning is required and must be non-empty')
    }

    // Validate positive_factors if present
    if (data.positive_factors !== undefined) {
      if (!Array.isArray(data.positive_factors)) {
        throw new Error('positive_factors must be an array')
      }
      if (!data.positive_factors.every((f: any) => typeof f === 'string')) {
        throw new Error('positive_factors must contain only strings')
      }
    }

    // Validate concerns if present
    if (data.concerns !== undefined) {
      if (!Array.isArray(data.concerns)) {
        throw new Error('concerns must be an array')
      }
      if (!data.concerns.every((c: any) => typeof c === 'string')) {
        throw new Error('concerns must contain only strings')
      }
    }

    // Validate confidence if present
    if (data.confidence !== undefined) {
      if (typeof data.confidence !== 'number') {
        throw new Error('confidence must be a number')
      }
      if (data.confidence < 0 || data.confidence > 1) {
        throw new Error('confidence must be between 0 and 1')
      }
    }

    return {
      score: data.score,
      reasoning: data.reasoning.trim(),
      positive_factors: data.positive_factors,
      concerns: data.concerns,
      confidence: data.confidence
    }
  }
}