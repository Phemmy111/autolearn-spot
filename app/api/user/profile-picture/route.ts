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

    // Try to update in enrollments table (students)
    let updateError = null
    const { error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .update({ profile_picture: dataUrl })
      .eq('user_id', userId)

    if (!enrollmentError) {
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

    if (!influencerError) {
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

    if (!ambassadorError) {
      return NextResponse.json({ 
        success: true, 
        profilePicture: dataUrl 
      })
    }

    // If all updates failed
    console.error('Error updating profile picture in all tables:', { enrollmentError, influencerError, ambassadorError })
    return NextResponse.json({ error: 'Failed to update profile picture' }, { status: 500 })
  } catch (error) {
    console.error('Profile picture upload error:', error)
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

    // Try to get from enrollments table (students)
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('profile_picture')
      .eq('user_id', userId)
      .single()

    if (!enrollmentError && enrollment) {
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

    if (!influencerError && influencer) {
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

    if (!ambassadorError && ambassador) {
      return NextResponse.json({ 
        profilePicture: ambassador?.profile_picture || null 
      })
    }

    // If all lookups failed, return null
    return NextResponse.json({ 
      profilePicture: null 
    })
  } catch (error) {
    console.error('Profile picture fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
