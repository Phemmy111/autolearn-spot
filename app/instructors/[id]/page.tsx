import { supabaseAdmin } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { User, MapPin, Link as LinkIcon, Briefcase, Star, Award } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductCard } from '@/components/marketplace/ProductCard';

// Force dynamic rendering to prevent 404 errors
export const dynamic = 'force-dynamic';

interface Author {
  id: string;
  display_name: string;
  bio: string;
  profile_image: string;
  professional_title: string;
  years_of_experience: string;
  email: string;
  phone: string;
  location: string;
  linkedin_profile: string;
  website_portfolio: string;
  expertise: string[];
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  price: number;
  currency: string;
  category: string;
  skill: string;
  enrolled_count: number;
  rating: number;
  review_count: number;
}

async function getAuthorData(authorId: string) {
  console.log('Looking up author with ID:', authorId);
  
  const { data: author, error: authorError } = await supabaseAdmin
    .from('authors')
    .select('*')
    .eq('id', authorId)
    .single();

  console.log('Author lookup result:', { author, error: authorError });

  if (authorError || !author) {
    console.log('Author not found, returning null');
    return null;
  }

  return author as Author;
}

async function getAuthorProducts(authorId: string) {
  const { data: products, error: productsError } = await supabaseAdmin
    .from('learning_products')
    .select(`
      *,
      cohorts (
        enrollments (count)
      )
    `)
    .eq('author_id', authorId)
    .order('created_at', { ascending: false });

  if (productsError || !products) {
    return [];
  }

  // Filter for published products
  const publishedProducts = products.filter((p: any) => p.status === 'PUBLISHED');

  const productsWithRating = publishedProducts.map((product: any) => {
    // Sum enrollments across all cohorts for this product
    const enrolled_count = product.cohorts?.reduce((acc: number, cohort: any) => {
      const count = cohort.enrollments?.[0]?.count || 0;
      return acc + count;
    }, 0) || 0;

    return {
      ...product,
      rating: 0,
      review_count: 0,
      enrolled_count
    };
  });

  return productsWithRating as Product[];
}

export default async function AuthorPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const author = await getAuthorData(id);
  
  if (!author) {
    notFound();
  }

  const products = await getAuthorProducts(id);

  // Calculate author stats
  const totalStudents = products.reduce((sum, p) => sum + (p.enrolled_count || 0), 0);
  const avgRating = products.length > 0 
    ? products.reduce((sum, p) => sum + p.rating, 0) / products.length 
    : 0;

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header Profile Section */}
      <div className="bg-[var(--card)] border-b border-brand-border/50 shadow-sm relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#10b981]/5 to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-8">
            
            {/* Profile Image */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[var(--card)] shadow-xl relative overflow-hidden shrink-0 bg-neutral-100">
              {author.profile_image ? (
                <Image 
                  src={author.profile_image} 
                  alt={author.display_name} 
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand-bg">
                  <User className="w-16 h-16 text-neutral-300" />
                </div>
              )}
            </div>

            {/* Author Info */}
            <div className="flex-1 text-center md:text-left mt-2 md:mt-4">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-brand-text mb-2">
                {author.display_name}
              </h1>
              {author.professional_title && (
                <p className="text-lg text-[#10b981] font-medium mb-4">
                  {author.professional_title}
                </p>
              )}
              
              {/* Stats */}
              <div className="flex flex-wrap justify-center md:justify-start gap-6 mb-6 pb-6 border-b border-brand-border/40 inline-flex md:flex">
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-2xl font-bold text-brand-text">{products.length}</span>
                  <span className="text-xs text-brand-text/60 uppercase tracking-wider font-semibold">Courses</span>
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold text-brand-text">{avgRating.toFixed(1)}</span>
                    <Star className="w-4 h-4 text-amber-400 fill-current -mt-1" />
                  </div>
                  <span className="text-xs text-brand-text/60 uppercase tracking-wider font-semibold">Rating</span>
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-2xl font-bold text-brand-text">{totalStudents.toLocaleString()}</span>
                  <span className="text-xs text-brand-text/60 uppercase tracking-wider font-semibold">Students</span>
                </div>
              </div>

              {/* Location & Links */}
              <div className="flex flex-wrap justify-center md:justify-start gap-5 text-sm text-brand-text/70 font-medium">
                {author.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-brand-text/40" />
                    {author.location}
                  </div>
                )}
                {author.linkedin_profile && (
                  <a 
                    href={author.linkedin_profile} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-[#10b981] transition-colors"
                  >
                    <LinkIcon className="w-4 h-4 text-brand-text/40" />
                    LinkedIn
                  </a>
                )}
                {author.website_portfolio && (
                  <a 
                    href={author.website_portfolio} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-[#10b981] transition-colors"
                  >
                    <LinkIcon className="w-4 h-4 text-brand-text/40" />
                    Portfolio
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12">
          
          {/* Left Column (About & Expertise) */}
          <div className="w-full lg:w-1/3 flex flex-col gap-8">
            {author.bio && (
              <div className="bg-[var(--card)] border border-brand-border/50 rounded-2xl p-6 shadow-sm">
                <h2 className="font-heading font-bold text-lg text-brand-text mb-4">About Me</h2>
                <p className="text-brand-text/70 leading-relaxed text-sm whitespace-pre-wrap">{author.bio}</p>
              </div>
            )}

            {author.expertise && author.expertise.length > 0 && (
              <div className="bg-[var(--card)] border border-brand-border/50 rounded-2xl p-6 shadow-sm">
                <h3 className="font-heading font-bold text-lg text-brand-text mb-4">Areas of Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {author.expertise.map((expertise) => (
                    <span 
                      key={expertise}
                      className="px-3 py-1.5 bg-[#10b981]/10 border border-[#10b981]/20 rounded-full text-xs font-semibold text-[#10b981]"
                    >
                      {expertise}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Courses) */}
          <div className="w-full lg:w-2/3">
            <h2 className="text-2xl font-heading font-bold text-brand-text mb-6">Published Courses</h2>
            
            {products.length === 0 ? (
              <div className="text-center py-16 bg-[var(--card)] border border-brand-border/50 rounded-2xl shadow-sm">
                <Briefcase className="w-12 h-12 text-brand-text/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-brand-text mb-2">No courses published yet</h3>
                <p className="text-brand-text/50">This instructor hasn't published any courses yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product as any} 
                  authorName={author.display_name} 
                  rating={product.rating}
                  enrolledCount={product.enrolled_count}
                />
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
