import { supabaseAdmin } from '@/lib/supabase';
import MediaSliderClient from './MediaSliderClient';
import { SKILLS_BY_CATEGORY, CATEGORIES } from '@/lib/taxonomy';

export const dynamic = 'force-dynamic';

export default async function MediaSlidersPage() {
  // Fetch existing sliders
  const { data: sliders } = await supabaseAdmin
    .from('page_sliders')
    .select('*, slider_media(*)');

  // Get skills from taxonomy instead of database
  const skillsFromTaxonomy = [];
  for (const category of CATEGORIES) {
    const skills = SKILLS_BY_CATEGORY[category] || [];
    for (const skill of skills) {
      skillsFromTaxonomy.push({
        id: skill.id,
        name: skill.name,
        category
      });
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Media Sliders</h1>
        <p className="text-gray-600">
          Configure animated sliders for the homepage and individual skill pages.
        </p>
      </div>

      <MediaSliderClient initialSliders={sliders || []} skills={skillsFromTaxonomy} />
    </div>
  );
}
