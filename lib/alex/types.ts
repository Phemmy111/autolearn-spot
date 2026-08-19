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