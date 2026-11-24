import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOrResolveAuthenticatedPartner } from '@/lib/partner-system/auth';
import { getCommissionRate } from '@/lib/commission';

export const dynamic = 'force-dynamic';

function generateStudentCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'SR' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * GET /api/student/referral-courses
 *
 * Returns a list of courses the student has purchased, with:
 *   - course title, price, thumbnail
 *   - student commission amount for that course
 *   - unique referral link for that course
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get the partner record for this student
    const partner = await getOrResolveAuthenticatedPartner();
    if (!partner) {
      return NextResponse.json({ success: true, courses: [] });
    }

    // 2. Find this student's active enrollments by clerk_user_id
    //    enrollments table has: clerk_user_id, learning_product_id, status (active|inactive)
    const { data: enrollments, error: enrollErr } = await supabaseAdmin
      .from('enrollments')
      .select('learning_product_id')
      .eq('clerk_user_id', userId)
      .eq('status', 'active');

    if (enrollErr) {
      console.error('[referral-courses] enrollment query error:', enrollErr);
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ success: true, courses: [] });
    }

    // Deduplicate product IDs (a student might have multiple cohort records for same product)
    const productIds: string[] = [
      ...new Set(
        enrollments
          .map(e => e.learning_product_id)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    if (productIds.length === 0) {
      return NextResponse.json({ success: true, courses: [] });
    }

    // 3. Fetch product details — status is uppercase "PUBLISHED" in this DB
    const { data: products, error: prodErr } = await supabaseAdmin
      .from('learning_products')
      .select('id, title, slug, price, thumbnail_url, status')
      .in('id', productIds)
      .in('status', ['PUBLISHED', 'published']); // handle both cases

    if (prodErr) {
      console.error('[referral-courses] products query error:', prodErr);
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ success: true, courses: [] });
    }

    // 4. Get partner's existing referral codes
    const { data: partnerCodes } = await supabaseAdmin
      .from('referral_codes')
      .select('id, code')
      .or(`owner_id.eq.${partner.id},partner_id.eq.${partner.id}`);

    const codeIds = (partnerCodes || []).map((c: any) => c.id);

    // 5. Get existing affiliate links already created for these products
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

    // 6. Ensure the partner has a base referral code
    let baseRefCode = (partnerCodes || [])[0] || null;
    if (!baseRefCode) {
      const code = generateStudentCode();
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';

    // 7. Build course cards with commission + link
    const courseCards = await Promise.all(
      products.map(async (product: any) => {
        const studentCommission = await getCommissionRate('student', product.id);

        let linkCode = existingLinksMap[product.id];

        // Auto-create affiliate_link entry for this enrolled course if one doesn't exist
        if (!linkCode && baseRefCode) {
          const { error: insertErr } = await supabaseAdmin
            .from('affiliate_links')
            .insert({
              referral_code_id: baseRefCode.id,
              learning_product_id: product.id,
              unique_code: baseRefCode.code,
            });

          if (!insertErr) {
            linkCode = baseRefCode.code;
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
