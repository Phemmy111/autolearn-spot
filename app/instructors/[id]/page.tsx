import { supabaseAdmin } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { User, MapPin, Link as LinkIcon, Briefcase, Star, Award } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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
  const { data: author, error: authorError } = await supabaseAdmin
    .from('authors')
    .select('*')
    .eq('id', authorId)
    .single();

  if (authorError || !author) {
    return null;
  }

  return author as Author;
}

async function getAuthorProducts(authorId: string) {
  const { data: products, error: productsError } = await supabaseAdmin
    .from('learning_products')
    .select('*, product_reviews(rating)')
    .eq('author_id', authorId)
    .eq('status', 'PUBLISHED')
    .order('created_at', { ascending: false });

  if (productsError || !products) {
    return [];
  }

  // Calculate average rating for each product
  const productsWithRating = products.map((product: any) => {
    const reviews = product.product_reviews || [];
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length 
      : 0;
    
    return {
      ...product,
      rating: avgRating,
      review_count: reviews.length
    };
  });

  return productsWithRating as Product[];
}

export default async function AuthorPublicPage({ params }: { params: { id: string } }) {
  const author = await getAuthorData(params.id);
  
  if (!author) {
    notFound();
  }

  const products = await getAuthorProducts(params.id);

  // Calculate author stats
  const totalStudents = products.reduce((sum, p) => sum + (p.enrolled_count || 0), 0);
  const avgRating = products.length > 0 
    ? products.reduce((sum, p) => sum + p.rating, 0) / products.length 
    : 0;

  return (
    <div className="min-h-screen bg-[var(--card)]">
      {/* Header */}
      <div className="bg-gradient-to-br from-sky-900/20 to-sky-800/10 border-b border-sky-900/30">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Profile Image */}
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-sky-600 to-sky-800 p-1 shrink-0">
                <div className="w-full h-full rounded-full bg-sky-900/50 flex items-center justify-center overflow-hidden relative">
                  {author.profile_image ? (
                    <Image 
                      src={author.profile_image} 
                      alt={author.display_name} 
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <User className="w-16 h-16 text-sky-400" />
                  )}
                </div>
              </div>

              {/* Author Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-brand-text mb-2">{author.display_name}</h1>
                {author.professional_title && (
                  <p className="text-lg text-sky-400 mb-3">{author.professional_title}</p>
                )}
                
                {/* Stats */}
                <div className="flex flex-wrap justify-center md:justify-start gap-6 mb-4">
                  <div className="flex items-center gap-2 text-brand-text/80">
                    <Award className="w-5 h-5 text-sky-400" />
                    <span className="font-semibold">{products.length} Courses</span>
                  </div>
                  <div className="flex items-center gap-2 text-brand-text/80">
                    <Star className="w-5 h-5 text-amber-400" />
                    <span className="font-semibold">{avgRating.toFixed(1)} Rating</span>
                  </div>
                  <div className="flex items-center gap-2 text-brand-text/80">
                    <User className="w-5 h-5 text-emerald-400" />
                    <span className="font-semibold">{totalStudents} Students</span>
                  </div>
                </div>

                {/* Location & Links */}
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-brand-text/70">
                  {author.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {author.location}
                    </div>
                  )}
                  {author.linkedin_profile && (
                    <a 
                      href={author.linkedin_profile} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-sky-400 transition-colors"
                    >
                      <LinkIcon className="w-4 h-4" />
                      LinkedIn
                    </a>
                  )}
                  {author.website_portfolio && (
                    <a 
                      href={author.website_portfolio} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-sky-400 transition-colors"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Portfolio
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {author.bio && (
              <div className="mt-8 bg-brand-bg/50 border border-sky-900/30 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-brand-text mb-3">About</h2>
                <p className="text-brand-text/80 leading-relaxed">{author.bio}</p>
              </div>
            )}

            {/* Expertise */}
            {author.expertise && author.expertise.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-brand-text mb-3">Areas of Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {author.expertise.map((expertise) => (
                    <span 
                      key={expertise}
                      className="px-3 py-1 bg-sky-900/30 border border-sky-900/50 rounded-full text-sm text-sky-300"
                    >
                      {expertise}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Published Courses */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-brand-text mb-6">Published Courses</h2>
          
          {products.length === 0 ? (
            <div className="text-center py-12 bg-brand-bg border border-brand-border rounded-xl">
              <Briefcase className="w-16 h-16 text-brand-text/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brand-text mb-2">No courses published yet</h3>
              <p className="text-brand-text/60">This author hasn't published any courses yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link 
                  key={product.id} 
                  href={`/product/${product.slug}`}
                  className="group bg-brand-bg border border-brand-border rounded-xl overflow-hidden hover:border-sky-500/50 transition-all hover:shadow-lg"
                >
                  <div className="aspect-video bg-gradient-to-br from-sky-900/20 to-sky-800/10 relative">
                    {product.thumbnail ? (
                      <Image 
                        src={product.thumbnail} 
                        alt={product.title} 
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Briefcase className="w-12 h-12 text-sky-600/50" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-sky-900/30 text-sky-300 rounded-full">
                        {product.category}
                      </span>
                      <span className="text-xs px-2 py-1 bg-emerald-900/30 text-emerald-300 rounded-full">
                        {product.skill}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-brand-text mb-2 line-clamp-2 group-hover:text-sky-400 transition-colors">
                      {product.title}
                    </h3>
                    
                    <p className="text-sm text-brand-text/60 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-semibold text-brand-text">
                          {product.rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-brand-text/60">
                          ({product.review_count})
                        </span>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-bold text-sky-400">
                          {new Intl.NumberFormat('en-NG', { 
                            style: 'currency', 
                            currency: product.currency || 'NGN',
                            maximumFractionDigits: 0 
                          }).format(product.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
