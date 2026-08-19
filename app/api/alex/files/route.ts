import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { validateFile, extractTextFromFile, sanitizeExtractedText, isMeaningfulText, ExtractionResult } from '@/lib/alex/file-extraction'
import { AlexFile } from '@/lib/alex/types'
import { indexFile } from '@/lib/alex/indexing'

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

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// POST /api/alex/files - Upload file to ALEX conversation
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const conversationId = formData.get('conversationId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!conversationId) {
      return NextResponse.json({ error: 'No conversation ID provided' }, { status: 400 })
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Verify user owns the conversation
    const { data: conversation, error: convError } = await supabase
      .from('alex_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 })
    }

    // Generate file ID and storage path
    const fileId = crypto.randomUUID()
    const fileExt = file.name.split('.').pop()
    
    // Sanitize filename for storage path (remove special characters)
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `alex/${userId}/${conversationId}/${fileId}/${sanitizedFilename}`

    console.log('[DIAGNOSTIC] UPLOAD START', {
      fileId,
      originalFilename: file.name,
      sanitizedFilename,
      userId,
      conversationId,
      fileSize: file.size,
      mimeType: file.type
    })

    // Upload to Supabase Storage
    // Try without contentType to let Supabase handle detection
    const uploadOptions: any = {
      upsert: false
    }

    // Only set contentType for text files - let Supabase auto-detect images
    if (!file.type.startsWith('image/')) {
      uploadOptions.contentType = file.type
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('alex-files')
      .upload(storagePath, file, uploadOptions)

    console.log('[DIAGNOSTIC] STORAGE UPLOAD', {
      fileId,
      storagePath,
      uploadSuccess: !uploadError,
      uploadError: uploadError?.message,
      contentTypeUsed: uploadOptions.contentType || 'auto-detect'
    })

    if (uploadError) {
      console.error('Supabase storage error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // For images, create database record directly as ready (no extraction needed)
    // For text files, create as processing and trigger extraction
    let fileRecord
    if (file.type.startsWith('image/')) {
      console.log('[Files Route] Image file detected, creating record as ready')

      const { data: imageFileRecord, error: imageDbError } = await supabase
        .from('alex_files')
        .insert({
          user_id: userId,
          conversation_id: conversationId,
          original_filename: file.name,
          storage_path: storagePath,
          mime_type: file.type,
          file_size: file.size,
          status: 'ready',
          extraction_status: 'completed',
          metadata: {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size
          }
        })
        .select()
        .single()

      console.log('[DIAGNOSTIC] IMAGE DATABASE INSERT', {
        fileId,
        dbSuccess: !imageDbError,
        dbError: imageDbError?.message,
        recordId: imageFileRecord?.id,
        finalStatus: imageFileRecord?.status,
        finalExtractionStatus: imageFileRecord?.extraction_status
      })

      if (imageDbError) {
        console.error('Database error for image:', imageDbError)
        // Rollback storage upload
        await supabase.storage.from('alex-files').remove([storagePath])
        return NextResponse.json({ error: imageDbError.message }, { status: 500 })
      }

      fileRecord = imageFileRecord

      console.log('[Files Route] Image file ready immediately', {
        fileId: fileRecord.id,
        filename: file.name,
        status: fileRecord.status,
        extraction_status: fileRecord.extraction_status
      })

      return NextResponse.json({
        success: true,
        file: fileRecord
      })
    } else {
      // Create database record with processing status for text files
      const { data: textFileRecord, error: textDbError } = await supabase
        .from('alex_files')
        .insert({
          user_id: userId,
          conversation_id: conversationId,
          original_filename: file.name,
          storage_path: storagePath,
          mime_type: file.type,
          file_size: file.size,
          status: 'processing',
          extraction_status: 'processing',
          metadata: {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size
          }
        })
        .select()
        .single()

      console.log('[DIAGNOSTIC] TEXT DATABASE INSERT', {
        fileId,
        dbSuccess: !textDbError,
        dbError: textDbError?.message,
        recordId: textFileRecord?.id,
        initialStatus: textFileRecord?.status,
        initialExtractionStatus: textFileRecord?.extraction_status
      })

      if (textDbError) {
        console.error('Database error:', textDbError)
        // Rollback storage upload
        await supabase.storage.from('alex-files').remove([storagePath])
        return NextResponse.json({ error: textDbError.message }, { status: 500 })
      }

      fileRecord = textFileRecord

      // Trigger text extraction (non-blocking)
      triggerExtraction(fileRecord.id, file)

      console.log('[Files Route] Text file upload successful, extraction started', {
        fileId: fileRecord.id,
        filename: file.name,
        status: fileRecord.status,
        extraction_status: fileRecord.extraction_status
      })

      return NextResponse.json({
        success: true,
        file: fileRecord
      })
    }
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/alex/files - Get files for a conversation
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    // Verify user owns the conversation
    const { data: conversation, error: convError } = await supabase
      .from('alex_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 })
    }

    // Get files for this conversation
    const { data: files, error: filesError } = await supabase
      .from('alex_files')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (filesError) {
      console.error('Error fetching files:', filesError)
      return NextResponse.json({ error: filesError.message }, { status: 500 })
    }

    return NextResponse.json({ files: files || [] })
  } catch (error: any) {
    console.error('Error fetching files:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Non-blocking text extraction trigger
async function triggerExtraction(fileId: string, file: File) {
  try {
    console.log('[DIAGNOSTIC] EXTRACTION START', {
      fileId,
      filename: file.name,
      fileSize: file.size,
      mimeType: file.type
    })

    // Skip extraction for images - they're already marked as ready
    if (file.type.startsWith('image/')) {
      console.log('[DIAGNOSTIC] IMAGE EXTRACTION SKIPPED - ALREADY READY')
      return
    }

    // Extract text with timeout
    const EXTRACTION_TIMEOUT = 60000 // 60 seconds
    const extraction = await Promise.race([
      extractTextFromFile(file),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Extraction timeout')), EXTRACTION_TIMEOUT)
      )
    ]) as ExtractionResult

    console.log('[DIAGNOSTIC] EXTRACTION RESULT', {
      fileId,
      success: extraction.success,
      textLength: extraction.text?.length || 0,
      metadata: extraction.metadata,
      error: extraction.error,
      isMeaningful: extraction.text ? isMeaningfulText(extraction.text) : false,
      textPreview: extraction.text?.substring(0, 200) || 'none'
    })

    if (extraction.success && extraction.text && isMeaningfulText(extraction.text)) {
      const sanitizedText = sanitizeExtractedText(extraction.text)

      console.log('[DIAGNOSTIC] TEXT PERSISTENCE START', {
        fileId,
        sanitizedTextLength: sanitizedText.length
      })

      // First persist the extracted text
      const { error: updateError } = await supabase
        .from('alex_files')
        .update({
          extracted_text: sanitizedText,
          page_count: extraction.metadata.pageCount,
          metadata: {
            ...extraction.metadata,
            extractedAt: new Date().toISOString()
          }
        })
        .eq('id', fileId)

      console.log('[DIAGNOSTIC] TEXT PERSISTENCE RESULT', {
        fileId,
        persistenceSuccess: !updateError,
        persistenceError: updateError?.message
      })

      if (updateError) {
        console.error('[Files Route] Failed to persist extracted text:', updateError)
        // Mark as failed if text persistence fails
        await supabase
          .from('alex_files')
          .update({
            status: 'failed',
            extraction_status: 'failed',
            extraction_error: 'Failed to persist extracted text'
          })
          .eq('id', fileId)
        return
      }

      // Only mark as ready after text is successfully persisted
      await supabase
        .from('alex_files')
        .update({
          status: 'ready',
          extraction_status: 'completed'
        })
        .eq('id', fileId)

      console.log('[DIAGNOSTIC] FILE MARKED READY', {
        fileId,
        finalStatus: 'ready',
        finalExtractionStatus: 'completed'
      })

      // Trigger Phase 3B indexing (non-blocking)
      console.log('[Files Route] Triggering Phase 3B indexing for file:', fileId)
      indexFile(fileId, userId).catch(error => {
        console.error('[Files Route] Indexing failed for file:', fileId, 'error:', error)
        // Indexing failure is logged but doesn't affect file readiness
      })
      console.log('[Files Route] Indexing triggered (non-blocking)')
    } else {
      console.log('[DIAGNOSTIC] EXTRACTION FAILED', {
        fileId,
        reason: extraction.error || 'Text not meaningful',
        extractionSuccess: extraction.success,
        hasText: !!extraction.text,
        textLength: extraction.text?.length || 0
      })

      await supabase
        .from('alex_files')
        .update({
          status: 'failed',
          extraction_status: 'failed',
          extraction_error: extraction.error || 'Extraction failed or no meaningful text found'
        })
        .eq('id', fileId)
    }
  } catch (error) {
    console.error('[DIAGNOSTIC] EXTRACTION EXCEPTION', {
      fileId,
      error: error instanceof Error ? error.message : 'Unknown extraction error',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    })
    
    // Specific handling for timeout
    const errorMessage = error instanceof Error ? error.message : 'Unknown extraction error'
    const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('Timeout')
    
    await supabase
      .from('alex_files')
      .update({
        status: 'failed',
        extraction_status: 'failed',
        extraction_error: isTimeout ? 'Extraction timeout - file may be too large or complex' : errorMessage
      })
      .eq('id', fileId)
  }
}
