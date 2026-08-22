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
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      console.log('[Artifact Download] Unauthorized - no userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Artifact Download] Request:', { artifactId: params.id, userId })

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { data: artifact, error } = await supabase
      .from('alex_artifacts')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single()

    console.log('[Artifact Download] Query result:', { error, artifactFound: !!artifact })

    if (error || !artifact) {
      console.error('[Artifact Download] Artifact not found:', error)
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 })
    }

    console.log('[Artifact Download] Returning artifact:', { filename: artifact.filename, size: artifact.content.length })

    // Return file as download
    return new NextResponse(artifact.content, {
      headers: {
        'Content-Type': artifact.mime_type,
        'Content-Disposition': `attachment; filename="${artifact.filename}"`,
        'Content-Length': artifact.content.length.toString()
      }
    })
  } catch (error) {
    console.error('[Artifact Download] Error:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}
