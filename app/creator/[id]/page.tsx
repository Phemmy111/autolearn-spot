import { getPublishedProducts } from '@/lib/public-product-service';
import { MarketplaceProductGrid } from '@/components/marketplace/MarketplaceProductGrid';
import { supabaseAdmin } from '@/lib/supabase';
import { User, Briefcase, Award, Edit } from 'lucide-react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default async function CreatorPage({ params }: PageParams) {
  const { id } = await params;
  
  // Check if current user is the author
  const { userId } = await auth();
  const isOwner = userId === id;
  
  // Try to find the author in authors table
  const { data: author } = await supabaseAdmin
    .from('authors')
    .select('display_name, email, bio, profile_image, professional_title, years_of_experience')
    .eq('clerk_user_id', id)
    .limit(1)
    .single();

  const authorName = author?.display_name || 'Expert Instructor';

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
      <div className="bg-[var(--card)] brightness-95 border-b border-brand-border pb-12">
        <div className="container mx-auto px-6 lg:px-12 pt-32">
          <div className="flex flex-col md:flex-row items-start gap-8 relative">
            
            {/* Edit Button for Owner */}
            {isOwner && (
              <div className="absolute top-0 right-0">
                <Link 
                  href="/author/settings/profile" 
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--card)] border border-brand-border hover:bg-brand-bg text-brand-text text-sm font-semibold rounded-lg transition-colors shadow-sm"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </Link>
              </div>
            )}

            <div className="w-32 h-32 shrink-0 rounded-full bg-brand-primary/10 flex items-center justify-center border-4 border-[var(--card)] shadow-xl overflow-hidden relative">
              {author?.profile_image ? (
                <Image src={author.profile_image} alt={authorName} fill className="object-cover" />
              ) : (
                <User className="w-16 h-16 text-brand-primary" />
              )}
            </div>
            
            <div className="flex-1 mt-2">
              <h1 className="text-3xl lg:text-5xl font-extrabold text-brand-text tracking-tight mb-2">
                {authorName}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-brand-text/70 font-medium mb-6">
                <span className="flex items-center gap-1.5 text-brand-primary">
                  <Briefcase className="w-4 h-4" />
                  {author?.professional_title || 'Course Creator & Expert Instructor'}
                </span>
                {author?.years_of_experience && (
                  <span className="flex items-center gap-1.5 text-amber-500">
                    <Award className="w-4 h-4" />
                    {author.years_of_experience} Years Experience
                  </span>
                )}
              </div>
              
              {author?.bio && (
                <div className="prose prose-invert max-w-3xl">
                  <p className="text-brand-text/80 text-lg leading-relaxed whitespace-pre-wrap">
                    {author.bio}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <MarketplaceProductGrid products={products || []} />
    </div>
  );
}
