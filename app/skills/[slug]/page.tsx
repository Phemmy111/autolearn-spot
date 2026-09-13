import { getPublishedProductsBySkill } from '@/lib/public-product-service';
import { MarketplaceProductGrid } from '@/components/marketplace/MarketplaceProductGrid';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { Tag } from 'lucide-react';

interface PageParams {
  params: Promise<{ slug: string }>;
}

export default async function SkillPage({ params }: PageParams) {
  const { slug } = await params;
  
  // Get skill info
  const { data: skill } = await supabaseAdmin
    .from('skills')
    .select('name, description')
    .eq('slug', slug)
    .single();

  if (!skill) {
    // If not in DB, we still render a generic one based on slug for now
    // but ideally we'd notFound()
  }

  const products = await getPublishedProductsBySkill(slug);
  const title = skill?.name || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-[var(--card)] brightness-95 border-b border-brand-border">
        <div className="container mx-auto px-6 lg:px-12 py-12 pt-24">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <Tag className="w-6 h-6 text-brand-primary" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-brand-text">
              {title} Courses
            </h1>
          </div>
          <p className="text-brand-text/70 max-w-2xl">
            {skill?.description || `Master ${title} with our premium, expert-led courses and digital resources.`}
          </p>
        </div>
      </div>

      <MarketplaceProductGrid products={products} />
    </div>
  );
}
