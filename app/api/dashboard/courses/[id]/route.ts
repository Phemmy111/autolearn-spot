import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const primaryEmail = user.primaryEmailAddress?.emailAddress;

    // Verify enrollment
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq(#learning_product_id', id)
      .eq('status', 'active')
      .or(`clerk_user_id.eq${userId},email.eq${primaryEmail}`)
      .limit(1)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
    }

    // Fetch product details
    const { data: product, error: productError } = await supabaseAdmin
      .from('learning_products')
      .select('id, title, description, thumbnail_url')
      .eq('id', id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status:ãNJNÂˆB‚ˆËÈ™]Ú\ÜÛÛœÂˆÛÛœİÈ]Nˆ\ÜÛÛœË\œ›Üˆ\ÜÛÛœÑ\œ›ÜˆHH]ØZ]İ\X˜\ÙPYZ[‚ˆ™œ›ÛJ	Û\ÜÛÛœÉÊBˆœÙ[Xİ
	ÚY]ZYÚY]K\ØÜš\[Û‹\˜][Û—ÛX™[Ü™\—Ú[™^\×Ü™\]Z\™Y]˜Z[X›WØ][İ]X™Wİ[X›˜Z[	ÊBˆ™\J	Ü›ÙXİÚY	ËY
Bˆ›Ü™\Š	ÛÜ™\—Ú[™^	ËÈ\ØÙ[™[™ÎˆYHJNÂ‚ˆYˆ
\ÜÛÛœÑ\œ›ÜŠHÂˆÛÛœÛÛK™\œ›ÜŠ	Ñ\œ›Üˆ™]Ú[™È\ÜÛÛœÎ‰Ë\ÜÛÛœÑ\œ›ÜŠNÂˆB‚ˆ™]\›ˆ™^™\ÜÛœÙKšœÛÛŠÈˆİXØÙ\ÜÎˆYKˆÛİ\œÙNˆ›ÙXİˆ\ÜÛÛœÎˆ\ÜÛÛœÈ×BˆJNÂˆHØ]Ú
\œ›Üˆ[JHÂˆÛÛœÛÛK™\œ›ÜŠ	Ñ\Ú›Ø\™Ûİ\œÙH]Z[TH\œ›Ü‰Ë\œ›ÜŠNÂˆ™]\›ˆ™^™\ÜÛœÙKšœÛÛŠÈ\œ›Üˆ\œ›Ü‹›Y\ÜØYÙH	Ò[\›˜[Ù\™\ˆ\œ›Ü‰ÈKÈİ]\ÎˆLJNÂˆBŸB