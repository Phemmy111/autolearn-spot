import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { allDynamicTestimonials } from '@/config/testimonials';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enabledOnly = searchParams.get('enabled') === 'true';
    const featuredOnly = searchParams.get('featured') === 'true';

    let testimonialsList: any[] = [];

    // 1. Try fetching from testimonials table
    try {
      const { data, error } = await supabaseAdmin
        .from('testimonials')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        testimonialsList = data;
      }
    } catch (dbErr) {
      console.warn('[GET /api/content/testimonials] testimonials table lookup failed:', dbErr);
    }

    // 2. Fallback to site_settings if testimonials table is empty or missing
    if (testimonialsList.length === 0) {
      try {
        const { data: settingData } = await supabaseAdmin
          .from('site_settings')
          .select('value')
          .eq('key', 'site_testimonials')
          .single();

        if (settingData?.value) {
          const parsed = typeof settingData.value === 'string' ? JSON.parse(settingData.value) : settingData.value;
          if (Array.isArray(parsed) && parsed.length > 0) {
            testimonialsList = parsed;
          }
        }
      } catch (settingsErr) {
        console.warn('[GET /api/content/testimonials] site_settings fallback check failed:', settingsErr);
      }
    }

    // 3. Fallback to default high-quality static student testimonials
    if (testimonialsList.length === 0) {
      testimonialsList = allDynamicTestimonials;
    }

    // Apply filtering
    let filtered = testimonialsList;
    if (enabledOnly) {
      filtered = filtered.filter(t => t.enabled !== false);
    }
    if (featuredOnly) {
      filtered = filtered.filter(t => t.featured === true);
    }

    return NextResponse.json({ success: true, testimonials: filtered });
  } catch (error) {
    console.error('[GET /api/content/testimonials] Error:', error);
    // Even on error, return the default dynamic testimonials so the frontend never crashes
    return NextResponse.json({ success: true, testimonials: allDynamicTestimonials });
  }
}
