import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      fullName,
      email,
      phone,
      location,
      professionalTitle,
      yearsOfExperience,
      linkedinProfile,
      portfolioLink,
      expertiseArea,
      bio,
      whyBecomeAuthor,
      cvUrl,
      portfolioUrl,
      idUrl,
    } = body;

    // Validate required fields
    if (!fullName || !email || !phone || !location || !professionalTitle || !yearsOfExperience || !expertiseArea || !bio) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already has an application
    const { data: existingApplication } = await supabaseAdmin
      .from('author_applications')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You already have an application pending or approved' },
        { status: 400 }
      );
    }

    // Create new application
    const { data: application, error } = await supabaseAdmin
      .from('author_applications')
      .insert({
        user_id: userId,
        full_name: fullName,
        email,
        phone,
        location,
        professional_title: professionalTitle,
        years_of_experience: yearsOfExperience,
        linkedin_profile: linkedinProfile || null,
        portfolio_url: portfolioLink || null,
        expertise: expertiseArea.split(', '),
        bio,
        motivation: whyBecomeAuthor || bio,
        cv_url: cvUrl || null,
        portfolio_samples_url: portfolioUrl || null,
        id_document_url: idUrl || null,
        status: 'SUBMITTED',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating author application:', error);
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, application },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in author application API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's application
    const { data: application, error } = await supabaseAdmin
      .from('author_applications')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching author application:', error);
      return NextResponse.json(
        { error: 'Failed to fetch application' },
        { status: 500 }
      );
    }

    return NextResponse.json({ application: application || null });
  } catch (error) {
    console.error('Error in author application GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}