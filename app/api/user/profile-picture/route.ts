import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()
    const formData = await request.formData()
    const file = formData.get('file') as File

    console.log('[Profile Picture POST] userId:', userId)
    console.log('[Profile Picture POST] userEmail:', user?.emailAddresses?.[0]?.emailAddress)
    console.log('[Profile Picture POST] file:', file?.name, file?.size)

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    console.log('[Profile Picture POST] dataUrl length:', dataUrl.length)

    // Try to update in enrollments table (students)
    let updateError = null
    const { error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .update({ profile_picture: dataUrl })
      .eq('user_id', userId)

    console.log('[Profile Picture POST] enrollmentError:', enrollmentError)

    if (!enrollmentError) {
      console.log('[Profile Picture POST] Successfully updated enrollments table')
      return NextResponse.json({ 
        success: true, 
        profilePicture: dataUrl 
      })
    }

    // Try to update in influencers table (influencers)
    const { error: influencerError } = await supabaseAdmin
      .from('influencers')
      .update({ profile_picture: dataUrl })
      .eq('email', user?.emailAddresses?.[0]?.emailAddress || '')

    console.log('[Profile Picture POST] influencerError:', influencerError)

    if (!influencerError) {
      console.log('[Profile Picture POST] Successfully updated influencers table')
      return NextResponse.json({ 
        success: true, 
        profilePicture: dataUrl 
      })
    }

    // Try to update in community_ambassadors table (community partners)
    const { error: ambassadorError } = await supabaseAdmin
      .from('community_ambassadors')
      .update({ profile_picture: dataUrl })
      .eq('email', user?.emailAddresses?.[0]?.emailAddress || '')

    console.log('[Profile Picture POST] ambassadorError:', ambassadorError)

    if (!ambassadorError) {
      console.log('[Profile Picture POST] Successfully updated community_ambassadors table')
      return NextResponse.json({ 
        success: true, 
        profilePicture: dataUrl 
      })
    }

    // If all updates failed
    console.error('[Profile Picture POST] All updates failed:', { enrollmentError, influencerError, ambassadorError })
    return NextResponse.json({ error: 'Failed to update profile picture' }, { status: 500 })
  } catch (error) {
    console.error('[Profile Picture POST] Profile picture upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()
    const userEmail = user?.emailAddresses?.[0]?.emailAddress || ''

    console.log('[Profile Picture GET] userId:', userId)
    console.log('[Profile Picture GET] userEmail:', userEmail)

    // Try to get from enrollments table (students)
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('profile_picture')
      .eq('user_id', userId)
      .single()

    console.log('[Profile Picture GET] enrollmentError:', enrollmentError)
    console.log('[Profile Picture GET] enrollment:', enrollment)

    if (!enrollmentError && enrollment) {
      console.log('[Profile Picture GET] Found in enrollments')
      return NextResponse.json({ 
        profilePicture: enrollment?.profile_picture || null 
      })
    }

    // Try to get from influencers table (influencers)
    const { data: influencer, error: influencerError } = await supabaseAdmin
      .from('influencers')
      .select('profile_picture')
      .eq('email', userEmail)
      .single()

    console.log('[Profile Picture GET] influencerError:', influencerError)
    console.log('[Profile Picture GET] influencer:', influencer)

    if (!influencerError && influencer) {
      console.log('[Profile Picture GET] Found in influencers')
      return NextResponse.json({ 
        profilePicture: influencer?.profile_picture || null 
      })
    }

    // Try to get from community_ambassadors table (community partners)
    const { data: ambassador, error: ambassadorError } = await supabaseAdmin
      .from('community_ambassadors')
      .select('profile_picture')
      .eq('email', userEmail)
      .single()

    console.log('[Profile Picture GET] ambassadorError:', ambassadorError)
    console.log('[Profile Picture GET] ambassador:', ambassador)

    if (!ambassadorError && ambassador) {
      console.log('[Profile Picture GET] Found in community_ambassadors')
      return NextResponse.json({ 
        profilePicture: ambassador?.profile_picture || null 
      })
    }

    // If all lookups failed, return null
    console.log('[Profile Picture GET] Not found in any table')
    return NextResponse.json({ 
      profilePicture: null 
    })
  } catch (error) {
    console.error('Profile picture fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
