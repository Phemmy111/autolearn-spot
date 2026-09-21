'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Tag, ArrowRight, Search } from 'lucide-react';
import { DynamicSlider } from '@/components/ui/DynamicSlider';

interface Skill {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  publishedCount: number;
}

interface SkillsSearchProps {
  skills: Skill[];
  gradients: string[];
  sliderMediaMap: Map<string, any>;
}

export default function SkillsSearch({ skills, gradients, sliderMediaMap }: SkillsSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSkills = skills.filter(skill => {
    const query = searchQuery.toLowerCase();
    return (
      skill.name.toLowerCase().includes(query) ||
      skill.category.toLowerCase().includes(query) ||
      skill.description.toLowerCase().includes(query)
    );
  });

  return (
    <>
      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
          <input
            type="text"
            placeholder="Search skills by name, category, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[var(--card)] border border-brand-border rounded-xl text-brand-text placeholder-brand-text/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
          />
        </div>
        {searchQuery && (
          <p className="text-sm text-brand-text/60 mt-2">
            Found {filteredSkills.length} skill{filteredSkills.length !== 1 ? 's' : ''} matching "{searchQuery}"
          </p>
        )}
      </div>

      {filteredSkills.length === 0 ? (
        <div className="bg-[var(--card)] rounded-xl border border-brand-border p-12 text-center">
          <Search className="w-12 h-12 text-brand-text/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-brand-text mb-2">No skills found</h3>
          <p className="text-brand-text/60">
            {searchQuery ? `No skills match "${searchQuery}". Try a different search term.` : 'No skills are available yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSkills.map((skill, index) => {
            const gradient = gradients[index % gradients.length];
            const sliderConfig = sliderMediaMap.get(skill.id);

            return (
              <Link
                key={skill.id}
                href={`/skills/${skill.slug}`}
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
                    <div className="flex-1 min-w-0">
                      <span className="block text-xl font-bold text-white line-clamp-1 drop-shadow-sm">
                        {skill.name}
                      </span>
                      <span className="block text-xs text-white/70 line-clamp-1">
                        {skill.category}
                      </span>
                    </div>
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
    </>
  );
}
