'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function uploadMediaFile(file: File) {
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
    // 1. Upsert Slider Config
    const { data: slider, error: sliderError } = await supabaseAdmin
      .from('page_sliders')
      .upsert({
        target_id: data.targetId,
        transition_style: data.transitionStyle,
        duration_ms: data.durationMs,
        updated_at: new Date().toISOString()
      }, { onConflict: 'target_id' })
      .select()
      .single();

    if (sliderError) throw sliderError;

    // 2. Delete existing media for this slider (simplest way to handle re-ordering/removals)
    await supabaseAdmin
      .from('slider_media')
      .delete()
      .eq('slider_id', slider.id);

    // 3. Insert new media
    if (data.media.length > 0) {
      const mediaToInsert = data.media.map(m => ({
        slider_id: slider.id,
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
    await supabaseAdmin.from('page_sliders').delete().eq('id', id);
    revalidatePath('/admin/media-sliders');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
