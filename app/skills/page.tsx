import Link from 'next/link';
import { Tag, ArrowRight, Home, ChevronRight, Search } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase';
import { DynamicSlider } from '@/components/ui/DynamicSlider';
import { SKILLS_BY_CATEGORY, CATEGORIES } from '@/lib/taxonomy';
import SkillsSearch from './SkillsSearch';

export const dynamic = 'force-dynamic';

export default async function SkillsPage() {
  // Get all skills from taxonomy (flattened from categories)
  const skillsFromTaxonomy = [];
  for (const category of CATEGORIES) {
    const skills = SKILLS_BY_CATEGORY[category] || [];
    for (const skill of skills) {
      skillsFromTaxonomy.push({
        id: skill.id,
        name: skill.name,
        slug: skill.id,
        description: `Learn ${skill.name} through our comprehensive courses and resources.`,
        category
      });
    }
  }

  // Fetch slider media for skills
  const skillIds = skillsFromTaxonomy.map(s => s.id);
  const { data: sliderConfigs } = skillIds.length > 0
    ? await supabaseAdmin
        .from('page_sliders')
        .select('*, slider_media(*)')
        .in('target_id', skillIds.map(id => `skill:${id}`))
    : { data: [] };

  // Create a map of skill_id to slider media
  const sliderMediaMap = new Map();
  (sliderConfigs || []).forEach(slider => {
    const skillId = slider.target_id.replace('skill:', '');
    if (slider.slider_media && slider.slider_media.length > 0) {
      const sortedMedia = slider.slider_media.sort((a: any, b: any) => a.order_index - b.order_index);
      sliderMediaMap.set(skillId, {
        media: sortedMedia,
        transitionStyle: slider.transition_style,
        durationMs: slider.duration_ms
      });
    }
  });

  // Fetch published products separately to count per skill
  const { data: products } = skillIds.length > 0
    ? await supabaseAdmin
        .from('learning_products')
        .select('id, skill_id, status')
        .in('skill_id', skillIds)
        .eq('status', 'PUBLISHED')
    : { data: [] };

  const validSkills = skillsFromTaxonomy.map(skill => {
    const publishedCount = (products || []).filter(p => p.skill_id === skill.id).length;
    return { ...skill, publishedCount };
  });

  // Array of beautiful modern gradients for the skill cards (fallback when no slider media)
  const gradients = [
    'from-emerald-500/20 to-teal-900/40',
    'from-blue-500/20 to-indigo-900/40',
    'from-purple-500/20 to-fuchsia-900/40',
    'from-orange-500/20 to-red-900/40',
    'from-sky-500/20 to-blue-900/40',
    'from-pink-500/20 to-rose-900/40',
    'from-amber-500/20 to-orange-900/40',
    'from-indigo-500/20 to-violet-900/40',
  ];

  return (
    <div className="min-h-screen bg-brand-bg pt-4">
      <section className="bg-brand-bg py-8">
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
          {/* Home breadcrumb */}
          <div className="mb-8 flex items-center gap-2 text-sm text-brand-text/60">
            <Link href="/" className="inline-flex items-center gap-1.5 hover:text-brand-primary transition-colors font-medium">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-brand-text font-semibold">Skills</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-brand-text mb-2">
              Explore Top Skills
            </h2>
            <p className="text-brand-text/70">
              Browse our complete library of skills and find the right learning products for you.
            </p>
          </div>

          {/* Search Bar */}
          <SkillsSearch skills={validSkills} gradients={gradients} sliderMediaMap={sliderMediaMap} />
        </div>
      </section>
    </div>
  );
}
