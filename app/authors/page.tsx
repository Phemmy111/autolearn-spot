import Link from 'next/link';
import { User, Award, Star, Briefcase } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function AuthorsDirectoryPage() {
  // Fetch active authors who have published products
  const { data: authors, error } = await supabaseAdmin
    .from('authors')
    .select('*, learning_products(id, status, enrolled_count, product_reviews(rating))')
    .order('display_name');

  const validAuthors = (authors || []).map(author => {
    const publishedProducts = author.learning_products?.filter((p: any) => p.status === 'PUBLISHED') || [];
    
    // Calculate stats
    const totalStudents = publishedProducts.reduce((sum: number, p: any) => sum + (p.enrolled_count || 0), 0);
    
    // Calculate average rating
    let totalRating = 0;
    let totalReviews = 0;
    
    publishedProducts.forEach((p: any) => {
      const reviews = p.product_reviews || [];
      if (reviews.length > 0) {
        totalRating += reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
        totalReviews += reviews.length;
      }
    });
    
    const avgRating = totalReviews > 0 ? totalRating / totalReviews : 0;
    
    return {
      ...author,
      publishedCount: publishedProducts.length,
      totalStudents,
      avgRating
    };
  }).filter(a => a.status === 'ACTIVE' || !a.status); // Show all approved/active authors

  return (
    <div className="min-h-screen bg-brand-bg pt-20">
      <section className="bg-brand-bg py-20">
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-brand-text mb-4">
              Meet Our Authors
            </h2>
            <p className="text-brand-text/70 text-lg">
              Learn from people who have real skills, experience and knowledge to share.
            </p>
          </div>

          {validAuthors.length === 0 ? (
            <div className="bg-[var(--card)] rounded-xl border border-brand-border p-12 text-center max-w-2xl mx-auto">
              <User className="w-16 h-16 text-brand-text/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-brand-text mb-2">Our author community is growing</h3>
              <p className="text-brand-text/60">Check back soon for experts and creators.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {validAuthors.map((author) => (
                <div key={author.id} className="bg-[var(--card)] rounded-[24px] border border-brand-border/60 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-brand-primary/10 flex-shrink-0 flex items-center justify-center relative">
                        {author.profile_image ? (
                          <Image src={author.profile_image} alt={author.display_name} fill className="object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-brand-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-brand-text line-clamp-1">{author.display_name}</h3>
                        {author.professional_title && (
                          <p className="text-sm text-brand-primary line-clamp-1">{author.professional_title}</p>
                        )}
                      </div>
                    </div>
                    
                    {author.bio ? (
                      <p className="text-sm text-brand-text/70 line-clamp-3 mb-4 flex-1">
                        {author.bio}
                      </p>
                    ) : (
                      <div className="flex-1" />
                    )}

                    <div className="flex items-center gap-4 text-xs font-semibold text-brand-text/60 mb-4 pt-4 border-t border-brand-border">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-brand-text/40" />
                        {author.publishedCount} {author.publishedCount === 1 ? 'Course' : 'Courses'}
                      </div>
                      {author.avgRating > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-amber-400" />
                          {author.avgRating.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 pt-0">
                    <Link 
                      href={`/authors/${author.id}`}
                      className="block w-full py-2.5 text-center bg-brand-bg hover:bg-brand-primary hover:text-white border border-brand-border text-brand-text text-sm font-bold rounded-xl transition-colors"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
