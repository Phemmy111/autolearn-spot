import { getPublishedProductsBySkill } from '@/lib/public-product-service';
import { MarketplaceProductGrid } from '@/components/marketplace/MarketplaceProductGrid';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { Tag } from 'lucide-react';
import { DynamicSlider } from '@/components/ui/DynamicSlider';
import { ALL_SKILLS } from '@/lib/taxonomy';
import { getSkillSliderMedia } from '@/lib/skill-slider-defaults';

interface PageParams {
  params: Promise<{ slug: string }>;
}

export default async function SkillPage({ params }: PageParams) {
  const { slug } = await params;
  
  // Get skill info from supabase or fallback to taxonomy
  const { data: skill } = await supabaseAdmin
    .from('skills')
    .select('id, name, description')
    .eq('slug', slug)
    .single();

  const taxonomySkill = ALL_SKILLS.find(s => s.id === slug);

  // Fetch slider config for this skill if it exists
  const skillId = skill?.id || slug;
  const { data: sliderConfig } = await supabaseAdmin
    .from('page_sliders')
    .select('*, slider_media(*)')
    .eq('target_id', `skill:${skillId}`)
    .single();

  const hasCustomSlider = sliderConfig && sliderConfig.slider_media && sliderConfig.slider_media.length > 0;
  const sortedCustomMedia = hasCustomSlider ? sliderConfig.slider_media.sort((a: any, b: any) => a.order_index - b.order_index) : [];

  const defaultSlider = getSkillSliderMedia(skillId);
  const activeMedia = hasCustomSlider ? sortedCustomMedia : defaultSlider.media;
  const activeTransition = hasCustomSlider ? sliderConfig.transition_style : defaultSlider.transitionStyle;
  const activeDuration = hasCustomSlider ? sliderConfig.duration_ms : defaultSlider.durationMs;

  const products = await getPublishedProductsBySkill(slug);
  const title = skill?.name || taxonomySkill?.name || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-[var(--card)] brightness-95 border-b border-brand-border relative overflow-hidden">
        {activeMedia && activeMedia.length > 0 && (
          <div className="absolute inset-0 z-0">
            <DynamicSlider
              media={activeMedia}
              transitionStyle={activeTransition}
              durationMs={activeDuration}
              className="w-full h-full opacity-25"
              showIndicators={false}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-bg/90 via-brand-bg/80 to-brand-bg/50" />
          </div>
        )}

        <div className="container relative z-10 mx-auto px-6 lg:px-12 py-16 pt-28">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center backdrop-blur-sm border border-brand-primary/20">
              <Tag className="w-6 h-6 text-brand-primary" />
            </div>
            <h1 className="text-3xl lg:text-5xl font-bold text-brand-text tracking-tight">
              {title} Courses
            </h1>
          </div>
          <p className="text-brand-text/70 text-lg max-w-2xl leading-relaxed">
            {skill?.description || `Master ${title} with our premium, expert-led courses and digital resources.`}
          </p>
        </div>
      </div>

      <MarketplaceProductGrid products={products} />
    </div>
  );
}
