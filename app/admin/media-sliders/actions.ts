'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

export async function saveMediaSlider(data: {
  targetId: string;
  transitionStyle: string;
  durationMs: number;
  media: { url: string; type: string; orderIndex: number }[];
}) {
  console.log('[saveMediaSlider] Starting save with data:', JSON.stringify(data, null, 2));

  try {
    await requireAdmin();
    console.log('[saveMediaSlider] Admin auth check passed');
  } catch (error) {
    console.error('[saveMediaSlider] Admin auth failed:', error);
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // 1. Check if slider exists for this target
    console.log('[saveMediaSlider] Checking for existing slider with target_id:', data.targetId);
    const { data: existingSlider, error: checkError } = await supabaseAdmin
      .from('page_sliders')
      .select('id')
      .eq('target_id', data.targetId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[saveMediaSlider] Error checking existing slider:', checkError);
      throw checkError;
    }

    let sliderId: string;

    if (existingSlider) {
      console.log('[saveMediaSlider] Found existing slider with id:', existingSlider.id);
      // Update existing slider
      const { data: updatedSlider, error: updateError } = await supabaseAdmin
        .from('page_sliders')
        .update({
          transition_style: data.transitionStyle,
          duration_ms: data.durationMs,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSlider.id)
        .select()
        .single();

      if (updateError) {
        console.error('[saveMediaSlider] Error updating slider:', updateError);
        throw updateError;
      }
      sliderId = updatedSlider.id;
      console.log('[saveMediaSlider] Updated slider with id:', sliderId);
    } else {
      console.log('[saveMediaSlider] No existing slider, creating new one');
      // Create new slider
      const { data: newSlider, error: insertError } = await supabaseAdmin
        .from('page_sliders')
        .insert({
          target_id: data.targetId,
          transition_style: data.transitionStyle,
          duration_ms: data.durationMs,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[saveMediaSlider] Error creating slider:', insertError);
        throw insertError;
      }
      sliderId = newSlider.id;
      console.log('[saveMediaSlider] Created new slider with id:', sliderId);
    }

    // 2. Delete existing media for this slider (simplest way to handle re-ordering/removals)
    console.log('[saveMediaSlider] Deleting existing media for slider_id:', sliderId);
    const { error: deleteError } = await supabaseAdmin
      .from('slider_media')
      .delete()
      .eq('slider_id', sliderId);

    if (deleteError) {
      console.error('[saveMediaSlider] Error deleting existing media:', deleteError);
      throw deleteError;
    }
    console.log('[saveMediaSlider] Existing media deleted successfully');

    // 3. Insert new media
    if (data.media.length > 0) {
      console.log('[saveMediaSlider] Inserting', data.media.length, 'media items');
      const mediaToInsert = data.media.map(m => ({
        slider_id: sliderId,
        media_url: m.url,
        media_type: m.type,
        order_index: m.orderIndex
      }));

      console.log('[saveMediaSlider] Media to insert:', JSON.stringify(mediaToInsert, null, 2));

      const { error: mediaError } = await supabaseAdmin
        .from('slider_media')
        .insert(mediaToInsert);

      if (mediaError) {
        console.error('[saveMediaSlider] Error inserting media:', mediaError);
        throw mediaError;
      }
      console.log('[saveMediaSlider] Media inserted successfully');
    } else {
      console.log('[saveMediaSlider] No media items to insert');
    }

    console.log('[saveMediaSlider] Revalidating paths');
    revalidatePath('/admin/media-sliders');
    revalidatePath('/');
    revalidatePath('/skills');

    console.log('[saveMediaSlider] Save completed successfully');
    return { success: true };
  } catch (error: any) {
    console.error('[saveMediaSlider] Save Slider Error:', error);
    console.error('[saveMediaSlider] Error details:', JSON.stringify(error, null, 2));
    return { success: false, error: error.message };
  }
}

export async function deleteMediaSlider(id: string) {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await supabaseAdmin.from('page_sliders').delete().eq('id', id);
    revalidatePath('/admin/media-sliders');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
