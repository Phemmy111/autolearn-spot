import Link from 'next/link';
import { ArrowRight, Tag } from 'lucide-react';
import { SKILLS_BY_CATEGORY, CATEGORIES } from '@/lib/taxonomy';

export function TopSkillsGrid() {
  // Get first 6 skills from taxonomy (flattened)
  const skillsFromTaxonomy = [];
  for (const category of CATEGORIES) {
    const skills = SKILLS_BY_CATEGORY[category] || [];
    for (const skill of skills) {
      skillsFromTaxonomy.push({
        id: skill.id,
        name: skill.name,
        href: `/skills/${skill.id}`,
        category
      });
    }
  }

  // Take first 6 skills
  const topSkills = skillsFromTaxonomy.slice(0, 6);

  return (
    <section className="bg-brand-bg py-8">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-bold text-brand-text/60 uppercase tracking-wider mb-2">
              Popular Categories
            </p>
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-brand-text">
              Explore Top Skills
            </h2>
          </div>
          <Link 
            href="/skills" 
            className="group flex items-center gap-1.5 text-sm font-bold text-brand-primary hover:text-brand-primary-hover transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topSkills.map((skill) => (
            <Link
              key={skill.id}
              href={skill.href}
              className="group flex items-center gap-6 p-6 bg-[var(--card)] rounded-[24px] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 border border-brand-border/60"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 bg-brand-primary/10 text-brand-primary">
                <Tag className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-lg font-bold text-brand-text group-hover:text-brand-primary transition-colors block line-clamp-1">
                  {skill.name}
                </span>
                <span className="text-xs text-brand-text/60 line-clamp-1">
                  {skill.category}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
