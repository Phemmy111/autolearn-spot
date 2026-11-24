import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOrResolveAuthenticatedPartner } from '@/lib/partner-system/auth';
import { getCommissionRate } from '@/lib/commission';

export const dynamic = 'force-dynamic';

function generateAffiliateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'SR' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * GET /api/student/referral-courses
 *
 * Returns a list of courses the student has purchased, with:
 *   - course title, price, thumbnail
 *   - student commission amount for that course (from site_settings or global default)
 *   - unique referral link for that course (using affiliate_links infrastructure)
 *
 * This powers the "My Courses → Refer & Earn" section in the partner dashboard.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get the partner record for this student (auto-activated when they enter partner dashboard)
    const partner = await getOrResolveAuthenticatedPartner();
    if (!partner) {
      return NextResponse.json({ success: true, courses: [] });
    }

    // 2. Find this student's enrollments (by clerk_user_id or user_id)
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('course_id, cohort_id, payment_reference')
      .or(`clerk_user_id.eq.${userId},user_id.eq.${userId}`)
      .eq('status', 'active');

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ success: true, courses: [] });
    }

    // Gather product IDs — directly from course_id or via cohorts
    let productIds: string[] = enrollments
      .map(e => e.course_id)
      .filter(Boolean) as string[];

    // Also resolve cohort-based enrollments
    const cohortIds = enrollments.map(e => e.cohort_id).filter(Boolean);
    if (cohortIds.length > 0) {
      const { data: cohorts } = await supabaseAdmin
        .from('cohorts')
        .select('learning_product_id')
        .in('id', cohortIds);
      const cohortProductIds = (cohorts || [])
        .map(c => c.learning_product_id)
        .filter(Boolean) as string[];
      productIds = [...new Set([...productIds, ...cohortProductIds])];
    }

    if (productIds.length === 0) {
      return NextResponse.json({ success: true, courses: [] });
    }

    // 3. Fetch product details
    const { data: products } = await supabaseAdmin
      .from('learning_products')
      .select('id, title, slug, price, thumbnail_url, affiliate_enabled')
      .in('id', productIds)
      .eq('status', 'published');

    if (!products || products.length === 0) {
      return NextResponse.json({ success: true, courses: [] });
    }

    // 4. Get partner's existing referral codes
    const { data: partnerCodes } = await supabaseAdmin
      .from('referral_codes')
      .select('id, code')
      .or(`owner_id.eq.${partner.id},partner_id.eq.${partner.id}`);

    const codeIds = (partnerCodes || []).map((c: any) => c.id);

    // 5. Get existing affiliate links for these products (student course-specific links)
    let existingLinksMap: Record<string, string> = {};
    if (codeIds.length > 0) {
      const { data: existingLinks } = await supabaseAdmin
        .from('affiliate_links')
        .select('learning_product_id, unique_code')
        .in('referral_code_id', codeIds)
        .in('learning_product_id', productIds);

      for (const link of existingLinks || []) {
        existingLinksMap[link.learning_product_id] = link.unique_code;
      }
    }

    // If partner has no referral code yet, create one
    let baseRefCode = partnerCodes?.[0];
    if (!baseRefCode) {
      const code = generateAffiliateCode();
      const { data: createdCode } = await supabaseAdmin
        .from('referral_codes')
        .insert({
          owner_id: partner.id,
          partner_id: partner.id,
          owner_type: 'student',
          code,
          clicks: 0,
          conversions: 0,
        })
        .select('id, code')
        .single();
      baseRefCode = createdCode || null;
    }

    // 6. For each enrolled product, get commission + create/return referral link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';

    const courseCards = await Promise.all(
      products.map(async (product: any) => {
        // Get student commission for this course
        const studentCommission = await getCommissionRate('student', product.id);

        // Get or create a course-specific referral link
        let linkCode = existingLinksMap[product.id];

        if (!linkCode && baseRefCode) {
          // Create a new affiliate link for this enrolled course
          const uniqueCode = baseRefCode.code;
          const { error: insertErr } = await supabaseAdmin
            .from('affiliate_links')
            .insert({
              referral_code_id: baseRefCode.id,
              learning_product_id: product.id,
              unique_code: uniqueCode,
            });

          if (!insertErr) {
            linkCode = uniqueCode;
          }
        }

        const referralUrl = linkCode
          ? `${appUrl}/marketplace/${product.slug || product.id}?ref=${linkCode}`
          : `${appUrl}/enroll?ref=${partner.partner_id}`;

        return {
          productId: product.id,
          title: product.title,
          slug: product.slug,
          price: Number(product.price) || 0,
          thumbnailUrl: product.thumbnail_url || null,
          studentCommission,
          referralCode: linkCode || null,
          referralUrl,
        };
      })
    );

    return NextResponse.json({ success: true, courses: courseCards });
  } catch (error) {
    console.error('[GET /api/student/referral-courses] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
