import { supabaseAdmin } from '@/lib/supabase';
import { LearningProduct } from '@/types/product';
import { ReviewService } from '@/lib/review-service';

/** Enrich learning products with author name, enrollment count, and real review ratings */
async function enrichProducts(products: any[]): Promise<LearningProduct[]> {
  if (!products || products.length === 0) return [];

  try {
    const authorIds = Array.from(new Set(products.map(p => p.author_id).filter(Boolean)));
    const productIds = products.map(p => p.id);

    // Fetch author names
    const { data: authors } = await supabaseAdmin
      .from('authors')
      .select('id, display_name')
      .in('id', authorIds);

    const authorMap = new Map((authors || []).map(a => [a.id, a.display_name]));

    // Fetch enrollments counts
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('learning_product_id')
      .in('learning_product_id', productIds);

    const enrollMap = new Map<string, number>();
    (enrollments || []).forEach(e => {
      if (e.learning_product_id) {
        enrollMap.set(e.learning_product_id, (enrollMap.get(e.learning_product_id) || 0) + 1);
      }
    });

    // Fetch live course reviews
    let allReviews: any[] = [];
    try {
      allReviews = await ReviewService.getAllReviews();
    } catch (e) {
      console.warn('[public-product-service] Could not load reviews:', e);
    }

    return products.map(p => {
      const courseReviews = allReviews.filter(r => 
        (r.course_id === p.id || (r.course_title && r.course_title.toLowerCase().includes(p.title?.toLowerCase() || ''))) &&
        r.status === 'approved'
      );

      const reviewCount = courseReviews.length;
      const enrolledCount = enrollMap.get(p.id) || 0;
      
      const avgRating = reviewCount > 0
        ? Number((courseReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / reviewCount).toFixed(1))
        : 5.0;

      return {
        ...p,
        author_name: authorMap.get(p.author_id) || 'Expert Instructor',
        enrolled_count: enrolledCount,
        rating: avgRating,
        review_count: reviewCount,
      } as LearningProduct;
    });
  } catch (err) {
    console.error('[public-product-service] Error enriching products:', err);
    return products as LearningProduct[];
  }
}

/** Fetch all published learning products for the marketplace frontend */
export async function getPublishedProducts(): Promise<LearningProduct[]> {
  const { data, error } = await supabaseAdmin
    .from('learning_products')
    .select('*')
    .eq('status', 'PUBLISHED')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[public-product-service] getPublishedProducts error:', error);
    return [];
  }

  return await enrichProducts(data || []);
}

export async function getPublishedProductsBySkill(skillSlug: string): Promise<LearningProduct[]> {
  // First find the skill
  const { data: skill } = await supabaseAdmin
    .from('skills')
    .select('id')
    .eq('slug', skillSlug)
    .single();

  if (!skill) return [];

  const { data, error } = await supabaseAdmin
    .from('learning_products')
    .select('*')
    .eq('status', 'PUBLISHED')
    .eq('skill_id', skill.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[public-product-service] getPublishedProductsBySkill error:', error);
    return [];
  }

  return await enrichProducts(data || []);
}
