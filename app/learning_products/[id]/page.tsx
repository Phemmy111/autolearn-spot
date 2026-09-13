// Learning Product Details Page
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import AddToCartButton from '@/components/marketplace/AddToCartButton';
import Image from 'next/image';
import { Star, Clock, User as UserIcon, Globe, CheckCircle2, ChevronRight, PlayCircle, BookOpen, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface PageParams {
  params: Promise<{ id: string }>;
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

  // 2. Fetch Author
  const { data: author } = await supabaseAdmin
    .from('authors')
    .select('id, display_name, profile_image, professional_title, bio')
    .eq('id', product.author_id)
    .limit(1)
    .single();

  // 3. Fetch Lessons
  const { data: lessons } = await supabaseAdmin
    .from('lessons')
    .select('title, description, duration_label, order_index')
    .eq('product_id', id)
    .eq('status', 'PUBLISHED')
    .order('order_index', { ascending: true });

  const formattedPrice = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: product.currency || 'NGN',
    maximumFractionDigits: 0
  }).format(product.price);

  const authorName = author?.display_name || 'Expert Instructor';

  // Parse Description JSON
  let shortDesc = product.description;
  let fullDesc = '';
  let learningOutcomes: string[] = ['Master core concepts and advanced techniques'];
  
  if (product.description) {
    try {
      const parsed = JSON.parse(product.description);
      shortDesc = parsed.short_description || product.description;
      fullDesc = parsed.full_description || '';
      if (parsed.learning_outcomes && Array.isArray(parsed.learning_outcomes)) {
        learningOutcomes = parsed.learning_outcomes;
      }
    } catch (e) {
      // Not JSON, use as is
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Breadcrumbs / Top Nav */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 pt-24">
          <div className="flex items-center text-sm text-muted-foreground font-medium">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
            <Link href="/#products" className="hover:text-foreground transition-colors">Marketplace</Link>
            <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
            <span className="text-foreground truncate max-w-[200px] sm:max-w-none">{product.title}</span>
          </div>
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
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current opacity-30" />
                  <span className="ml-1 text-foreground">4.8 (124 ratings)</span>
                </div>
                <div className="hidden sm:block w-1 h-1 rounded-full bg-border" />
                
                <Link href={`/creator/${product.author_id}`} className="flex items-center gap-2 hover:text-brand-primary transition-colors text-foreground">
                  {author?.profile_image ? (
                    <Image src={author.profile_image} alt={authorName} width={24} height={24} className="rounded-full object-cover w-6 h-6" />
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

            {/* Main Image / Video Reference Placeholder */}
            <div className="relative aspect-[16/9] w-full bg-muted rounded-3xl overflow-hidden border border-border shadow-sm animate-in fade-in zoom-in-95 duration-700 delay-150 fill-mode-both group">
              {product.thumbnail_url ? (
                <Image
                  src={product.thumbnail_url}
                  alt={product.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-muted-foreground/30" />
                </div>
              )}
              {/* Play Button Overlay (just visual for now to simulate video preview) */}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center cursor-pointer">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:scale-110 transition-transform">
                  <PlayCircle className="w-12 h-12" />
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="prose prose-lg dark:prose-invert max-w-none animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
              <h2 className="text-2xl font-heading font-bold mb-4">About this course</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {shortDesc || 'No summary available.'}
              </p>
              {fullDesc && (
                <div className="mt-6 text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {fullDesc}
                </div>
              )}
              
              <h3 className="text-xl font-heading font-bold mt-10 mb-6">What you'll learn</h3>
              <ul className="grid sm:grid-cols-2 gap-4 mb-8 list-none pl-0">
                {learningOutcomes.map((outcome, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0 mt-1" />
                    <span className="text-muted-foreground leading-snug">{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Curriculum (Lessons) Section */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 fill-mode-both">
              <h2 className="text-2xl font-heading font-bold mb-6">Course Curriculum</h2>
              {lessons && lessons.length > 0 ? (
                <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
                  {lessons.map((lesson, idx) => (
                    <div key={idx} className="p-4 sm:p-6 hover:bg-muted/30 transition-colors flex gap-4">
                      <div className="shrink-0 mt-1">
                        <PlayCircle className="w-6 h-6 text-brand-primary/60" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-lg mb-1">{lesson.title}</h4>
                        {lesson.description && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{lesson.description}</p>}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {lesson.duration_label || 'Self-paced'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl p-8 text-center">
                  <p className="text-muted-foreground">Curriculum details are being updated by the author.</p>
                </div>
              )}
            </div>
            
            {/* Author Profile Block */}
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-600 fill-mode-both">
              <h2 className="text-2xl font-heading font-bold mb-6">About the Instructor</h2>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <Link href={`/creator/${product.author_id}`} className="shrink-0">
                  {author?.profile_image ? (
                    <Image src={author.profile_image} alt={authorName} width={120} height={120} className="rounded-full object-cover w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] border-4 border-muted" />
                  ) : (
                    <div className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-full bg-brand-primary/10 flex items-center justify-center border-4 border-muted">
                      <UserIcon className="w-12 h-12 text-brand-primary" />
                    </div>
                  )}
                </Link>
                <div>
                  <Link href={`/creator/${product.author_id}`} className="hover:text-brand-primary transition-colors">
                    <h3 className="text-xl font-bold text-foreground mb-1">{authorName}</h3>
                  </Link>
                  <p className="text-brand-primary font-medium text-sm mb-4">{author?.professional_title || 'Expert Course Creator'}</p>
                  
                  {author?.bio ? (
                    <p className="text-muted-foreground line-clamp-4 leading-relaxed mb-4">
                      {author.bio}
                    </p>
                  ) : (
                    <p className="text-muted-foreground mb-4">
                      {authorName} is an expert instructor bringing practical, real-world skills to the platform.
                    </p>
                  )}
                  
                  <Link href={`/creator/${product.author_id}`} className="text-sm font-bold text-foreground hover:text-brand-primary transition-colors inline-flex items-center gap-1">
                    View Full Profile <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Reviews Section Placeholder */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700 fill-mode-both">
              <h2 className="text-2xl font-heading font-bold mb-6 flex items-center gap-2">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                Student Reviews
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                        S{i}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Student {i}</h4>
                        <div className="flex text-amber-500">
                          {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-current" />)}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      "This course was exactly what I needed! Highly recommend to anyone looking to level up their skills quickly."
                    </p>
                  </div>
                ))}
              </div>
            </div>

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
                  <span>Certificate of completion</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground font-medium">
                  <MessageSquare className="w-5 h-5 text-brand-primary" />
                  <span>Instructor Q&A Support</span>
                </div>
              </div>

              <AddToCartButton productId={product.id} />
              
              <p className="text-xs text-center text-muted-foreground mt-4 font-medium">
                30-Day Money-Back Guarantee
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
