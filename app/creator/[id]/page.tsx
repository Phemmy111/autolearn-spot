import { getPublishedProducts } from '@/lib/public-product-service';
import { MarketplaceProductGrid } from '@/components/marketplace/MarketplaceProductGrid';
import { supabaseAdmin } from '@/lib/supabase';
import { User } from 'lucide-react';
import { notFound } from 'next/navigation';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default async function CreatorPage({ params }: PageParams) {
  const { id } = await params;
  
  // Try to find the user in enrollments just to get their name (hack for now since no users table)
  const { data: user } = await supabaseAdmin
    .from('enrollments')
    .select('full_name, email')
    .eq('clerk_user_id', id)
    .limit(1)
    .single();

  const authorName = user?.full_name || 'Expert Instructor';

  // Get products by this author
  const { data: products } = await supabaseAdmin
    .from('learning_products')
    .select('*')
    .eq('status', 'PUBLISHED')
    .eq('author_id', id)
    .order('created_at', { ascending: false });

  if (!products || products.length === 0) {
    // maybe no products yet
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-[var(--card)] brightness-95 border-b border-brand-border">
        <div className="container mx-auto px-6 lg:px-12 py-12 pt-24">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center border-2 border-brand-primary/30">
              <User className="w-8 h-8 text-brand-primary" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-brand-text">
                {authorName}
              </h1>
              <p className="text-brand-text/70 mt-1">
                Course Creator & Expert Instructor
              </p>
            </div>
          </div>
        </div>
      </div>

      <MarketplaceProductGrid products={products || []} />
    </div>
  );
}
