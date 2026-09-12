import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Allow both authenticated and unauthenticated file uploads
    // This enables the unauthenticated application flow
    const { userId } = await auth();
    
    // Debug: List available buckets
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    console.log('[Upload] Available storage buckets:', buckets?.map(b => b.name));
    
    const formData = await request.formData();
    const cvFile = formData.get('cvFile') as File | null;
    const portfolioFile = formData.get('portfolioFile') as File | null;
    const idFile = formData.get('idFile') as File | null;

    const result: any = {};

    // Handle CV upload
    if (cvFile && cvFile.size > 0) {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (!validTypes.includes(cvFile.type)) {
        return NextResponse.json({ error: 'Invalid CV format. Must be PDF, DOC, or DOCX' }, { status: 400 });
      }

      if (cvFile.size > 5 * 1024 * 1024) { // 5MB limit
        return NextResponse.json({ error: 'CV file too large. Maximum size is 5MB' }, { status: 400 });
      }

      const fileExt = cvFile.name.split('.').pop();
      const fileName = `cv-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      console.log('[Upload] Attempting to upload CV to bucket: author-documents');
      console.log('[Upload] File name:', fileName);

      const { error: uploadError } = await supabaseAdmin
        .storage
        .from('author-documents')
        .upload(fileName, cvFile, {
          contentType: cvFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('[POST /api/author-applications/upload] CV upload error:', uploadError);
        
        // Check if it's an RLS/permission error
        if (uploadError.message?.includes('permission') || uploadError.message?.includes('policy')) {
          return NextResponse.json({ 
            error: 'Storage permission error. Please configure RLS policies for author-documents bucket.',
            details: uploadError.message 
          }, { status: 403 });
        }
        
        return NextResponse.json({ error: 'Failed to upload CV' }, { status: 500 });
      }

      let cvUrl = null;
      try {
        const { data: { publicUrl } } = supabaseAdmin
          .storage
          .from('author-documents')
          .getPublicUrl(fileName);
        cvUrl = publicUrl;
        console.log('[Upload] CV public URL generated:', cvUrl);
      } catch (urlError) {
        console.error('[Upload] Error getting public URL for CV:', urlError);
        // If bucket doesn't exist, we still store the file but won't have a public URL
        cvUrl = `author-documents/${fileName}`;
      }

      result.cvUrl = cvUrl;
    }

    // Handle Portfolio upload
    if (portfolioFile && portfolioFile.size > 0) {
      const validTypes = ['application/pdf', 'application/zip', 'application/x-zip-compressed'];
      
      if (!validTypes.includes(portfolioFile.type)) {
        return NextResponse.json({ error: 'Invalid portfolio format. Must be PDF or ZIP' }, { status: 400 });
      }

      if (portfolioFile.size > 10 * 1024 * 1024) { // 10MB limit
        return NextResponse.json({ error: 'Portfolio file too large. Maximum size is 10MB' }, { status: 400 });
      }

      const fileExt = portfolioFile.name.split('.').pop();
      const fileName = `portfolio-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabaseAdmin
        .storage
        .from('author-documents')
        .upload(fileName, portfolioFile, {
          contentType: portfolioFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('[POST /api/author-applications/upload] Portfolio upload error:', uploadError);
        
        // Check if it's an RLS/permission error
        if (uploadError.message?.includes('permission') || uploadError.message?.includes('policy')) {
          return NextResponse.json({ 
            error: 'Storage permission error. Please configure RLS policies for author-documents bucket.',
            details: uploadError.message 
          }, { status: 403 });
        }
        
        return NextResponse.json({ error: 'Failed to upload portfolio' }, { status: 500 });
      }

      let portfolioUrl = null;
      try {
        const { data: { publicUrl } } = supabaseAdmin
          .storage
          .from('author-documents')
          .getPublicUrl(fileName);
        portfolioUrl = publicUrl;
      } catch (urlError) {
        console.error('[Upload] Error getting public URL for portfolio:', urlError);
        portfolioUrl = `author-documents/${fileName}`;
      }

      result.portfolioUrl = portfolioUrl;
    }

    // Handle ID Document upload
    if (idFile && idFile.size > 0) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      
      if (!validTypes.includes(idFile.type)) {
        return NextResponse.json({ error: 'Invalid ID format. Must be PDF, JPG, or PNG' }, { status: 400 });
      }

      if (idFile.size > 5 * 1024 * 1024) { // 5MB limit
        return NextResponse.json({ error: 'ID file too large. Maximum size is 5MB' }, { status: 400 });
      }

      const fileExt = idFile.name.split('.').pop();
      const fileName = `id-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabaseAdmin
        .storage
        .from('author-documents')
        .upload(fileName, idFile, {
          contentType: idFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('[POST /api/author-applications/upload] ID upload error:', uploadError);
        
        // Check if it's an RLS/permission error
        if (uploadError.message?.includes('permission') || uploadError.message?.includes('policy')) {
          return NextResponse.json({ 
            error: 'Storage permission error. Please configure RLS policies for author-documents bucket.',
            details: uploadError.message 
          }, { status: 403 });
        }
        
        return NextResponse.json({ error: 'Failed to upload ID document' }, { status: 500 });
      }

      let idUrl = null;
      try {
        const { data: { publicUrl } } = supabaseAdmin
          .storage
          .from('author-documents')
          .getPublicUrl(fileName);
        idUrl = publicUrl;
      } catch (urlError) {
        console.error('[Upload] Error getting public URL for ID:', urlError);
        idUrl = `author-documents/${fileName}`;
      }

      result.idUrl = idUrl;
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[POST /api/author-applications/upload] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
