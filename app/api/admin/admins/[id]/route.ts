import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireSuperAdmin } from '@/lib/admin'

// PUT - Super Admin only: Update admin
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin()

    const body = await request.json()
    const { role, is_active } = body

    // Validate role if provided
    if (role && !['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Prevent deactivating the last super admin
    if (is_active === false) {
      const { data: currentAdmin } = await supabase
        .from('admins')
        .select('role')
        .eq('id', params.id)
        .single()

      if (currentAdmin?.role === 'super_admin') {
        const { count } = await supabase
          .from('admins')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'super_admin')
          .eq('is_active', true)

        if (count && count <= 1) {
          return NextResponse.json({ error: 'Cannot deactivate the last super admin' }, { status: 400 })
        }
      }
    }

    const { data: admin, error } = await supabase
      .from('admins')
      .update({
        role: role || undefined,
        is_active: is_active !== undefined ? is_active : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating admin:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ admin })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Unexpected error updating admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Super Admin only: Delete admin
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin()

    // Prevent deleting the last super admin
    const { data: currentAdmin } = await supabase
      .from('admins')
      .select('role')
      .eq('id', params.id)
      .single()

    if (currentAdmin?.role === 'super_admin') {
      const { count } = await supabase
        .from('admins')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'super_admin')
        .eq('is_active', true)

      if (count && count <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last super admin' }, { status: 400 })
      }
    }

    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting admin:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Unexpected error deleting admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
