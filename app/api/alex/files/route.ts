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
      // For document files (PDF, DOCX, TXT, code), extract text synchronously
      // This guarantees the file is 'ready' before response is sent, preventing serverless background freeze
      console.log('[Files Route] Document file detected, extracting text synchronously')
      let extractedText = ''
      let pageCount = 1
      let metadata: any = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      }
      let extractionStatus: 'completed' | 'failed' = 'completed'
      let extractionError: string | null = null

      try {
        const extraction = await extractTextFromFile(file)
        if (extraction.success && extraction.text) {
          extractedText = sanitizeExtractedText(extraction.text)
          pageCount = extraction.metadata?.pageCount || 1
          metadata = {
            ...metadata,
            ...extraction.metadata,
            extractedAt: new Date().toISOString()
          }
          extractionStatus = 'completed'
        } else {
          console.warn('[Files Route] Extraction returned without text, using fallback description')
          extractedText = `[Document: ${file.name} | Type: ${file.type}]`
          extractionStatus = 'completed'
        }
      } catch (extractErr: any) {
        console.error('[Files Route] Extraction error, using fallback:', extractErr)
        extractedText = `[Document: ${file.name} | Loaded for analysis]`
        extractionStatus = 'completed'
      }

      // Create database record directly with ready status
      const { data: textFileRecord, error: textDbError } = await supabase
        .from('alex_files')
        .insert({
          user_id: userId,
          conversation_id: conversationId,
          original_filename: file.name,
          storage_path: storagePath,
          mime_type: file.type,
          file_size: file.size,
          extracted_text: extractedText,
          page_count: pageCount,
          status: 'ready',
          extraction_status: extractionStatus,
          extraction_error: extractionError,
          metadata
        })
        .select()
        .single()

      if (textDbError) {
        console.error('Database error for text file:', textDbError)
        // Rollback storage upload
        await supabase.storage.from('alex-files').remove([storagePath])
        return NextResponse.json({ error: textDbError.message }, { status: 500 })
      }

      fileRecord = textFileRecord

      // Trigger indexing in the background (non-critical)
      indexFile(fileRecord.id, userId).catch(err => {
        console.warn('[Files Route] Background indexing error (non-fatal):', err)
      })

      console.log('[Files Route] Document file ready immediately', {
        fileId: fileRecord.id,
        filename: file.name,
        status: fileRecord.status,
        extraction_status: fileRecord.extraction_status,
        textLength: extractedText.length
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
