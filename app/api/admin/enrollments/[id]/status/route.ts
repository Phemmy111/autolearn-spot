import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin()
    
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 })
    }

    const body = await req.json()
    const { status } = body

    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status provided' }, { status: 400 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('enrollments')
      .update({ status })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating enrollment status:', updateError)
      return NextResponse.json({ error: 'Failed to update enrollment status' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `Enrollment status changed to ${status}` })
  } catch (error: any) {
    console.error('Enrollment Status Update Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
