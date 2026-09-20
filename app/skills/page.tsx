import Link from 'next/link';
import { Tag, ArrowRight, Home, ChevronRight } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase';
import { DynamicSlider } from '@/components/ui/DynamicSlider';

export const dynamic = 'force-dynamic';

const DEFAULT_SKILLS = [
  { name: 'AI Automation', slug: 'ai-automation', description: 'Master workflow automation using AI tools like n8n, Make, and Zapier to build powerful, hands-free systems.' },
  { name: 'AI & Machine Learning', slug: 'ai-machine-learning', description: 'Understand and apply Artificial Intelligence and Machine Learning concepts to real-world problems.' },
  { name: 'Video Content Creation', slug: 'video-content-creation', description: 'Create, edit and publish engaging video content using AI-powered tools for YouTube, TikTok and more.' },
  { name: 'Digital Marketing', slug: 'digital-marketing', description: 'Learn how to grow an audience, run ads, and drive revenue through modern digital marketing strategies.' },
  { name: 'Web Development', slug: 'web-development', description: 'Build modern, responsive websites and web applications with the latest tools and frameworks.' },
  { name: 'No-Code Tools', slug: 'no-code-tools', description: 'Build powerful apps and automations without writing a single line of code using no-code platforms.' },
  { name: 'Freelancing & Business', slug: 'freelancing-business', description: 'Start and grow a profitable freelance business or online agency with practical, actionable guidance.' },
  { name: 'Prompt Engineering', slug: 'prompt-engineering', description: 'Learn how to write effective AI prompts to get better results from ChatGPT, Claude, Gemini and more.' },
];

export default async function SkillsPage() {
  // Check if skills exist; auto-seed if not
  const { data: existingSkills } = await supabaseAdmin.from('skills').select('id').limit(1);
  if (!existingSkills || existingSkills.length === 0) {
    await supabaseAdmin.from('skills').insert(DEFAULT_SKILLS);
  }

  // Fetch skills WITHOUT nested join (nested joins fail silently if FK not in PostgREST)
  const { data: skills } = await supabaseAdmin
    .from('skills')
    .select('id, name, description, slug')
    .order('name');

  // Fetch slider media for skills
  const skillIds = (skills || []).map(s => s.id);
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
  const skillIdentifiers = (skills || []).flatMap(s => [s.id, s.slug].filter(Boolean));
  const { data: products } = skillIdentifiers.length > 0
    ? await supabaseAdmin
        .from('learning_products')
        .select('id, skill_id, status')
        .in('skill_id', skillIdentifiers)
        .eq('status', 'PUBLISHED')
    : { data: [] };

  const validSkills = (skills || []).map(skill => {
    const publishedCount = (products || []).filter(p => p.skill_id === skill.id || p.skill_id === skill.slug).length;
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

          <div className="mb-10">
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-brand-text mb-2">
              Explore Top Skills
            </h2>
            <p className="text-brand-text/70">
              Browse our complete library of skills and find the right learning products for you.
            </p>
          </div>

          {validSkills.length === 0 ? (
            <div className="bg-[var(--card)] rounded-xl border border-brand-border p-12 text-center">
              <h3 className="text-lg font-semibold text-brand-text mb-2">No skills are available yet.</h3>
              <p className="text-brand-text/60">Check back later for new skills and courses.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {validSkills.map((skill, index) => {
                const gradient = gradients[index % gradients.length];
                const sliderConfig = sliderMediaMap.get(skill.id);

                return (
                  <Link
                    key={skill.id}
                    href={`/skills/${skill.slug || skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    className="group flex flex-col bg-[var(--card)] rounded-[24px] overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 border border-brand-border/60"
                  >
                    <div className="relative aspect-video w-full overflow-hidden">
                      {sliderConfig ? (
                        <DynamicSlider
                          media={sliderConfig.media}
                          transitionStyle={sliderConfig.transitionStyle}
                          durationMs={sliderConfig.durationMs}
                          className="w-full h-full"
                          autoPlay={true}
                          showIndicators={false}
                        />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
                          <div className="absolute inset-0 bg-brand-bg/10 backdrop-blur-[2px] mix-blend-overlay" />

                          {/* Abstract decorative elements */}
                          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors duration-500" />
                          <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-brand-primary/20 rounded-full blur-3xl group-hover:bg-brand-primary/30 transition-colors duration-500" />
                        </div>
                      )}

                      {/* Overlay for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

                      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 backdrop-blur-md text-white/90 flex-shrink-0 border border-white/20 shadow-sm">
                          <Tag className="w-5 h-5" />
                        </div>
                        <span className="block text-xl font-bold text-white line-clamp-1 drop-shadow-sm">
                          {skill.name}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      {skill.description ? (
                        <p className="text-sm text-brand-text/70 line-clamp-2 mb-4 flex-1">
                          {skill.description}
                        </p>
                      ) : (
                        <div className="flex-1" />
                      )}
                      <div className="text-xs font-semibold text-brand-text/50 pt-3 border-t border-brand-border flex items-center justify-between">
                        <span>{skill.publishedCount} published {skill.publishedCount === 1 ? 'product' : 'products'}</span>
                        <ArrowRight className="w-4 h-4 text-brand-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
