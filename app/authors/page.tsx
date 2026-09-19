import Link from 'next/link';
import { User, Star, BookOpen, Briefcase } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function AuthorsDirectoryPage() {
  // Step 1: Fetch all ACTIVE authors (no relational join that might break)
  const { data: authors, error } = await supabaseAdmin
    .from('authors')
    .select('id, display_name, bio, profile_image, professional_title, status, created_at')
    .eq('status', 'ACTIVE')
    .order('display_name');

  // Step 2: Fetch published products separately (no nested join to avoid silent failures)
  const authorIds = (authors || []).map((a) => a.id);
  const { data: products } = authorIds.length > 0
    ? await supabaseAdmin
        .from('learning_products')
        .select('id, author_id, status')
        .in('author_id', authorIds)
        .eq('status', 'PUBLISHED')
    : { data: [] };

  // Step 3: Count enrollments per product from enrollments table
  const productIds = (products || []).map((p) => p.id);
  const { data: enrollments } = productIds.length > 0
    ? await supabaseAdmin
        .from('enrollments')
        .select('learning_product_id')
        .in('learning_product_id', productIds)
    : { data: [] };

  // Step 4: Fetch reviews for those products
  const { data: reviews } = productIds.length > 0
    ? await supabaseAdmin
        .from('product_reviews')
        .select('product_id, rating')
        .in('product_id', productIds)
    : { data: [] };

  // Step 5: Merge everything in JS
  const enrichedAuthors = (authors || []).map((author) => {
    const authorProducts = (products || []).filter((p) => p.author_id === author.id);
    const authorProductIds = authorProducts.map((p) => p.id);

    const totalStudents = (enrollments || []).filter((e) =>
      authorProductIds.includes(e.learning_product_id)
    ).length;

    const authorReviews = (reviews || []).filter((r) => authorProductIds.includes(r.product_id));
    const avgRating =
      authorReviews.length > 0
        ? authorReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / authorReviews.length
        : 0;

    return {
      ...author,
      publishedCount: authorProducts.length,
      totalStudents,
      avgRating,
    };
  });

  return (
    <div className="min-h-screen bg-brand-bg pt-20">
      <section className="bg-brand-bg py-20">
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-brand-text mb-4">
              Meet Our Authors
            </h2>
            <p className="text-brand-text/70 text-lg">
              Learn from people who have real skills, experience and knowledge to share.
            </p>
          </div>

          {enrichedAuthors.length === 0 ? (
            <div className="bg-[var(--card)] rounded-xl border border-brand-border p-12 text-center max-w-2xl mx-auto">
              <User className="w-16 h-16 text-brand-text/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-brand-text mb-2">Our author community is growing</h3>
              <p className="text-brand-text/60">Check back soon for experts and creators.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {enrichedAuthors.map((author) => {
                const initials = (author.display_name || 'AU')
                  .split(' ')
                  .map((w: string) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={author.id}
                    className="bg-[var(--card)] rounded-[24px] border border-brand-border/60 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 flex flex-col"
                  >
                    {/* Top banner with avatar */}
                    <div className="relative h-24 bg-gradient-to-br from-brand-primary/20 to-sky-600/20">
                      <div className="absolute -bottom-8 left-6">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-[var(--card)] bg-brand-primary/10 flex items-center justify-center relative shadow-md">
                          {author.profile_image ? (
                            <Image
                              src={author.profile_image}
                              alt={author.display_name || ''}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-xl font-bold text-brand-primary">{initials}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 pt-10 flex-1 flex flex-col">
                      <h3 className="font-bold text-lg text-brand-text line-clamp-1 mb-0.5">
                        {author.display_name}
                      </h3>
                      {author.professional_title && (
                        <p className="text-sm text-brand-primary font-medium line-clamp-1 mb-3">
                          {author.professional_title}
                        </p>
                      )}
                      {author.bio ? (
                        <p className="text-sm text-brand-text/70 line-clamp-3 mb-4 flex-1">
                          {author.bio}
                        </p>
                      ) : (
                        <div className="flex-1" />
                      )}

                      {/* Stats row */}
                      <div className="flex items-center gap-4 text-xs font-semibold text-brand-text/60 pb-4 border-b border-brand-border">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-brand-primary/60" />
                          {author.publishedCount} {author.publishedCount === 1 ? 'Course' : 'Courses'}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-brand-primary/60" />
                          {author.totalStudents} {author.totalStudents === 1 ? 'Student' : 'Students'}
                        </div>
                        {author.avgRating > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            {author.avgRating.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="p-4 pt-0">
                      <Link
                        href={`/authors/${author.id}`}
                        className="block w-full py-2.5 text-center bg-brand-bg hover:bg-brand-primary hover:text-white border border-brand-border text-brand-text text-sm font-bold rounded-xl transition-colors"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
