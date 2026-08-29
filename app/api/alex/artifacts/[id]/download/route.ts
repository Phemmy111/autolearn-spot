import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET /api/alex/artifacts/[id]/download - Download generated artifact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      console.log('[Artifact Download] Unauthorized - no userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params // Await params as required by Next.js 15+
    console.log('[Artifact Download] Request:', { artifactId: id, userId })

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { data: artifact, error } = await supabase
      .from('alex_artifacts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    console.log('[Artifact Download] Query result:', { error, artifactFound: !!artifact })

    if (error || !artifact) {
      console.error('[Artifact Download] Artifact not found:', error)
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 })
    }

    let finalContent = artifact.content
    if (typeof finalContent === 'object') {
      finalContent = JSON.stringify(finalContent, null, 2)
    } else if (typeof finalContent !== 'string') {
      finalContent = String(finalContent)
    }

    console.log('[Artifact Download] Returning artifact:', { filename: artifact.filename, size: finalContent.length })

    // Return file as download
    return new NextResponse(finalContent, {
      headers: {
        'Content-Type': artifact.mime_type,
        'Content-Disposition': `attachment; filename="${artifact.filename}"`,
        'Content-Length': Buffer.byteLength(finalContent, 'utf8').toString()
      }
    })
  } catch (error) {
    console.error('[Artifact Download] Error:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}
