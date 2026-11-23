// Learning Product Details Page
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import AddToCartButton from '@/components/marketplace/AddToCartButton';
import Image from 'next/image';
import { Star, Clock, User as UserIcon, Globe, CheckCircle2, ChevronRight, PlayCircle, BookOpen, MessageSquare, Edit } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { ProductMediaGallery } from '@/components/marketplace/ProductMediaGallery';
import { Suspense } from 'react';
import { AffiliateRefCapture } from '@/components/affiliate/AffiliateRefCapture';
import { TrackViewContent } from '@/components/analytics/TrackViewContent';
import { CourseStudentReviews } from '@/components/marketplace/CourseStudentReviews';
import { CourseCertificatePreview } from '@/components/marketplace/CourseCertificatePreview';
import { CourseFAQSection } from '@/components/marketplace/CourseFAQSection';
import { MobileFloatingAddToCart } from '@/components/marketplace/MobileFloatingAddToCart';
import { ReviewService } from '@/lib/review-service';
import { getPublicSettings } from '@/lib/public-settings';
import CurriculumWithPreview from '@/components/public/CurriculumWithPreview';

interface PageParams {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { id } = await params;
  const { data: product } = await supabaseAdmin
    .from('learning_products')
    .select('title, description, thumbnail_url')
    .eq('id', id)
    .maybeSingle();

  if (!product) {
    return {
      title: 'Course Not Found',
    };
  }

  const title = `${product.title} | AutoLearn Spot`;
  const description = product.description?.slice(0, 160) || `Learn ${product.title} with hands-on lessons, practical projects, and certificate of completion.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.thumbnail_url ? [{ url: product.thumbnail_url }] : ['/og-image.png'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.thumbnail_url ? [product.thumbnail_url] : ['/og-image.png'],
    },
  };
}

export default async function LearningProductPage({ params }: PageParams) {
  const { id } = await params;

  // 1. Fetch Product
  const { data: product, error } = await supabaseAdmin
    .from('learning_products')
    .select('*')
    .eq('id', id)
    .eq('status', 'PUBLISHED')
    .single();

  if (error || !product) {
    notFound();
    return null;
  }
  
  // Check if current user is the owner
  const { userId } = await auth();
  const isOwner = userId === product.author_id;

  // 2. Fetch Author (support UUID id, user_id, or clerk_user_id)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product.author_id);
  const authorQuery = isUuid
    ? supabaseAdmin.from('authors').select('*').or(`id.eq.${product.author_id},user_id.eq.${product.author_id}`)
    : supabaseAdmin.from('authors').select('*').or(`user_id.eq.${product.author_id},clerk_user_id.eq.${product.author_id}`);

  let { data: authorRecord } = await authorQuery.maybeSingle();

  // Load extra metadata from site_settings if available
  let authorExtra: any = {};
  const publicSettings = await getPublicSettings();
  let certLayout: any = undefined;
  if (publicSettings.certificateLayout) {
    try {
      certLayout = typeof publicSettings.certificateLayout === 'string'
        ? JSON.parse(publicSettings.certificateLayout)
        : publicSettings.certificateLayout;
    } catch {
      // fallback
    }
  }
  if (authorRecord) {
    try {
      const { data: setting } = await supabaseAdmin
        .from('site_settings')
        .select('value')
        .or(`key.eq.author_extra_${authorRecord.id},key.eq.author_extra_${authorRecord.user_id}`)
        .limit(1)
        .maybeSingle();
      if (setting?.value) {
        authorExtra = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
      }
    } catch (e) {
      // ignore
    }
  }

  // Resolve author image: prioritize uploaded images over generic placeholders
  const candidateImages = [
    authorRecord?.profile_image,
    authorExtra?.profile_image,
    authorRecord?.avatar_url,
    authorExtra?.avatar_url,
  ].filter(Boolean);

  const realUploadedImage = candidateImages.find(
    (img: string) => typeof img === 'string' && !img.includes('femi-headshot') && img.trim() !== ''
  );

  const authorName = authorRecord?.display_name || authorRecord?.name || authorExtra?.display_name || 'Expert Instructor';
  const authorImage = realUploadedImage || candidateImages[0] || '/femi-headshot.png';
  const authorBio = authorRecord?.bio || authorExtra?.bio || 'Specialist in scalable automations, enterprise API integrations, and AI agent architectures.';
  const authorTitle = authorRecord?.professional_title || authorExtra?.professional_title || 'Lead AI Automation Architect';

  // 3. Fetch Lessons
  const { data: lessons } = await supabaseAdmin
    .from('lessons')
    .select('title, description, duration_label, order_index')
    .eq('product_id', id)
    .eq('status', 'PUBLISHED')
    .order('order_index', { ascending: true });

  // Fetch real reviews and enrollment counts
  let courseReviews: any[] = [];
  let enrollmentsCount = 0;
  try {
    const [revs, enrollRes] = await Promise.all([
      ReviewService.getCourseReviews(id, true),
      supabaseAdmin
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('learning_product_id', id)
    ]);
    courseReviews = revs || [];
    enrollmentsCount = enrollRes.count || 0;
  } catch (e) {
    console.warn('[learning_products] Error loading reviews or enrollments:', e);
  }

  const reviewCount = courseReviews.length;
  const averageRating = reviewCount > 0
    ? Number((courseReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / reviewCount).toFixed(1))
    : 5.0;
  const totalEnrolled = enrollmentsCount || 0;

  const formattedPrice = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: product.currency || 'NGN',
    maximumFractionDigits: 0
  }).format(product.price);

  // Parse Description JSON
  let shortDesc = '';
  let fullDesc = '';
  let learningOutcomes: string[] = ['Master core concepts and advanced techniques'];
  let mediaGallery: string[] = [];
  
  if (product.description) {
    try {
      const parsed = JSON.parse(product.description);
      shortDesc = parsed.short_description || '';
      fullDesc = parsed.full_description || '';
      if (Array.isArray(parsed.learning_outcomes) && parsed.learning_outcomes.length > 0) {
        learningOutcomes = parsed.learning_outcomes;
      }
      if (Array.isArray(parsed.media_gallery)) {
        mediaGallery = parsed.media_gallery;
      }
    } catch (e) {
      // Not JSON, use as is
      shortDesc = product.description;
    }
  }

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-20">
      {/* Meta Pixel ViewContent */}
      <TrackViewContent
        product={{
          id: product.id,
          title: product.title,
          price: product.price,
          currency: product.currency,
          category: product.category,
        }}
      />
      <Suspense fallback={null}>
        <AffiliateRefCapture />
      </Suspense>

      {/* Breadcrumbs / Top Nav */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 pt-24 flex items-center justify-between">
          <div className="flex items-center text-sm text-muted-foreground font-medium">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
            <Link href="/#products" className="hover:text-foreground transition-colors">Marketplace</Link>
            <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
            <span className="text-foreground truncate max-w-[200px] sm:max-w-none">{product.title}</span>
          </div>
          
          {isOwner && (
            <Link 
              href={`/author/products/${product.id}/edit`} 
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[var(--card)] border border-brand-border hover:bg-brand-bg text-brand-text text-xs font-semibold rounded-md transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit Course
            </Link>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-12">
            {/* Title & Metadata */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
              <div className="inline-block px-3 py-1 mb-4 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-semibold tracking-wide border border-brand-primary/20">
                {product.product_type || 'Premium Course'}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-foreground leading-[1.1] tracking-tight mb-6">
                {product.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground font-medium">
                <div className="flex items-center gap-1.5 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 fill-current ${
                        star <= Math.round(averageRating) ? 'text-amber-500' : 'text-amber-500/25'
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-foreground font-semibold">{averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground text-sm font-normal">
                    ({reviewCount > 0 ? `${reviewCount} ${reviewCount === 1 ? 'rating' : 'ratings'}` : `${totalEnrolled} students`})
                  </span>
                </div>
                <div className="hidden sm:block w-1 h-1 rounded-full bg-border" />
                
                <Link href={`/instructors/${product.author_id}`} className="flex items-center gap-2 hover:text-brand-primary transition-colors text-foreground">
                  {authorImage ? (
                    <Image src={authorImage} alt={authorName} width={24} height={24} className="rounded-full object-cover w-6 h-6" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                  )}
                  {authorName}
                </Link>
                
                <div className="hidden sm:block w-1 h-1 rounded-full bg-border" />
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  English
                </div>
              </div>
            </div>

            {/* Media Gallery (Temu Style) */}
            <ProductMediaGallery 
              thumbnailUrl={product.thumbnail_url} 
              mediaGallery={mediaGallery} 
            />

            {/* Description Section */}
            <div className="prose prose-lg dark:prose-invert max-w-none animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
              <h2 className="text-2xl font-heading font-bold mb-4 text-foreground">About this course</h2>
              <p className="text-slate-900 dark:text-slate-100 leading-relaxed text-base sm:text-lg font-medium">
                {shortDesc || 'No summary available.'}
              </p>
              {fullDesc && (
                <div className="mt-6 text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap text-base font-normal">
                  {fullDesc}
                </div>
              )}
              
              <h3 className="text-xl font-heading font-bold mt-10 mb-6 text-foreground">What you'll learn</h3>
              <ul className="grid sm:grid-cols-2 gap-4 mb-8 list-none pl-0">
                {learningOutcomes.map((outcome, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-slate-900 dark:text-slate-100 font-semibold leading-snug">{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Guaranteed Certificate of Completion Preview */}
            <CourseCertificatePreview
              courseTitle={product.title}
              authorName={authorName}
              category={product.category || product.product_type}
              initialLayout={certLayout}
            />

            {/* Curriculum (Lessons) Section */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 fill-mode-both">
              <h2 className="text-2xl font-heading font-bold mb-6">Course Curriculum</h2>
              <CurriculumWithPreview
                lessons={lessons || []}
                product={{
                  id: product.id,
                  title: product.title,
                  price: product.price,
                  currency: product.currency,
                }}
                isEnrolled={Boolean(isEnrolled)}
              />
            </div>
            
            {/* Author Profile Block */}
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-600 fill-mode-both">
              <h2 className="text-2xl font-heading font-bold mb-6">About the Instructor</h2>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <Link href={`/instructors/${product.author_id}`} className="shrink-0">
                  {authorImage ? (
                    <Image src={authorImage} alt={authorName} width={120} height={120} className="rounded-full object-cover w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] border-4 border-muted" />
                  ) : (
                    <div className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-full bg-brand-primary/10 flex items-center justify-center border-4 border-muted">
                      <UserIcon className="w-12 h-12 text-brand-primary" />
                    </div>
                  )}
                </Link>
                <div>
                  <Link href={`/instructors/${product.author_id}`} className="hover:text-brand-primary transition-colors">
                    <h3 className="text-xl font-bold text-foreground mb-1">{authorName}</h3>
                  </Link>
                  <p className="text-brand-primary font-medium text-sm mb-4">{authorTitle}</p>
                  
                  {authorBio ? (
                    <p className="text-muted-foreground line-clamp-4 leading-relaxed mb-4">
                      {authorBio}
                    </p>
                  ) : (
                    <p className="text-muted-foreground mb-4">
                      {authorName} is an expert instructor bringing practical, real-world skills to the platform.
                    </p>
                  )}
                  
                  <Link href={`/instructors/${product.author_id}`} className="text-sm font-bold text-foreground hover:text-brand-primary transition-colors inline-flex items-center gap-1">
                    View Full Profile <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Frequently Asked Questions */}
            <CourseFAQSection courseTitle={product.title} />

            {/* Student Reviews Section */}
            <CourseStudentReviews courseId={id} courseTitle={product.title} courseSlug={product.slug || id} />

          </div>

          {/* Sticky Sidebar */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-32 bg-card border border-border rounded-3xl p-6 shadow-xl shadow-black/5 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
              <div className="mb-6">
                <div className="text-4xl font-extrabold text-foreground tracking-tight mb-2">
                  {formattedPrice}
                </div>
                <div className="text-sm text-muted-foreground">
                  One-time payment • Lifetime access
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm text-foreground font-medium">
                  <PlayCircle className="w-5 h-5 text-brand-primary" />
                  <span>{lessons?.length || 0} Video Lessons</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground font-medium">
                  <Clock className="w-5 h-5 text-brand-primary" />
                  <span>Self-paced learning</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground font-medium">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary" />
                  <span>Guaranteed Certificate of completion</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground font-medium">
                  <MessageSquare className="w-5 h-5 text-brand-primary" />
                  <span>Instructor Q&A Support</span>
                </div>
              </div>

              <AddToCartButton productId={product.id} />

              <a
                href={publicSettings.whatsappCommunityLink || "https://chat.whatsapp.com/DJrJYaW3nIy74xtFnZlJM3?s=cl&p=a&iam=2"}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-xs transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                Join Student WhatsApp Community
              </a>
              
              <p className="text-xs text-center text-muted-foreground mt-4 font-medium">
                30-Day Money-Back Guarantee
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Add to Cart Bar on Mobile */}
      <MobileFloatingAddToCart
        productId={product.id}
        productTitle={product.title}
        price={Number(product.price) || 0}
        formattedPrice={formattedPrice}
        currency={product.currency || 'NGN'}
      />
    </div>
  );
}
