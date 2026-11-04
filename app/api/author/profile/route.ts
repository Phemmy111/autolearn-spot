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

    // 1. Try finding by clerk_user_id or user_id
    try {
      const { data } = await supabaseAdmin
        .from('authors')
        .select('*')
        .or(`clerk_user_id.eq.${userId},user_id.eq.${userId}`)
        .limit(1)
        .maybeSingle();
      if (data) author = data;
    } catch (e) {
      // ignore
    }

    // 2. Fallback to any existing author (e.g. author_admin)
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

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    // Load extra metadata from site_settings
    let extraData: any = {};
    try {
      const { data: setting } = await supabaseAdmin
        .from('site_settings')
        .select('value')
        .or(`key.eq.author_extra_${author.id},key.eq.author_extra_${author.user_id}`)
        .limit(1)
        .maybeSingle();
      if (setting?.value) {
        extraData = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
      }
    } catch (e) {
      console.warn('Could not load author extra settings:', e);
    }

    const profileImage = author?.profile_image || author?.avatar_url || extraData.profile_image || '';
    const displayName = author?.display_name || author?.name || extraData.display_name || '';
    const professionalTitle = author?.professional_title || extraData.professional_title || '';
    const bio = author?.bio || extraData.bio || '';
    const email = author?.email || extraData.email || '';

    return NextResponse.json({
      success: true,
      author: {
        id: author.id,
        display_name: displayName,
        bio: bio,
        profile_image: profileImage,
        avatar_url: profileImage,
        professional_title: professionalTitle,
        years_of_experience: extraData.years_of_experience ?? author?.years_of_experience ?? null,
        email: email,
        phone: extraData.phone || author?.phone || '',
        location: extraData.location || author?.location || '',
        linkedin_profile: extraData.linkedin_profile || author?.linkedin_profile || '',
        website_portfolio: extraData.website_portfolio || author?.website_portfolio || '',
        expertise: Array.isArray(extraData.expertise) ? extraData.expertise : (Array.isArray(author?.expertise) ? author.expertise : []),
        cv_url: author?.cv_url || extraData.cv_url || '',
        portfolio_samples_url: author?.portfolio_samples_url || extraData.portfolio_samples_url || '',
        id_document_url: author?.id_document_url || extraData.id_document_url || '',
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

    // 1. Locate the author record
    let author: any = null;
    try {
      const { data } = await supabaseAdmin
        .from('authors')
        .select('*')
        .or(`clerk_user_id.eq.${userId},user_id.eq.${userId}`)
        .limit(1)
        .maybeSingle();
      if (data) author = data;
    } catch (e) {
      // ignore
    }

    if (!author) {
      const { data } = await supabaseAdmin
        .from('authors')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (data) author = data;
    }

    if (!author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 404 });
    }

    // 2. Update real existing columns in authors table
    const authorUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (display_name !== undefined) {
      authorUpdates.display_name = display_name;
      authorUpdates.name = display_name;
    }
    if (bio !== undefined) authorUpdates.bio = bio;
    if (profile_image !== undefined) {
      authorUpdates.profile_image = profile_image;
      authorUpdates.avatar_url = profile_image;
    }
    if (professional_title !== undefined) authorUpdates.professional_title = professional_title;
    if (email !== undefined) authorUpdates.email = email;

    let updatedAuthor: any = author;
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('authors')
      .update(authorUpdates)
      .eq('id', author.id)
      .select()
      .maybeSingle();

    if (updateError) {
      console.warn('Full update on authors failed, trying minimal columns:', updateError.message);
      const minimalUpdates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (display_name !== undefined) minimalUpdates.name = display_name;
      if (bio !== undefined) minimalUpdates.bio = bio;
      if (profile_image !== undefined) minimalUpdates.avatar_url = profile_image;
      if (email !== undefined) minimalUpdates.email = email;

      const { data: minData } = await supabaseAdmin
        .from('authors')
        .update(minimalUpdates)
        .eq('id', author.id)
        .select()
        .maybeSingle();

      if (minData) updatedAuthor = minData;
    } else if (updateData) {
      updatedAuthor = updateData;
    }

    // 3. Save extended metadata to site_settings
    const settingKey = `author_extra_${author.id}`;
    let existingExtra: any = {};
    try {
      const { data: currentSetting } = await supabaseAdmin
        .from('site_settings')
        .select('value')
        .eq('key', settingKey)
        .maybeSingle();
      if (currentSetting?.value) {
        existingExtra = typeof currentSetting.value === 'string' ? JSON.parse(currentSetting.value) : currentSetting.value;
      }
    } catch (e) {
      // ignore
    }

    const mergedExtra = {
      ...existingExtra,
      ...(display_name !== undefined && { display_name }),
      ...(professional_title !== undefined && { professional_title }),
      ...(profile_image !== undefined && { profile_image }),
      ...(bio !== undefined && { bio }),
      ...(email !== undefined && { email }),
      ...(years_of_experience !== undefined && { years_of_experience }),
      ...(phone !== undefined && { phone }),
      ...(location !== undefined && { location }),
      ...(linkedin_profile !== undefined && { linkedin_profile }),
      ...(website_portfolio !== undefined && { website_portfolio }),
      ...(expertise !== undefined && { expertise }),
    };

    try {
      await supabaseAdmin
        .from('site_settings')
        .upsert({
          key: settingKey,
          value: JSON.stringify(mergedExtra),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });

      if (author.user_id && author.user_id !== author.id) {
        await supabaseAdmin
          .from('site_settings')
          .upsert({
            key: `author_extra_${author.user_id}`,
            value: JSON.stringify(mergedExtra),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'key' });
      }
    } catch (extraErr) {
      console.error('Failed to save author extra to site_settings:', extraErr);
    }

    // 4. Sync profiles table if possible
    try {
      await supabaseAdmin
        .from('profiles')
        .update({
          ...(display_name && { full_name: display_name }),
          ...(profile_image && { avatar_url: profile_image }),
          updated_at: new Date().toISOString(),
        })
        .or(`clerk_user_id.eq.${userId},id.eq.${author.id}`);
    } catch (e) {
      // ignore
    }

    const finalProfileImage = updatedAuthor.profile_image || updatedAuthor.avatar_url || profile_image || '';
    const finalDisplayName = updatedAuthor.display_name || updatedAuthor.name || display_name || '';
    const finalTitle = updatedAuthor.professional_title || professional_title || '';

    return NextResponse.json({
      success: true,
      author: {
        id: updatedAuthor.id,
        display_name: finalDisplayName,
        bio: updatedAuthor.bio || bio || '',
        profile_image: finalProfileImage,
        avatar_url: finalProfileImage,
        professional_title: finalTitle,
        years_of_experience: years_of_experience ?? mergedExtra.years_of_experience ?? null,
        email: updatedAuthor.email || email || '',
        phone: phone ?? mergedExtra.phone ?? '',
        location: location ?? mergedExtra.location ?? '',
        linkedin_profile: linkedin_profile ?? mergedExtra.linkedin_profile ?? '',
        website_portfolio: website_portfolio ?? mergedExtra.website_portfolio ?? '',
        expertise: expertise ?? mergedExtra.expertise ?? [],
      },
    });
  } catch (error) {
    console.error('Error saving author profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
