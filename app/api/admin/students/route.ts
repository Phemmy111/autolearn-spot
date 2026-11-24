import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { extendEnrollmentAccess } from '@/lib/enrollment-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { data: enrollments, error } = await supabaseAdmin
      .from('enrollments')
      .select(`
        id,
        full_name,
        first_name,
        last_name,
        email,
        clerk_user_id,
        learning_product_id,
        payment_amount,
        amount_paid,
        status,
        activated_at,
        expires_at,
        enrolled_at,
        created_at,
        learning_product:learning_products (
          id,
          title,
          slug,
          access_duration_days
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching students:', error);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    const formattedData = (enrollments || []).map(e => {
      const product = Array.isArray(e.learning_product) ? e.learning_product[0] : e.learning_product;
      
      const isCourseLifetime = product ? (product.access_duration_days === null || product.access_duration_days === undefined || product.access_duration_days === 0) : false;
      const isStudentLifetime = e.expires_at ? new Date(e.expires_at).getFullYear() >= 2099 : false;
      const isLifetime = isCourseLifetime || isStudentLifetime;

      let daysLeft: number | null = null;
      let isExpired = e.status === 'expired';

      if (isLifetime) {
        daysLeft = null;
      } else if (e.expires_at) {
        const diffMs = new Date(e.expires_at).getTime() - Date.now();
        daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        if (diffMs <= 0) isExpired = true;
      } else if (e.status === 'active' && e.activated_at && product?.access_duration_days) {
        const start = new Date(e.activated_at).getTime();
        const durationMs = product.access_duration_days * 24 * 60 * 60 * 1000;
        const diffMs = (start + durationMs) - Date.now();
        daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        if (diffMs <= 0) isExpired = true;
      }

      const finalStatus = e.status === 'deactivated' 
        ? 'deactivated' 
        : isExpired 
        ? 'expired' 
        : (e.status || 'not_started');

      const name = e.full_name || 
        (e.first_name || e.last_name ? `${e.first_name || ''} ${e.last_name || ''}`.trim() : 'No name');

      return {
        id: e.id,
        name,
        email: e.email,
        clerk_user_id: e.clerk_user_id,
        course_id: e.learning_product_id,
        course: product ? product.title : 'Unknown Course',
        amount: e.payment_amount || e.amount_paid || 0,
        status: finalStatus,
        date: e.activated_at || e.enrolled_at || e.created_at || 'N/A',
        expires_at: e.expires_at,
        days_left: daysLeft,
        is_lifetime: isLifetime
      };
    });

    const metrics = {
      total: formattedData.length,
      active: formattedData.filter(s => s.status === 'active').length,
      expired: formattedData.filter(s => s.status === 'expired').length,
      deactivated: formattedData.filter(s => s.status === 'deactivated').length,
      not_started: formattedData.filter(s => s.status === 'not_started').length,
    };

    return NextResponse.json({ data: formattedData, metrics });
  } catch (error) {
    console.error('Error in admin students API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/students
 * Deactivates or Reactivates student enrollment, OR extends course access days / lifetime
 * Body: { id: string, status?: 'active' | 'deactivated', action?: 'deactivate' | 'activate' | 'extend_access', daysToAdd?: number, isLifetime?: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { id, status, action, daysToAdd, isLifetime } = body;

    if (!id) {
      return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 });
    }

    // Handle Access Extension
    if (action === 'extend_access' || daysToAdd !== undefined || isLifetime !== undefined) {
      const result = await extendEnrollmentAccess({
        enrollmentId: id,
        daysToAdd: daysToAdd !== undefined ? Number(daysToAdd) : undefined,
        isLifetime: Boolean(isLifetime),
      });

      return NextResponse.json({
        success: true,
        message: result.message,
        data: result
      });
    }

    // Handle Status Toggle (deactivate / reactivate)
    let targetStatus: string;
    if (action === 'deactivate' || status === 'deactivated') {
      targetStatus = 'deactivated';
    } else if (action === 'activate' || status === 'active') {
      targetStatus = 'active';
    } else if (status) {
      targetStatus = status;
    } else {
      return NextResponse.json({ error: 'Valid action or status is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .update({ 
        status: targetStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, status, full_name, email')
      .single();

    if (error) {
      console.error('Error updating student enrollment status:', error);
      return NextResponse.json({ error: 'Failed to update student status' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Student status successfully set to ${targetStatus}`,
      data
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/students:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/students
 * Permanently removes a student's enrollment
 * Query: ?id=xxx OR Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    let id = searchParams.get('id');

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body?.id;
    }

    if (!id) {
      return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('enrollments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting student enrollment:', error);
      return NextResponse.json({ error: 'Failed to delete student enrollment' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Student enrollment removed successfully',
      id
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/students:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
