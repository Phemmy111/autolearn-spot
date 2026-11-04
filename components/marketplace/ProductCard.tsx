import Link from 'next/link';
import Image from 'next/image';
import { Star, Clock, BookOpen, User } from 'lucide-react';
import { LearningProduct } from '@/types/product';
import AddToCartButton from './AddToCartButton';

interface ProductCardProps {
  product: LearningProduct;
  authorName?: string;
  rating?: number;
  enrolledCount?: number;
}

export function ProductCard({ product, authorName = 'Expert Instructor', rating = 0, enrolledCount = 0 }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: product.currency || 'NGN',
    maximumFractionDigits: 0
  }).format(product.price);

  return (
    <div className="group flex flex-col bg-[var(--card)] border border-brand-border/60 rounded-2xl overflow-hidden hover:border-[#10b981]/40 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1">
      {/* Thumbnail Container */}
      <Link href={`/learning_products/${product.id}`} className="relative aspect-[4/3] block overflow-hidden bg-[var(--card)] brightness-95">
        {product.thumbnail_url ? (
          <Image
            src={product.thumbnail_url}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-400 font-medium text-sm tracking-widest bg-[var(--card)] brightness-95">
            <BookOpen className="w-8 h-8 opacity-20" />
          </div>
        )}
        
        {/* Category Pill */}
        <div className="absolute top-3 left-3 bg-[var(--card)]/95 backdrop-blur-md text-brand-text text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm border border-brand-border/50">
          {product.product_type || 'Course'}
        </div>
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>

      {/* Content Area */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-1.5 text-xs text-brand-text/60 font-medium mb-2.5">
          <div className="flex items-center text-amber-400">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="ml-1 text-brand-text">{rating > 0 ? rating.toFixed(1) : '0.0'}</span>
          </div>
          <span className="text-[10px] ml-1">({enrolledCount})</span>
          <span className="opacity-50">•</span>
          <Link href={`/authors/${product.author_id}`} className="flex items-center gap-1 hover:text-brand-primary transition-colors">
            <User className="w-3.5 h-3.5" />
            {authorName}
          </Link>
        </div>

        <Link href={`/learning_products/${product.id}`} className="block mb-2.5 group/title">
          <h3 className="font-heading font-bold text-lg text-brand-text line-clamp-2 leading-[1.3] group-hover/title:text-[#10b981] transition-colors">
            {product.title}
          </h3>
        </Link>
        
        {(() => {
          if (!product.description) return null;
          let descText = product.description;
          try {
            const parsed = JSON.parse(product.description);
            descText = parsed.short_description || parsed.full_description || product.description;
          } catch (e) {
            // Not JSON, use as is
          }
          return (
            <p className="text-sm text-brand-text/70 line-clamp-2 mb-4 flex-1 leading-relaxed">
              {descText}
            </p>
          );
        })()}

        <div className="mt-auto pt-4 border-t border-brand-border">
          <div className="flex items-center justify-between mb-4">
            <div className="font-bold text-xl text-brand-text tracking-tight">
              {formattedPrice}
            </div>
          </div>
          
          <AddToCartButton productId={product.id} />
        </div>
      </div>
    </div>
  );
}
