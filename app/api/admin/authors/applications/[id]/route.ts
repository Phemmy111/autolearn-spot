import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { EmailService } from '@/lib/email-service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id } = await params;

    console.log('[Admin Application Details] Fetching application with ID:', id);

    const { data: application, error } = await supabaseAdmin
      .from('author_applications')
      .select('*')
      .eq('id', id)
      .single();

    console.log('[Admin Application Details] Query result:', { error, application });

    if (error) {
      console.error('[Admin Application Details] Database error:', error);
      return NextResponse.json({ error: 'Application not found', details: error.message }, { status: 404 });
    }

    if (!application) {
      console.warn('[Admin Application Details] No application found for ID:', id);
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Generate signed URLs for documents to bypass RLS restrictions
    const signedUrls: any = {};
    
    if (application.cv_url) {
      try {
        const { data: signedUrlData } = await supabaseAdmin
          .storage
          .from('author-documents')
          .createSignedUrl(application.cv_url, 60 * 60); // 1 hour expiry
        signedUrls.cv = signedUrlData.signedUrl;
      } catch (error) {
        console.error('[Admin Application Details] Error generating signed URL for CV:', error);
      }
    }
    
    if (application.portfolio_samples_url) {
      try {
        const { data: signedUrlData } = await supabaseAdmin
          .storage
          .from('author-documents')
          .createSignedUrl(application.portfolio_samples_url, 60 * 60);
        signedUrls.portfolio = signedUrlData.signedUrl;
      } catch (error) {
        console.error('[Admin Application Details] Error generating signed URL for portfolio:', error);
      }
    }
    
    if (application.id_document_url) {
      try {
        const { data: signedUrlData } = await supabaseAdmin
          .storage
          .from('author-documents')
          .createSignedUrl(application.id_document_url, 60 * 60);
        signedUrls.id = signedUrlData.signedUrl;
      } catch (error) {
        console.error('[Admin Application Details] Error generating signed URL for ID:', error);
      }
    }

    console.log('[Admin Application Details] Successfully fetched application:', application.id);
    return NextResponse.json({ application, signedUrls });
  } catch (error) {
    console.error('[Admin Application Details] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, admin_review_note } = body;

    // First get the current application data for email sending
    const { data: currentApplication } = await supabaseAdmin
      .from('author_applications')
      .select('*')
      .eq('id', id)
      .single();

    const { data: application, error } = await supabaseAdmin
      .from('author_applications')
      .update({
        status,
        admin_review_note,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating application status:', error);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    // Send email notification based on status change
    try {
      if (status === 'UNDER_REVIEW' && currentApplication) {
        await EmailService.sendApplicationUnderReview(currentApplication.email, currentApplication.full_name);
        console.log('[Admin Update] Under review email sent to:', currentApplication.email);
      }
    } catch (emailError) {
      console.error('[Admin Update] Failed to send status change email:', emailError);
      // Don't fail the update if email fails
    }

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error('Error in admin application update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
