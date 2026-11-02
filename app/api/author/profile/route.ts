import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let author: any = null;

    // 1. Try finding by clerk_user_id
    try {
      const { data } = await supabaseAdmin
        .from('authors')
        .select('*')
        .eq('clerk_user_id', userId)
        .maybeSingle();
      if (data) author = data;
    } catch (e) {
      // column may not exist yet
    }

    // 2. Try finding by user_id
    if (!author) {
      try {
        const { data } = await supabaseAdmin
          .from('authors')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (data) author = data;
      } catch (e) {
        // ignore
      }
    }

    // 3. Fallback to any existing author (e.g. author_admin)
    if (!author) {
      try {
        const { data } = await supabaseAdmin
          .from('authors')
          .select('*')
          .limit(1)
          .maybeSingle();
        if (data) author = data;
      } catch (e) {
        // ignore
      }
    }

    return NextResponse.json({
      success: true,
      author: {
        id: author?.id || '',
        display_name: author?.display_name || author?.name || '',
        bio: author?.bio || '',
        profile_image: author?.profile_image || author?.avatar_url || '',
        professional_title: author?.professional_title || '',
        years_of_experience: author?.years_of_experience ?? null,
        email: author?.email || '',
        phone: author?.phone || '',
        location: author?.location || '',
        linkedin_profile: author?.linkedin_profile || '',
        website_portfolio: author?.website_portfolio || '',
        expertise: author?.expertise || [],
        cv_url: author?.cv_url || '',
        portfolio_samples_url: author?.portfolio_samples_url || '',
        id_document_url: author?.id_document_url || '',
      },
    });
  } catch (error) {
    console.error('Error fetching author profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      display_name, 
      bio, 
      profile_image, 
      professional_title, 
      years_of_experience,
      email,
      phone,
      location,
      linkedin_profile,
      website_portfolio,
      expertise
    } = body;

    // Full payload for extended schema
    const fullPayload: Record<string, any> = {
      clerk_user_id: userId,
      display_name,
      name: display_name,
      bio,
      profile_image,
      avatar_url: profile_image,
      professional_title,
      years_of_experience,
      email,
      phone,
      location,
      linkedin_profile,
      website_portfolio,
      expertise,
      updated_at: new Date().toISOString(),
    };

    // Try full update/upsert
    let result = await supabaseAdmin
      .from('authors')
      .update(fullPayload)
      .eq('clerk_user_id', userId)
      .select()
      .maybeSingle();

    if (result.error) {
      // Fallback: try updating basic columns that exist in basic schema
      const basicPayload = {
        name: display_name,
        avatar_url: profile_image,
        bio,
        email,
        updated_at: new Date().toISOString(),
      };

      const fallbackRes = await supabaseAdmin
        .from('authors')
        .update(basicPayload)
        .or(`user_id.eq.${userId},user_id.eq.author_admin`)
        .select()
        .maybeSingle();

      if (fallbackRes.error) {
        console.error('Error saving author profile:', fallbackRes.error);
        return NextResponse.json({ error: 'Failed to save profile: ' + fallbackRes.error.message }, { status: 500 });
      }
      result = fallbackRes;
    }

    // Also sync profiles table if possible
    try {
      await supabaseAdmin
        .from('profiles')
        .update({
          full_name: display_name,
          avatar_url: profile_image,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_user_id', userId);
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ success: true, author: result.data });
  } catch (error) {
    console.error('Error saving author profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
