import Link from 'next/link';
import Image from 'next/image';
import { Star, Clock, BookOpen, User } from 'lucide-react';
import { LearningProduct } from '@/types/product';
import AddToCartButton from './AddToCartButton';

interface ProductCardProps {
  product: LearningProduct;
  authorName?: string;
}

export function ProductCard({ product, authorName = 'Expert Instructor' }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: product.currency || 'NGN',
    maximumFractionDigits: 0
  }).format(product.price);

  return (
    <div className="group flex flex-col bg-white border border-neutral-300/50 rounded-2xl overflow-hidden hover:border-[#10b981]/40 transition-all duration-500 hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 bg-gradient-to-b from-white to-neutral-50">
      {/* Thumbnail Container */}
      <Link href={`/learning_products/${product.id}`} className="relative aspect-[4/3] block overflow-hidden bg-neutral-100">
        {product.thumbnail_url ? (
          <Image
            src={product.thumbnail_url}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-400 font-medium text-sm tracking-widest bg-neutral-100">
            <BookOpen className="w-8 h-8 opacity-20" />
          </div>
        )}
        
        {/* Category Pill */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-neutral-900 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm border border-neutral-300/50">
          {product.product_type || 'Course'}
        </div>
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>

      {/* Content Area */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium mb-2.5">
          <div className="flex items-center text-amber-500">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="ml-1 text-neutral-900">4.8</span>
          </div>
          <span className="opacity-50">•</span>
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {authorName}
          </span>
        </div>

        <Link href={`/learning_products/${product.id}`} className="block mb-2.5 group/title">
          <h3 className="font-heading font-bold text-lg text-neutral-900 line-clamp-2 leading-[1.3] group-hover/title:text-[#10b981] transition-colors">
            {product.title}
          </h3>
        </Link>
        
        {product.description && (
          <p className="text-sm text-neutral-600 line-clamp-2 mb-4 flex-1 leading-relaxed">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-4 border-t border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <div className="font-bold text-xl text-neutral-900 tracking-tight">
              {formattedPrice}
            </div>
          </div>
          
          <AddToCartButton productId={product.id} />
        </div>
      </div>
    </div>
  );
}
