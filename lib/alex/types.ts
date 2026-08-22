// ALEX Type Definitions

export type AlexMode = 'auto' | 'tutor' | 'developer' | 'automation' | 'research' | 'agent_builder'

export interface Conversation {
  id: string
  user_id: string
  mode: AlexMode
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens?: number
  model_used?: string
  created_at: string
  file_ids?: string[] // File IDs attached to this message
  attached_files?: AlexFile[] // Full file objects (populated on load)
}

export interface AlexProviderConfig {
  id: string
  provider_name: string
  provider_type: 'openrouter' | 'openai' | 'gemini' | 'groq'
  api_key_encrypted: string
  base_url: string | null
  models: Record<string, string[]> // e.g., { "auto": ["model1"], "fast": ["model2"], "vision": ["model3"] }
  cost_controls: {
    maxTokens: number
    temperature: number
    dailyRequestLimit: number
    monthlyRequestLimit: number
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AlexUsage {
  id: string
  user_id: string
  conversation_id: string | null
  model: string
  tokens_used: number
  estimated_cost: number
  mode: AlexMode
  created_at: string
}

export interface ChatRequest {
  conversationId: string
  content: string
  mode: AlexMode
  fileIds?: string[]
}

export interface ChatResponse {
  content: string
  model: string
  tokens: number
}

// Phase 3A - File System Types
export interface AlexFile {
  id: string
  user_id: string
  conversation_id: string
  original_filename: string
  storage_path: string
  mime_type: string
  file_size: number
  status: 'uploaded' | 'processing' | 'ready' | 'failed'
  extraction_status: 'pending' | 'completed' | 'failed'
  extraction_error?: string
  extracted_text?: string
  page_count?: number
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  imageDataUrl?: string // Added for image support - base64 data URL
  optimizationDiagnostics?: any // Image optimization metrics for TPM compliance
}

export interface FileUploadRequest {
  conversationId: string
  file: File
}

export interface FileUploadResponse {
  success: boolean
  file?: AlexFile
  error?: string
}

export interface FileExtractionRequest {
  fileId: string
}

export interface FileExtractionResponse {
  success: boolean
  file?: AlexFile
  error?: string
}

// Phase 4 - Memory System Types
export type MemoryType = 'preference' | 'fact' | 'instruction'

export interface Memory {
  id: string
  user_id: string
  memory_type: MemoryType
  content: string
  embedding?: number[]
  embedding_model?: string
  embedding_dimension?: number
  metadata: Record<string, any>
  source: 'explicit' | 'inferred' | 'system'
  source_conversation_id?: string
  confidence: number // 0.0 to 1.0
  importance: number // 0.0 to 1.0
  last_accessed_at?: string
  access_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MemoryCreateInput {
  content: string
  memory_type?: MemoryType
  importance?: number
  source?: 'explicit' | 'inferred' | 'system'
  source_conversation_id?: string
}

export interface MemoryUpdateInput {
  content?: string
  importance?: number
  is_active?: boolean
}

export interface MemoryRetrievalOptions {
  maxResults?: number
  maxTokens?: number
  minSimilarity?: number
  minImportance?: number
  memoryTypes?: MemoryType[]
}

export interface MemoryRetrievalResult {
  memories: Memory[]
  metadata: {
    queryLength: number
    memoriesRetrieved: number
    totalTokens: number
    processingTimeMs: number
  }
}

export interface MemoryCommand {
  type: 'remember' | 'forget' | 'list' | 'clear'
  content: string
  extractedMemory?: string
}

// Phase 5 - Tools & Workflows Types
export type ToolCategory = 'utility' | 'information' | 'computation' | 'integration' | 'workflow'

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, any> // JSON Schema for input validation
  outputSchema?: Record<string, any> // JSON Schema for output
  category: ToolCategory
  permissions: string[] // Required permissions/capabilities
  enabled: boolean
  timeoutMs?: number // Execution timeout in milliseconds
}

export interface ToolCall {
  id: string
  toolName: string
  arguments: Record<string, any>
  conversationId?: string
  userId: string
  metadata?: Record<string, any>
}

export interface ToolResult {
  toolCallId: string
  toolName: string
  success: boolean
  result?: any
  error?: string
  metadata?: Record<string, any>
  executionTimeMs: number
}

export interface ToolExecutionRecord {
  id: string
  user_id: string
  conversation_id?: string
  tool_name: string
  tool_call_id: string
  arguments: Record<string, any>
  success: boolean
  result?: any
  error?: string
  execution_time_ms: number
  created_at: string
}

export interface ToolExecutor {
  name: string
  execute(args: Record<string, any>, context: ToolExecutionContext): Promise<any>
}

export interface ToolExecutionContext {
  userId: string
  conversationId?: string
  metadata?: Record<string, any>
}