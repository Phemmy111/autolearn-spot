import Link from 'next/link';
import { ArrowRight, Bot, Code2, Smartphone, BarChart3, Megaphone, Palette } from 'lucide-react';

export function TopSkillsGrid() {
  const skills = [
    {
      icon: Bot,
      title: 'AI & Automation',
      href: '/skills/ai-automation',
      iconColor: 'text-brand-primary',
      bgColor: 'bg-brand-primary/10',
    },
    {
      icon: Code2,
      title: 'Web Development',
      href: '/skills/web-development',
      iconColor: 'text-brand-primary',
      bgColor: 'bg-brand-primary/10',
    },
    {
      icon: Smartphone,
      title: 'Mobile Development',
      href: '/skills/mobile-development',
      iconColor: 'text-brand-primary',
      bgColor: 'bg-brand-primary/10',
    },
    {
      icon: BarChart3,
      title: 'Data Science',
      href: '/skills/data-science',
      iconColor: 'text-brand-primary',
      bgColor: 'bg-brand-primary/10',
    },
    {
      icon: Megaphone,
      title: 'Digital Marketing',
      href: '/skills/digital-marketing',
      iconColor: 'text-brand-primary',
      bgColor: 'bg-brand-primary/10',
    },
    {
      icon: Palette,
      title: 'Design & UX',
      href: '/skills/design-ux',
      iconColor: 'text-brand-primary',
      bgColor: 'bg-brand-primary/10',
    },
  ];

  return (
    <section className="bg-brand-bg py-20">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
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
          {skills.map((skill, index) => (
            <Link
              key={index}
              href={skill.href}
              className="group flex items-center gap-6 p-6 bg-[var(--card)] rounded-[24px] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 border border-brand-border/60"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${skill.bgColor} ${skill.iconColor}`}>
                <skill.icon className="w-8 h-8" />
              </div>
              <span className="text-lg font-bold text-brand-text group-hover:text-brand-primary transition-colors">
                {skill.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
