import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { EmailService } from '@/lib/email-service';
import { ClerkService } from '@/lib/clerk-service';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { admin_review_note } = body;

    // Get the application
    const { data: application, error: appError } = await supabaseAdmin
      .from('author_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status === 'APPROVED' || application.status === 'ACTIVE') {
      return NextResponse.json({ error: 'Application already approved' }, { status: 400 });
    }

    // Check if author profile already exists for this user
    const { data: existingAuthor } = await supabaseAdmin
      .from('authors')
      .select('*')
      .eq('clerk_user_id', application.user_id)
      .single();

    if (existingAuthor) {
      // Just update the application status
      const { data: updatedApp, error: updateError } = await supabaseAdmin
        .from('author_applications')
        .update({
          status: 'APPROVED',
          admin_review_note,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating application:', updateError);
        return NextResponse.json({ error: 'Failed to approve application' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        application: updatedApp,
        author: existingAuthor,
        message: 'Application approved. Author profile already exists.',
      });
    }

    // Create new author profile
    const { data: author, error: authorError } = await supabaseAdmin
      .from('authors')
      .insert({
        clerk_user_id: application.user_id,
        display_name: application.full_name,
        email: application.email,
        bio: application.bio,
        status: 'ACTIVE',
        professional_title: application.professional_title,
        years_of_experience: application.years_of_experience,
        linkedin_profile: application.linkedin_profile,
        website_portfolio: application.website_portfolio,
        phone: application.phone,
        location: application.location,
        expertise: application.expertise,
        cv_url: application.cv_url,
        portfolio_samples_url: application.portfolio_samples_url,
        id_document_url: application.id_document_url,
        application_id: application.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (authorError) {
      console.error('Error creating author profile:', authorError);
      return NextResponse.json({ error: 'Failed to create author profile' }, { status: 500 });
    }

    // Initialize author earnings
    await supabaseAdmin
      .from('author_earnings')
      .insert({
        author_id: author.id,
        total_gross: 0,
        total_commission: 0,
        total_net: 0,
        updated_at: new Date().toISOString(),
      });

    // Update application status
    const { data: updatedApp, error: updateError } = await supabaseAdmin
      .from('author_applications')
      .update({
        status: 'APPROVED',
        admin_review_note,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating application:', updateError);
      return NextResponse.json({ error: 'Failed to approve application' }, { status: 500 });
    }

    // Note: Clerk account provisioning is handled via the existing authentication flow
    // The applicant already has a Clerk account from the application process
    // In the future, we can implement Clerk Backend API for true account creation
    
    // Send approval email
    try {
      await EmailService.sendApplicationApproved(
        application.email,
        application.full_name,
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/author`
      );
      console.log('[Admin Approval] Approval email sent to:', application.email);
    } catch (emailError) {
      console.error('[Admin Approval] Failed to send approval email:', emailError);
      // Don't fail the approval if email fails
    }

    return NextResponse.json({
      success: true,
      application: updatedApp,
      author,
      message: 'Application approved and author profile created. User can access author portal with existing credentials.',
    });
  } catch (error) {
    console.error('Error in approve application API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
