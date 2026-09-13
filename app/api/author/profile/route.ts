import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

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
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
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

    const { data: author, error } = await supabaseAdmin
      .from('authors')
      .update({
        display_name,
        bio,
        profile_image,
        professional_title,
        years_of_experience,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating author profile:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, author });
  } catch (error) {
    console.error('Error updating author profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
