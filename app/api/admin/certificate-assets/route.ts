import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const backgroundFile = formData.get('backgroundFile') as File | null;
    const logoFile = formData.get('logoFile') as File | null;
    const signatureFile = formData.get('signatureFile') as File | null;
    const backgroundUrl = formData.get('backgroundUrl') as string | null;
    const logoUrl = formData.get('logoUrl') as string | null;
    const signatureUrl = formData.get('signatureUrl') as string | null;

    const result: any = {};

    // Upload background
    if (backgroundFile && backgroundFile.size > 0) {
      const fileExt = backgroundFile.name.split('.').pop();
      const fileName = `certificates/background-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage
        .from('admin-media')
        .upload(fileName, backgroundFile, {
          contentType: backgroundFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('[POST /api/admin/certificate-assets] Background upload error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload background' }, { status: 500 });
      }

      const { data: { publicUrl } } = supabaseAdmin
        .storage
        .from('admin-media')
        .getPublicUrl(fileName);

      result.backgroundUrl = publicUrl;
    } else {
      result.backgroundUrl = backgroundUrl;
    }

    // Upload logo
    if (logoFile && logoFile.size > 0) {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `certificates/logo-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage
        .from('admin-media')
        .upload(fileName, logoFile, {
          contentType: logoFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('[POST /api/admin/certificate-assets] Logo upload error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 });
      }

      const { data: { publicUrl } } = supabaseAdmin
        .storage
        .from('admin-media')
        .getPublicUrl(fileName);

      result.logoUrl = publicUrl;
    } else {
      result.logoUrl = logoUrl;
    }

    // Upload signature
    if (signatureFile && signatureFile.size > 0) {
      const fileExt = signatureFile.name.split('.').pop();
      const fileName = `certificates/signature-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage
        .from('admin-media')
        .upload(fileName, signatureFile, {
          contentType: signatureFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('[POST /api/admin/certificate-assets] Signature upload error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload signature' }, { status: 500 });
      }

      const { data: { publicUrl } } = supabaseAdmin
        .storage
        .from('admin-media')
        .getPublicUrl(fileName);

      result.signatureUrl = publicUrl;
    } else {
      result.signatureUrl = signatureUrl;
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[POST /api/admin/certificate-assets] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}