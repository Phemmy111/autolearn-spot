import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `marketing/${Date.now()}-${safeName}`;

    // Upload to admin-media or assignment-submissions
    const { error: uploadError } = await supabaseAdmin.storage
      .from('admin-media')
      .upload(fileName, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error (admin-media), trying assignment-submissions:', uploadError);
      
      const { error: fallbackError } = await supabaseAdmin.storage
        .from('assignment-submissions')
        .upload(fileName, buffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: true,
        });

      if (fallbackError) {
        console.error('Fallback upload error:', fallbackError);
        return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from('assignment-submissions')
        .getPublicUrl(fileName);

      return NextResponse.json({
        success: true,
        url: publicUrlData.publicUrl,
        fileName: file.name,
      });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('admin-media')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      fileName: file.name,
    });
  } catch (error: any) {
    console.error('Error in marketing upload:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
