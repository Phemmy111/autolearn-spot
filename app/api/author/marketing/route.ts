import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/author/marketing
 * Fetch author's products and marketing materials
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get author
    const { data: author, error: authorErr } = await supabaseAdmin
      .from('authors')
      .select('id, display_name, email')
      .eq('clerk_user_id', userId)
      .single();

    if (authorErr || !author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 404 });
    }

    // Fetch author's products
    const { data: products, error: prodErr } = await supabaseAdmin
      .from('learning_products')
      .select('id, title, slug, thumbnail_url, price, status, affiliate_enabled, affiliate_commission_rate')
      .eq('author_id', author.id)
      .order('created_at', { ascending: false });

    if (prodErr) {
      console.error('Error fetching author products:', prodErr);
    }

    // Authors can see 'general' resources, plus any resources categorized under their own product titles
    const authorProductTitles = (products || []).map(p => p.title);
    
    const { data: resources, error: resErr } = await supabaseAdmin
      .from('partner_marketing_downloads')
      .select('*')
      .order('created_at', { ascending: false });

    if (resErr) {
      console.error('Error fetching marketing downloads:', resErr);
    }

    // Filter resources in memory (simpler than complex Supabase OR queries with arrays)
    const filteredResources = (resources || []).filter(item => {
      if (!item.category || item.category === 'general') return true;
      return authorProductTitles.includes(item.category);
    });

    // Normalize resources
    const transformedResources = filteredResources.map((item) => ({
      id: item.id,
      name: item.resource_name,
      type: item.resource_type || 'flyer',
      category: item.category || 'general',
      description: item.description || '',
      url: item.resource_url || '',
      download_count: item.download_count || 0,
      created_at: item.created_at,
    }));

    return NextResponse.json({
      success: true,
      author,
      products: products || [],
      resources: transformedResources,
    });
  } catch (error: any) {
    console.error('Error in GET /api/author/marketing:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/author/marketing
 * Create a new marketing material for affiliates
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: author, error: authorErr } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (authorErr || !author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { resource_name, resource_type, category, description, resource_url } = body;

    if (!resource_name || resource_name.trim() === '') {
      return NextResponse.json({ error: 'Material name/title is required' }, { status: 400 });
    }

    const payload = {
      resource_name: resource_name.trim(),
      resource_type: resource_type || 'flyer',
      type: resource_type || 'flyer',
      category: category?.trim() || 'general',
      description: description?.trim() || null,
      resource_url: resource_url?.trim() || '',
      download_count: 0,
      // partner_id left null intentionally as this is author-uploaded content
    };

    const { data: newResource, error: insertErr } = await supabaseAdmin
      .from('partner_marketing_downloads')
      .insert(payload)
      .select()
      .single();

    if (insertErr) {
      console.error('Error inserting marketing material:', insertErr);
      return NextResponse.json({ error: 'Failed to create marketing material' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      resource: {
        id: newResource.id,
        name: newResource.resource_name,
        type: newResource.resource_type,
        category: newResource.category,
        description: newResource.description,
        url: newResource.resource_url,
        download_count: newResource.download_count,
        created_at: newResource.created_at,
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/author/marketing:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/author/marketing
 * Delete a marketing resource by ID
 */
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
    }

    const { error: deleteErr } = await supabaseAdmin
      .from('partner_marketing_downloads')
      .delete()
      .eq('id', id);

    if (deleteErr) {
      console.error('Error deleting marketing resource:', deleteErr);
      return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/author/marketing:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/author/marketing
 * Update an existing marketing material
 */
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, resource_name, resource_type, category, description, resource_url } = body;

    if (!id) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
    }

    if (!resource_name || resource_name.trim() === '') {
      return NextResponse.json({ error: 'Material name/title is required' }, { status: 400 });
    }

    const payload = {
      resource_name: resource_name.trim(),
      resource_type: resource_type || 'flyer',
      type: resource_type || 'flyer',
      category: category?.trim() || 'general',
      description: description?.trim() || null,
      resource_url: resource_url?.trim() || '',
      updated_at: new Date().toISOString(),
    };

    const { data: updatedResource, error: updateErr } = await supabaseAdmin
      .from('partner_marketing_downloads')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      console.error('Error updating marketing material:', updateErr);
      return NextResponse.json({ error: 'Failed to update marketing material' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      resource: {
        id: updatedResource.id,
        name: updatedResource.resource_name,
        type: updatedResource.resource_type,
        category: updatedResource.category,
        description: updatedResource.description,
        url: updatedResource.resource_url,
        download_count: updatedResource.download_count,
        created_at: updatedResource.created_at,
      },
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/author/marketing:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
