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

    // Update user's profile picture in enrollments table
    const { error: updateError } = await supabaseAdmin
      .from('enrollments')
      .update({ profile_picture: dataUrl })
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating profile picture:', updateError)
      return NextResponse.json({ error: 'Failed to update profile picture' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      profilePicture: dataUrl 
    })
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

    // Get user's profile picture from enrollments table
    const { data: enrollment, error } = await supabaseAdmin
      .from('enrollments')
      .select('profile_picture')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile picture:', error)
      return NextResponse.json({ error: 'Failed to fetch profile picture' }, { status: 500 })
    }

    return NextResponse.json({ 
      profilePicture: enrollment?.profile_picture || null 
    })
  } catch (error) {
    console.error('Profile picture fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
