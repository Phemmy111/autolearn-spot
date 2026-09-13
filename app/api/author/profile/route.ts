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

    const { data: author, error } = await supabaseAdmin
      .from('authors')
      .select('display_name, bio, profile_image, professional_title, years_of_experience')
      .eq('id', userId)
      .single();

    if (error) {
      // No row yet — return empty author so the UI can still render
      return NextResponse.json({
        success: true,
        author: {
          display_name: '',
          bio: '',
          profile_image: '',
          professional_title: '',
          years_of_experience: null,
        },
      });
    }

    return NextResponse.json({ success: true, author });
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
    const { display_name, bio, profile_image, professional_title, years_of_experience } = body;

    // Use upsert so it creates the row on first save
    const { data: author, error } = await supabaseAdmin
      .from('authors')
      .upsert(
        {
          id: userId,
          display_name,
          bio,
          profile_image,
          professional_title,
          years_of_experience,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error saving author profile:', error);
      return NextResponse.json({ error: 'Failed to save profile: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, author });
  } catch (error) {
    console.error('Error saving author profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
