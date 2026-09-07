// Learning Product Details Page
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import AddToCartButton from '@/components/marketplace/AddToCartButton';
import Image from 'next/image';
import { Star, Clock, User, Globe, CheckCircle2, ChevronRight, PlayCircle, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface PageParams {
  params: { id: string };
}

export default async function LearningProductPage({ params }: PageParams) {
  const { id } = params;

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

  const formattedPrice = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: product.currency || 'NGN',
    maximumFractionDigits: 0
  }).format(product.price);

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumbs / Top Nav */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3">
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
          <div className="lg:col-span-8 space-y-10">
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
                <div className="flex items-center gap-1.5 text-foreground">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Expert Instructor
                </div>
                <div className="hidden sm:block w-1 h-1 rounded-full bg-border" />
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  English
                </div>
              </div>
            </div>

            {/* Main Image */}
            <div className="relative aspect-[16/9] w-full bg-muted rounded-3xl overflow-hidden border border-border shadow-sm animate-in fade-in zoom-in-95 duration-700 delay-150 fill-mode-both">
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
            </div>

            {/* Description */}
            <div className="prose prose-lg dark:prose-invert max-w-none animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
              <h2 className="text-2xl font-heading font-bold mb-4">About this course</h2>
              <p className="text-muted-foreground leading-relaxed">
                {product.description || 'No detailed description available.'}
              </p>
              
              <h3 className="text-xl font-heading font-bold mt-8 mb-4">What you'll learn</h3>
              <ul className="grid sm:grid-cols-2 gap-3 mb-8 list-none pl-0">
                {[1,2,3,4].map(i => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Master core concepts and advanced techniques</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Curriculum */}
            {product.curriculum && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 fill-mode-both">
                <h2 className="text-2xl font-heading font-bold mb-6">Course Curriculum</h2>
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-3">
                    <PlayCircle className="w-5 h-5 text-brand-primary" />
                    <span className="font-semibold text-foreground">Curriculum Preview</span>
                  </div>
                  <div className="p-4 overflow-x-auto">
                    <pre className="text-sm text-muted-foreground font-mono">
                      {JSON.stringify(product.curriculum, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-24 bg-card border border-border rounded-3xl p-6 shadow-xl shadow-black/5 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
              <div className="mb-6">
                <div className="text-3xl font-bold text-foreground tracking-tight mb-2">
                  {formattedPrice}
                </div>
                <div className="text-sm text-muted-foreground">
                  One-time payment • Lifetime access
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <PlayCircle className="w-5 h-5 text-brand-primary" />
                  <span>On-demand video content</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <Clock className="w-5 h-5 text-brand-primary" />
                  <span>Self-paced learning</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary" />
                  <span>Certificate of completion</span>
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
