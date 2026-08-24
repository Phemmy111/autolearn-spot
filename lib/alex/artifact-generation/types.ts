/**
 * ALEX Phase 7: Artifact Generation Types
 * Phase 3A Runtime Stabilization: Enhanced workflow stages
 */

export type WorkflowBuildStage =
  | 'understanding'
  | 'requirements'
  | 'recommendation'
  | 'architecture'
  | 'awaiting_approval'
  | 'compiling'
  | 'validating'
  | 'repairing'
  | 'completed'
  | 'failed'

export type BuildStatus = 
  | 'collecting_requirements'
  | 'ready_for_confirmation'
  | 'awaiting_architecture_verification'
  | 'confirmed'
  | 'generating'
  | 'validating'
  | 'persisting'
  | 'completed'
  | 'failed'

export type BuildType = 
  | 'chatbot'
  | 'workflow'
  | 'agent'
  | 'configuration'
  | 'project'
  | 'website'
  | 'api'
  | 'script'

export type ValidationStatus = 
  | 'pending'
  | 'valid'
  | 'invalid'
  | 'failed'

export type QuestionType = 
  | 'missing_requirement'
  | 'clarification'
  | 'verification'

export interface ArtifactBuild {
  id: string
  conversation_id: string
  user_id: string
  build_type: BuildType
  status: BuildStatus
  workflow_stage?: WorkflowBuildStage  // Phase 3A: Track current workflow stage
  original_request: string
  final_specification?: Record<string, any>
  requirements_collected?: Record<string, any>
  missing_requirements?: string[]
  confirmation_granted: boolean
  generation_metadata?: {
    generationStartedAt?: string
    generationCompletedAt?: string
    retryCount?: number
    filesGenerated?: number
  }
  error_message?: string
  created_at: string
  updated_at: string
}

export interface GeneratedArtifact {
  id: string
  build_id: string
  user_id: string
  filename: string
  file_type: string
  mime_type: string
  content: string
  storage_path?: string
  file_size?: number
  validation_status: ValidationStatus
  validation_errors?: Record<string, any>
  is_primary: boolean
  created_at: string
  updated_at: string
  // Phase 3A: Artifact traceability
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
}

export interface ArtifactQuestion {
  id: string
  build_id: string
  question: string
  question_type: QuestionType
  context?: string  // Field context for answer mapping
  answer?: string
  answered_at?: string
  is_answered: boolean
  created_at: string
}

export interface ArtifactGenerationResult {
  success: boolean
  build?: ArtifactBuild
  artifacts?: GeneratedArtifact[]
  error?: string
}

export interface ArtifactManifest {
  build_type: BuildType
  specification: Record<string, any>
  files: Array<{
    filename: string
    content: string
    file_type: string
    mime_type: string
    is_primary: boolean
  }>
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
