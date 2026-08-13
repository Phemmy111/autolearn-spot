import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enabledOnly = searchParams.get('enabled') === 'true';

    let query = supabaseAdmin
      .from('workflow_showcase')
      .select('*')
      .order('display_order', { ascending: true });

    if (enabledOnly) {
      query = query.eq('enabled', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, items: data || [] });
  } catch (error) {
    console.error('[GET /api/admin/content/workflow-showcase] Error:', error);
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
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const mediaFile = formData.get('mediaFile') as File | null;
    const videoUrl = formData.get('videoUrl') as string | null;
    const thumbnailUrl = formData.get('thumbnailUrl') as string | null;
    const posterUrl = formData.get('posterUrl') as string | null;
    const featured = formData.get('featured') === 'true';
    const enabled = formData.get('enabled') !== 'false';
    const displayOrder = parseInt(formData.get('displayOrder') as string) || 0;
    const mediaType = formData.get('mediaType') as string || 'video';

    let finalVideoUrl = videoUrl;

    // Handle file upload if provided
    if (mediaFile && mediaFile.size > 0) {
      try {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `workflow-showcase/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabaseAdmin
          .storage
          .from('admin-media')
          .upload(fileName, mediaFile, {
            contentType: mediaFile.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('[POST /api/admin/content/workflow-showcase] Upload error:', uploadError);
          return NextResponse.json({ error: 'Failed to upload media' }, { status: 500 });
        }

        const { data: { publicUrl } } = supabaseAdmin
          .storage
          .from('admin-media')
          .getPublicUrl(fileName);

        finalVideoUrl = publicUrl;
      } catch (uploadError) {
        console.error('[POST /api/admin/content/workflow-showcase] Upload exception:', uploadError);
        return NextResponse.json({ error: 'Failed to upload media' }, { status: 500 });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('workflow_showcase')
      .insert({
        title,
        description,
        video_url: finalVideoUrl,
        thumbnail_url: thumbnailUrl,
        poster_url: posterUrl,
        featured: featured || false,
        enabled: enabled !== undefined ? enabled : true,
        display_order: displayOrder || 0,
        media_type: mediaType,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    console.error('[POST /api/admin/content/workflow-showcase] Error:', error);
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
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const mediaFile = formData.get('mediaFile') as File | null;
    const videoUrl = formData.get('videoUrl') as string | null;
    const thumbnailUrl = formData.get('thumbnailUrl') as string | null;
    const posterUrl = formData.get('posterUrl') as string | null;
    const featured = formData.get('featured') === 'true';
    const enabled = formData.get('enabled') !== 'false';
    const displayOrder = parseInt(formData.get('displayOrder') as string) || 0;
    const mediaType = formData.get('mediaType') as string || 'video';

    let finalVideoUrl = videoUrl;

    // Handle file upload if provided
    if (mediaFile && mediaFile.size > 0) {
      try {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `workflow-showcase/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabaseAdmin
          .storage
          .from('admin-media')
          .upload(fileName, mediaFile, {
            contentType: mediaFile.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('[PUT /api/admin/content/workflow-showcase] Upload error:', uploadError);
          return NextResponse.json({ error: 'Failed to upload media' }, { status: 500 });
        }

        const { data: { publicUrl } } = supabaseAdmin
          .storage
          .from('admin-media')
          .getPublicUrl(fileName);

        finalVideoUrl = publicUrl;
      } catch (uploadError) {
        console.error('[PUT /api/admin/content/workflow-showcase] Upload exception:', uploadError);
        return NextResponse.json({ error: 'Failed to upload media' }, { status: 500 });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('workflow_showcase')
      .update({
        title,
        description,
        video_url: finalVideoUrl,
        thumbnail_url: thumbnailUrl,
        poster_url: posterUrl,
        featured,
        enabled,
        display_order: displayOrder,
        media_type: mediaType,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    console.error('[PUT /api/admin/content/workflow-showcase] Error:', error);
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
      .from('workflow_showcase')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/admin/content/workflow-showcase] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}