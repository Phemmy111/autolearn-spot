'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

export async function uploadMediaFile(file: File) {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabaseAdmin
      .storage
      .from('admin-media')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from('admin-media')
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Upload Error:', error);
    return { success: false, error: error.message };
  }
}

export async function saveMediaSlider(data: {
  targetId: string;
  transitionStyle: string;
  durationMs: number;
  media: { url: string; type: string; orderIndex: number }[];
}) {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // 1. Check if slider exists for this target
    const { data: existingSlider } = await supabaseAdmin
      .from('page_sliders')
      .select('id')
      .eq('target_id', data.targetId)
      .single();

    let sliderId: string;

    if (existingSlider) {
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

      if (updateError) throw updateError;
      sliderId = updatedSlider.id;
    } else {
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

      if (insertError) throw insertError;
      sliderId = newSlider.id;
    }

    // 2. Delete existing media for this slider (simplest way to handle re-ordering/removals)
    await supabaseAdmin
      .from('slider_media')
      .delete()
      .eq('slider_id', sliderId);

    // 3. Insert new media
    if (data.media.length > 0) {
      const mediaToInsert = data.media.map(m => ({
        slider_id: sliderId,
        media_url: m.url,
        media_type: m.type,
        order_index: m.orderIndex
      }));

      const { error: mediaError } = await supabaseAdmin
        .from('slider_media')
        .insert(mediaToInsert);

      if (mediaError) throw mediaError;
    }

    revalidatePath('/admin/media-sliders');
    revalidatePath('/');
    revalidatePath('/skills');

    return { success: true };
  } catch (error: any) {
    console.error('Save Slider Error:', error);
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
