import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { validateFile, extractTextFromFile, sanitizeExtractedText, isMeaningfulText } from '@/lib/alex/file-extraction'
import { AlexFile } from '@/lib/alex/types'

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
    const storagePath = `alex/${userId}/${conversationId}/${fileId}/${file.name}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('alex-files')
      .upload(storagePath, file, {
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      console.error('Supabase storage error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Create database record
    const { data: fileRecord, error: dbError } = await supabase
      .from('alex_files')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        original_filename: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        file_size: file.size,
        status: 'uploaded',
        extraction_status: 'pending',
        metadata: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Rollback storage upload
      await supabase.storage.from('alex-files').remove([storagePath])
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // Trigger text extraction (non-blocking)
    // In production, this would go to a queue/job system
    triggerExtraction(fileRecord.id, file)

    return NextResponse.json({ 
      success: true, 
      file: fileRecord 
    })
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
    // Update status to processing
    await supabase
      .from('alex_files')
      .update({ 
        status: 'processing',
        extraction_status: 'processing'
      })
      .eq('id', fileId)

    // Extract text
    const extraction = await extractTextFromFile(file)

    if (extraction.success && isMeaningfulText(extraction.text)) {
      const sanitizedText = sanitizeExtractedText(extraction.text)

      await supabase
        .from('alex_files')
        .update({
          status: 'ready',
          extraction_status: 'completed',
          extracted_text: sanitizedText,
          page_count: extraction.metadata.pageCount,
          metadata: {
            ...extraction.metadata,
            extractedAt: new Date().toISOString()
          }
        })
        .eq('id', fileId)
    } else {
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
    console.error('Extraction error for file', fileId, error)
    await supabase
      .from('alex_files')
      .update({
        status: 'failed',
        extraction_status: 'failed',
        extraction_error: error instanceof Error ? error.message : 'Unknown extraction error'
      })
      .eq('id', fileId)
  }
}
