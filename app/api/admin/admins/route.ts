import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireSuperAdmin, currentUser } from '@/lib/admin'

// GET - Super Admin only: Get all admins
export async function GET() {
  try {
    await requireSuperAdmin()

    const { data: admins, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching admins:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ admins })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Unexpected error fetching admins:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Super Admin only: Create new admin
export async function POST(request: Request) {
  try {
    await requireSuperAdmin()

    const body = await request.json()
    const { email, role } = body

    // Validate required fields
    if (!email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Get current user info
    const user = await currentUser()
    const createdBy = user?.id

    // Check if admin already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingAdmin) {
      return NextResponse.json({ error: 'Admin with this email already exists' }, { status: 409 })
    }

    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .insert({
        email: email.toLowerCase(),
        role,
        is_active: true,
        created_by: createdBy,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating admin:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ admin }, { status: 201 })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Unexpected error creating admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
