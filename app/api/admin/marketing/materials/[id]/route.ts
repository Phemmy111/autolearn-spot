import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, type, category, description } = body;

    console.log('[PUT /api/admin/marketing/materials/:id] Request body:', body);
    
    // Wait for params to resolve
    const resolvedParams = await params;
    console.log('[PUT /api/admin/marketing/materials/:id] Resolved params:', resolvedParams);

    // Build update object with only provided fields (avoid UUID columns)
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (name !== undefined && name !== null && name !== '') {
      updateData.resource_name = name;
    }
    if (type !== undefined && type !== null && type !== '') {
      updateData.resource_type = type;
    }
    if (category !== undefined && category !== null && category !== '') {
      updateData.category = category;
    }
    if (description !== undefined) {
      updateData.description = description;
    }

    console.log('[PUT /api/admin/marketing/materials/:id] Update data:', updateData);

    const { data, error } = await supabaseAdmin
      .from('partner_marketing_downloads')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) {
      console.error('[PUT /api/admin/marketing/materials/:id] Error:', error);
      return NextResponse.json({ error: 'Failed to update material', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, material: data });
  } catch (error) {
    console.error('[PUT /api/admin/marketing/materials/:id] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }
    
    // First get the material to get the file URL
    const { data: material } = await supabaseAdmin
      .from('partner_marketing_downloads')
      .select('resource_url')
      .eq('id', params.id)
      .single();

    if (material?.resource_url) {
      // Extract file path from URL
      const url = new URL(material.resource_url);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(pathParts.indexOf('marketing')).join('/');
      
      // Delete file from storage
      await supabaseAdmin.storage
        .from('assignment-submissions')
        .remove([filePath]);
    }

    // Delete from database
    const { error } = await supabaseAdmin
      .from('partner_marketing_downloads')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('[DELETE /api/admin/marketing/materials/:id] Error:', error);
      return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/admin/marketing/materials/:id] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}