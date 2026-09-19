import Link from 'next/link';
import { Tag, ArrowRight } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function SkillsPage() {
  const { data: skills, error } = await supabaseAdmin
    .from('skills')
    .select('*, learning_products(id, status)')
    .order('name');

  const validSkills = (skills || []).map(skill => {
    // Count only published products
    const publishedProducts = skill.learning_products?.filter((p: any) => p.status === 'PUBLISHED') || [];
    return {
      ...skill,
      publishedCount: publishedProducts.length
    };
  });

  return (
    <div className="min-h-screen bg-brand-bg pt-20">
      <section className="bg-brand-bg py-20">
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {validSkills.map((skill) => (
                <Link
                  key={skill.id}
                  href={`/skills/${skill.slug || skill.name.toLowerCase().replace(/ /g, '-')}`}
                  className="group flex items-start gap-4 p-6 bg-[var(--card)] rounded-[24px] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 border border-brand-border/60"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 bg-brand-primary/10 text-brand-primary flex-shrink-0">
                    <Tag className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-lg font-bold text-brand-text group-hover:text-brand-primary transition-colors mb-1">
                      {skill.name}
                    </span>
                    {skill.description && (
                      <p className="text-sm text-brand-text/70 line-clamp-2 mb-2">
                        {skill.description}
                      </p>
                    )}
                    <div className="text-xs font-semibold text-brand-text/50">
                      {skill.publishedCount} published {skill.publishedCount === 1 ? 'product' : 'products'}
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
