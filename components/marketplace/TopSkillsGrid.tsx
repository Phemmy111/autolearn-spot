import Link from 'next/link';
import { ArrowRight, Bot, Code2, Smartphone, BarChart3, Megaphone, Palette } from 'lucide-react';

export function TopSkillsGrid() {
  const skills = [
    {
      icon: Bot,
      title: 'AI & Automation',
      href: '/skills/ai-automation',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Code2,
      title: 'Web Development',
      href: '/skills/web-development',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Smartphone,
      title: 'Mobile Development',
      href: '/skills/mobile-development',
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      icon: BarChart3,
      title: 'Data Science',
      href: '/skills/data-science',
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      icon: Megaphone,
      title: 'Digital Marketing',
      href: '/skills/digital-marketing',
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Palette,
      title: 'Design & UX',
      href: '/skills/design-ux',
      iconColor: 'text-rose-600',
      bgColor: 'bg-rose-50',
    },
  ];

  return (
    <section className="bg-[#f4f7f9] py-20">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
              Popular Categories
            </p>
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-neutral-900">
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
              className="group flex items-center gap-6 p-6 bg-white rounded-[24px] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-neutral-100"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${skill.bgColor} ${skill.iconColor}`}>
                <skill.icon className="w-8 h-8" />
              </div>
              <span className="text-lg font-bold text-neutral-900 group-hover:text-brand-primary transition-colors">
                {skill.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
