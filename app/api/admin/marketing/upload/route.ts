import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;

    if (!file || !name) {
      return NextResponse.json({ error: 'File and name are required' }, { status: 400 });
    }

    // Upload file to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('assignment-submissions')
      .upload(`marketing/${fileName}`, file);

    if (uploadError) {
      console.error('File upload error:', uploadError);
      console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
      
      // Check if bucket exists
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      console.log('Available buckets:', buckets?.map(b => b.name));
      
      return NextResponse.json({ 
        error: 'Failed to upload file', 
        details: uploadError.message,
        availableBuckets: buckets?.map(b => b.name)
      }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('assignment-submissions')
      .getPublicUrl(`marketing/${fileName}`);

    // Save metadata to database
    try {
      console.log('[POST /api/admin/marketing/upload] Attempting to save metadata:', {
        name,
        type,
        category,
        description,
        file_url: publicUrl,
        file_name: fileName
      });

      // Build insert object with only required fields
      const insertData: any = {
        name,
        file_url: publicUrl,
        file_name: fileName,
        download_count: 0
      };

      // Only add optional fields if they have values
      if (type) insertData.type = type;
      if (category) insertData.category = category;
      if (description) insertData.description = description;

      console.log('[POST /api/admin/marketing/upload] Insert data:', insertData);

      const { error: dbError } = await supabaseAdmin
        .from('partner_marketing_downloads')
        .insert(insertData);

      if (dbError) {
        console.error('[POST /api/admin/marketing/upload] Database error:', dbError);
        console.error('[POST /api/admin/marketing/upload] Error code:', dbError.code);
        console.error('[POST /api/admin/marketing/upload] Error message:', dbError.message);
        console.error('[POST /api/admin/marketing/upload] Error details:', dbError.details);
        // Return error since metadata save failed
        return NextResponse.json({ 
          error: 'File uploaded but metadata save failed', 
          details: dbError.message,
          code: dbError.code
        }, { status: 500 });
      } else {
        console.log('[POST /api/admin/marketing/upload] Metadata saved successfully');
      }
    } catch (dbError) {
      console.error('[POST /api/admin/marketing/upload] Database insert error:', dbError);
      // Return error since metadata save failed
      return NextResponse.json({ 
        error: 'File uploaded but metadata save failed', 
        details: String(dbError)
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error('[POST /api/admin/marketing/upload] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}