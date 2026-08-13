import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enabledOnly = searchParams.get('enabled') === 'true';

    let query = supabaseAdmin
      .from('testimonials')
      .select('*')
      .order('display_order', { ascending: true });

    if (enabledOnly) {
      query = query.eq('enabled', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, items: data || [] });
  } catch (error) {
    console.error('[GET /api/admin/content/testimonials] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const studentName = formData.get('studentName') as string;
    const cohort = formData.get('cohort') as string | null;
    const course = formData.get('course') as string | null;
    const screenshotFile = formData.get('screenshotFile') as File | null;
    const caption = formData.get('caption') as string | null;
    const featured = formData.get('featured') === 'true';
    const enabled = formData.get('enabled') !== 'false';
    const displayOrder = parseInt(formData.get('displayOrder') as string) || 0;

    let screenshotUrl = formData.get('screenshotUrl') as string | null;

    // Handle file upload if provided
    if (screenshotFile && screenshotFile.size > 0) {
      try {
        const fileExt = screenshotFile.name.split('.').pop();
        const fileName = `testimonials/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabaseAdmin
          .storage
          .from('admin-media')
          .upload(fileName, screenshotFile, {
            contentType: screenshotFile.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('[POST /api/admin/content/testimonials] Upload error:', uploadError);
          return NextResponse.json({ error: 'Failed to upload screenshot' }, { status: 500 });
        }

        const { data: { publicUrl } } = supabaseAdmin
          .storage
          .from('admin-media')
          .getPublicUrl(fileName);

        screenshotUrl = publicUrl;
      } catch (uploadError) {
        console.error('[POST /api/admin/content/testimonials] Upload exception:', uploadError);
        return NextResponse.json({ error: 'Failed to upload screenshot' }, { status: 500 });
      }
    }

    if (!screenshotUrl) {
      return NextResponse.json({ error: 'Screenshot URL or file is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .insert({
        student_name: studentName,
        cohort,
        course,
        screenshot_url: screenshotUrl,
        caption,
        featured: featured || false,
        enabled: enabled !== undefined ? enabled : true,
        display_order: displayOrder || 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    console.error('[POST /api/admin/content/testimonials] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const studentName = formData.get('studentName') as string | null;
    const cohort = formData.get('cohort') as string | null;
    const course = formData.get('course') as string | null;
    const screenshotFile = formData.get('screenshotFile') as File | null;
    const caption = formData.get('caption') as string | null;
    const featured = formData.get('featured') === 'true';
    const enabled = formData.get('enabled') !== 'false';
    const displayOrder = parseInt(formData.get('displayOrder') as string) || 0;

    let screenshotUrl = formData.get('screenshotUrl') as string | null;

    // Handle file upload if provided
    if (screenshotFile && screenshotFile.size > 0) {
      try {
        const fileExt = screenshotFile.name.split('.').pop();
        const fileName = `testimonials/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabaseAdmin
          .storage
          .from('admin-media')
          .upload(fileName, screenshotFile, {
            contentType: screenshotFile.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('[PUT /api/admin/content/testimonials] Upload error:', uploadError);
          return NextResponse.json({ error: 'Failed to upload screenshot' }, { status: 500 });
        }

        const { data: { publicUrl } } = supabaseAdmin
          .storage
          .from('admin-media')
          .getPublicUrl(fileName);

        screenshotUrl = publicUrl;
      } catch (uploadError) {
        console.error('[PUT /api/admin/content/testimonials] Upload exception:', uploadError);
        return NextResponse.json({ error: 'Failed to upload screenshot' }, { status: 500 });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .update({
        student_name: studentName,
        cohort,
        course,
        screenshot_url: screenshotUrl,
        caption,
        featured,
        enabled,
        display_order: displayOrder,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    console.error('[PUT /api/admin/content/testimonials] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('testimonials')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/admin/content/testimonials] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}