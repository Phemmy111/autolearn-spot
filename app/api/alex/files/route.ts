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
      triggerExtraction(fileRecord.id, file, userId)

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

// DELETE /api/alex/files - Remove file from conversation
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 })
    }

    // Verify user owns the file
    const { data: file, error: fileError } = await supabase
      .from('alex_files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 })
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('alex-files')
      .remove([file.storage_path])

    if (storageError) {
      console.error('Error deleting file from storage:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database (this will cascade to chunks due to foreign key)
    const { error: dbError } = await supabase
      .from('alex_files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', userId)

    if (dbError) {
      console.error('Error deleting file from database:', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Non-blocking text extraction trigger
async function triggerExtraction(fileId: string, file: File, userId: string) {
  // Calculate timeout based on file size - more generous scaling for large files
  const EXTRACTION_TIMEOUT = Math.max(120000, Math.min(600000, file.size / 500)) // 2 minutes minimum, 2s per MB, max 10 minutes
  
  try {
    console.log('[EXTRACTION] Extraction trigger start', {
      fileId,
      filename: file.name,
      fileSize: file.size,
      fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
      timeoutMs: EXTRACTION_TIMEOUT,
      timeoutMinutes: (EXTRACTION_TIMEOUT / 60000).toFixed(1),
      mimeType: file.type
    })

    // Skip extraction for images - they're already marked as ready
    if (file.type.startsWith('image/')) {
      console.log('[EXTRACTION] Image extraction skipped - already ready')
      return
    }

    console.log('[EXTRACTION] Starting extraction with timeout', {
      timeoutMs: EXTRACTION_TIMEOUT,
      timeoutMinutes: (EXTRACTION_TIMEOUT / 60000).toFixed(1),
      fileSizeMB: (file.size / 1024 / 1024).toFixed(2)
    })
    const extraction = await Promise.race([
      extractTextFromFile(file),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Extraction timeout')), EXTRACTION_TIMEOUT)
      )
    ]) as ExtractionResult

    console.log('[EXTRACTION] Extraction completed', {
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

      console.log('[EXTRACTION] Text persistence start', {
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

      console.log('[EXTRACTION] Text persistence result', {
        fileId,
        persistenceSuccess: !updateError,
        persistenceError: updateError?.message
      })

      if (updateError) {
        console.error('[EXTRACTION] Failed to persist extracted text:', updateError)
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

      console.log('[EXTRACTION] File marked ready', {
        fileId,
        finalStatus: 'ready',
        finalExtractionStatus: 'completed'
      })

      // Trigger Phase 3B indexing (non-blocking)
      console.log('[EXTRACTION] Triggering Phase 3B indexing for file:', fileId)
      indexFile(fileId, userId).catch(error => {
        console.error('[EXTRACTION] Indexing failed for file:', fileId, 'error:', error)
        // Indexing failure is logged but doesn't affect file readiness
      })
      console.log('[EXTRACTION] Indexing triggered (non-blocking)')
    } else {
      console.log('[EXTRACTION] Extraction failed', {
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
    console.error('[EXTRACTION] Extraction exception', {
      fileId,
      error: error instanceof Error ? error.message : 'Unknown extraction error',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Specific handling for timeout
    const errorMessage = error instanceof Error ? error.message : 'Unknown extraction error'
    const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('Timeout')
    
    const timeoutMessage = isTimeout 
      ? `Extraction timeout (${(EXTRACTION_TIMEOUT/60000).toFixed(1)} minutes) - file ${file.name} (${(file.size/1024/1024).toFixed(2)}MB) may be too large or complex for current server load`
      : errorMessage
    
    await supabase
      .from('alex_files')
      .update({
        status: 'failed',
        extraction_status: 'failed',
        extraction_error: timeoutMessage
      })
      .eq('id', fileId)
  }
}
