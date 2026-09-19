import Link from 'next/link';
import { Tag, ArrowRight, Home, ChevronRight } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const DEFAULT_SKILLS = [
  { name: 'AI Automation', description: 'Master workflow automation using AI tools like n8n, Make, and Zapier to build powerful, hands-free systems.' },
  { name: 'AI & Machine Learning', description: 'Understand and apply Artificial Intelligence and Machine Learning concepts to real-world problems.' },
  { name: 'Video Content Creation', description: 'Create, edit and publish engaging video content using AI-powered tools for YouTube, TikTok and more.' },
  { name: 'Digital Marketing', description: 'Learn how to grow an audience, run ads, and drive revenue through modern digital marketing strategies.' },
  { name: 'Web Development', description: 'Build modern, responsive websites and web applications with the latest tools and frameworks.' },
  { name: 'No-Code Tools', description: 'Build powerful apps and automations without writing a single line of code using no-code platforms.' },
  { name: 'Freelancing & Business', description: 'Start and grow a profitable freelance business or online agency with practical, actionable guidance.' },
  { name: 'Prompt Engineering', description: 'Learn how to write effective AI prompts to get better results from ChatGPT, Claude, Gemini and more.' },
];

export default async function SkillsPage() {
  // Check if skills exist; auto-seed if not
  const { data: existingSkills } = await supabaseAdmin.from('skills').select('id').limit(1);
  if (!existingSkills || existingSkills.length === 0) {
    // Try inserting with name + description only (safest subset of columns)
    const { error: seedError } = await supabaseAdmin.from('skills').insert(DEFAULT_SKILLS);
    if (seedError) {
      // If description column also doesn't exist, fall back to name only
      await supabaseAdmin.from('skills').insert(DEFAULT_SKILLS.map(s => ({ name: s.name })));
    }
  }

  const { data: skills } = await supabaseAdmin
    .from('skills')
    .select('id, name, description, learning_products(id, status)')
    .order('name');

  const validSkills = (skills || []).map(skill => {
    const publishedProducts = (skill.learning_products as any[])?.filter((p) => p.status === 'PUBLISHED') || [];
    return { ...skill, publishedCount: publishedProducts.length };
  });


  return (
    <div className="min-h-screen bg-brand-bg pt-20">
      <section className="bg-brand-bg py-20">
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
              {validSkills.map((skill, index) => (
                <Link
                  key={skill.id}
                  href={`/skills/${skill.id}`}
                  className="group flex flex-col bg-[var(--card)] rounded-[24px] overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 border border-brand-border/60"
                >
                  <div className="relative h-40 w-full overflow-hidden bg-brand-primary/10">
                    <img 
                      src={`https://picsum.photos/seed/${skill.id}/600/400`} 
                      alt={skill.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-md text-white flex-shrink-0 border border-white/20">
                        <Tag className="w-5 h-5" />
                      </div>
                      <span className="block text-xl font-bold text-white line-clamp-1 drop-shadow-md">
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
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
