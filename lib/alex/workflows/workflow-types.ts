/**
 * Phase 7: Workflow Domain Types
 * 
 * Domain types for n8n workflow engineering, debugging, and artifact generation.
 */

export type WorkflowValidationSeverity = 'error' | 'warning' | 'info'

export interface WorkflowNode {
  id: string
  name: string
  type: string
  typeVersion?: number
  position?: [number, number]
  parameters?: Record<string, any>
  credentials?: Record<string, string>
  notes?: string
  disabled?: boolean
}

export interface WorkflowConnection {
  source: string
  target: string
  index?: number
  type?: string
}

export interface WorkflowMetadata {
  id?: string
  name?: string
  version?: number
  createdAt?: string
  updatedAt?: string
  tags?: string[]
  settings?: Record<string, any>
}

export interface Workflow {
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  metadata?: WorkflowMetadata
  [key: string]: any // Preserve unknown fields
}

export interface WorkflowValidationError {
  severity: WorkflowValidationSeverity
  code: string
  message: string
  nodeId?: string
  field?: string
  value?: any
  suggestion?: string
}

export interface WorkflowValidationResult {
  isValid: boolean
  errors: WorkflowValidationError[]
  warnings: WorkflowValidationError[]
  info: WorkflowValidationError[]
  nodeCount: number
  connectionCount: number
  nodeTypes: string[]
  integrations: string[]
  requiredCredentials: string[]
}

export interface WorkflowAnalysis {
  triggers: WorkflowNode[]
  actions: WorkflowNode[]
  transformations: WorkflowNode[]
  branches: WorkflowNode[]
  integrations: string[]
  requiredCredentials: string[]
  purpose: string
  nodeSequence: string[]
  disconnectedNodes: string[]
  suspiciousNodes: string[]
  bottlenecks: string[]
}

export interface WorkflowDebugRequest {
  workflow: Workflow
  errorMessage?: string
  executionError?: string
  nodeName?: string
  screenshotUrl?: string
  userDescription?: string
}

export interface WorkflowDebugResult {
  likelyProblem: string
  affectedNode?: string
  evidence: string[]
  confidence: 'high' | 'medium' | 'low'
  recommendedFix: string
  requiredConfiguration?: Record<string, string>
  canAutoRepair: boolean
  repairedWorkflow?: Workflow
}

export interface WorkflowRepairResult {
  success: boolean
  originalWorkflow: Workflow
  repairedWorkflow?: Workflow
  repairsPerformed: string[]
  uncertainRepairs: string[]
  validationAfterRepair: WorkflowValidationResult
}

export interface WorkflowGenerationRequest {
  requirement: string
  additionalContext?: string
  existingWorkflow?: Workflow
  constraints?: {
    maxNodes?: number
    requiredIntegrations?: string[]
    excludedIntegrations?: string[]
  }
}

export interface WorkflowGenerationResult {
  workflow: Workflow
  validation: WorkflowValidationResult
  explanation: string
  requiredCredentials: Record<string, string>
  requiredConfiguration: Record<string, string>
  testingInstructions: string
}

export interface WorkflowArtifact {
  filename: string
  content: string
  size: number
  createdAt: string
  workflowMetadata: WorkflowMetadata
}

export interface WorkflowRequest {
  type: 'generate' | 'debug' | 'validate' | 'analyze' | 'repair'
  input: Workflow | string | WorkflowDebugRequest | WorkflowGenerationRequest
  options?: {
    generateArtifact?: boolean
    validateAfterGeneration?: boolean
    useResearch?: boolean
    useRAG?: boolean
  }
}
