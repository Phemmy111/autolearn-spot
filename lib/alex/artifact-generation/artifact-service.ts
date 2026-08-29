/**
 * ALEX Phase 7: Artifact Generation Service
 * Manages the build workflow from requirement gathering to artifact delivery
 */

import { createClient } from '@supabase/supabase-js'
import { 
  ArtifactBuild, 
  GeneratedArtifact, 
  ArtifactQuestion, 
  BuildStatus, 
  BuildType,
  ArtifactManifest,
  ValidationResult,
  QuestionOption
} from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables for artifact service')
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export class ArtifactService {
  /**
   * Create a new artifact build
   */
  static async createBuild(
    conversationId: string,
    userId: string,
    originalRequest: string,
    buildType: BuildType
  ): Promise<ArtifactBuild> {
    const { data, error } = await getSupabaseClient()
      .from('alex_artifact_builds')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        build_type: buildType,
        status: 'collecting_requirements',
        original_request: originalRequest,
        requirements_collected: {},
        missing_requirements: [],
        confirmation_granted: false
      })
      .select()
      .single()

    if (error) {
      console.error('[Artifact Service] Failed to create build:', error)
      throw new Error(`Failed to create artifact build: ${error.message}`)
    }

    console.log('[Artifact Service] Build created:', data.id)
    return data
  }

  /**
   * Get active build for conversation
   */
  static async getActiveBuild(conversationId: string, userId: string): Promise<ArtifactBuild | null> {
    const { data, error } = await getSupabaseClient()
      .from('alex_artifact_builds')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .in('status', ['collecting_requirements', 'planning', 'designing_architecture', 'awaiting_architecture_verification', 'ready_for_confirmation', 'confirmed', 'generating', 'validating', 'persisting'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return null
    }

    return data
  }

  /**
   * Add a requirement question
   */
  static async addQuestion(
    buildId: string,
    question: string,
    questionType: 'missing_requirement' | 'clarification' | 'verification',
    context?: string,
    options?: any[],
    inputType?: 'select' | 'multi-select' | 'text' | 'email' | 'url' | 'number' | 'time' | 'date' | 'boolean',
    header?: string
  ): Promise<ArtifactQuestion> {
    const { data, error } = await getSupabaseClient()
      .from('alex_artifact_questions')
      .insert({
        build_id: buildId,
        question,
        question_type: questionType,
        context,
        is_answered: false,
        options,
        input_type: inputType,
        header
      })
      .select()
      .single()

    if (error) {
      console.error('[Artifact Service] Failed to add question:', error)
      throw new Error(`Failed to add question: ${error.message}`)
    }

    console.log('[Artifact Service] Question added:', data.id, 'with context:', context, 'options:', options?.length)
    return data
  }

  /**
   * Answer a requirement question
   */
  static async answerQuestion(questionId: string, answer: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from('alex_artifact_questions')
      .update({
        answer,
        answered_at: new Date().toISOString(),
        is_answered: true
      })
      .eq('id', questionId)

    if (error) {
      console.error('[Artifact Service] Failed to answer question:', error)
      throw new Error(`Failed to answer question: ${error.message}`)
    }

    console.log('[Artifact Service] Question answered:', questionId)
  }

  /**
   * Get questions for a build
   */
  static async getQuestions(buildId: string): Promise<ArtifactQuestion[]> {
    const { data, error } = await getSupabaseClient()
      .from('alex_artifact_questions')
      .select('*')
      .eq('build_id', buildId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[Artifact Service] Failed to get questions:', error)
      throw new Error(`Failed to get questions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update build specification
   */
  static async updateSpecification(
    buildId: string,
    specification: Record<string, any>,
    missingRequirements: string[] = []
  ): Promise<void> {
    const { error } = await getSupabaseClient()
      .from('alex_artifact_builds')
      .update({
        final_specification: specification,
        missing_requirements: missingRequirements,
        updated_at: new Date().toISOString()
      })
      .eq('id', buildId)

    if (error) {
      console.error('[Artifact Service] Failed to update specification:', error)
      throw new Error(`Failed to update specification: ${error.message}`)
    }

    console.log('[Artifact Service] Specification updated:', buildId)
  }

  /**
   * Update build status
   */
  static async updateBuildStatus(
    buildId: string,
    status: BuildStatus,
    metadata?: Record<string, any>
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (metadata) {
      updateData.generation_metadata = metadata
    }

    const { error } = await getSupabaseClient()
      .from('alex_artifact_builds')
      .update(updateData)
      .eq('id', buildId)

    if (error) {
      console.error('[Artifact Service] Failed to update build status:', error)
      throw new Error(`Failed to update build status: ${error.message}`)
    }

    console.log('[Artifact Service] Build status updated:', buildId, '->', status)
  }

  /**
   * Save generated artifact
   * Phase 3A: Enhanced with traceability metadata
   */
  static async saveArtifact(
    buildId: string,
    userId: string,
    filename: string,
    fileType: string,
    mimeType: string,
    content: string,
    isPrimary: boolean = false,
    traceability?: {
      architecture_id?: string
      architecture_name?: string
      specification_hash?: string
      platform?: string
      generation_stage?: string
      architecture_approved?: boolean
      validation_passed?: boolean
      repair_attempts?: number
    }
  ): Promise<GeneratedArtifact> {
    console.log('[Artifact Service] Saving artifact:', { buildId, userId, filename, fileType, contentLength: content.length })
    
    const { data, error } = await getSupabaseClient()
      .from('alex_artifacts')
      .insert({
        build_id: buildId,
        user_id: userId,
        filename,
        file_type: fileType,
        mime_type: mimeType,
        content,
        file_size: content.length,
        validation_status: 'pending',
        is_primary: isPrimary
      })
      .select()
      .single()

    if (error) {
      console.error('[Artifact Service] Failed to save artifact:', error)
      console.error('[Artifact Service] Error details:', JSON.stringify(error, null, 2))
      throw new Error(`Failed to save artifact: ${error.message}`)
    }

    console.log('[Artifact Service] Artifact saved successfully:', data.id, 'for user:', data.user_id)
    return data
  }

  /**
   * Validate artifact (JSON validation)
   */
  static async validateArtifact(
    artifactId: string,
    content: string,
    fileType: string
  ): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    if (fileType === 'json') {
      try {
        JSON.parse(content)
      } catch (e) {
        errors.push('Invalid JSON: ' + (e as Error).message)
      }
    }

    const result: ValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings
    }

    // Update validation status
    const { error } = await getSupabaseClient()
      .from('alex_artifacts')
      .update({
        validation_status: result.valid ? 'valid' : 'invalid',
        validation_errors: result.valid ? null : { errors, warnings }
      })
      .eq('id', artifactId)

    if (error) {
      console.error('[Artifact Service] Failed to update validation status:', error)
    }

    console.log('[Artifact Service] Artifact validated:', artifactId, result.valid ? 'valid' : 'invalid')
    return result
  }

  /**
   * Get artifacts for a build
   */
  static async getBuildArtifacts(buildId: string): Promise<GeneratedArtifact[]> {
    const { data, error } = await getSupabaseClient()
      .from('alex_artifacts')
      .select('*')
      .eq('build_id', buildId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[Artifact Service] Failed to get artifacts:', error)
      throw new Error(`Failed to get artifacts: ${error.message}`)
    }

    return data || []
  }

  /**
   * Mark build as failed
   */
  static async markBuildFailed(buildId: string, errorMessage: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from('alex_artifact_builds')
      .update({
        status: 'failed',
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', buildId)

    if (error) {
      console.error('[Artifact Service] Failed to mark build as failed:', error)
      throw new Error(`Failed to mark build as failed: ${error.message}`)
    }

    console.log('[Artifact Service] Build marked as failed:', buildId)
  }
}
