import Link from 'next/link';
import Image from 'next/image';
import { Star, Users, Clock, Globe } from 'lucide-react';
import { LearningProduct } from '@/types/product';
import AddToCartButton from './AddToCartButton';

interface ProductCardProps {
  product: LearningProduct;
  authorName?: string; // Phase 5A: pass optionally if fetched
}

export function ProductCard({ product, authorName = 'Instructor' }: ProductCardProps) {
  // Format price (assuming product.price is in standard currency unit like NGN 15000)
  const formattedPrice = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: product.currency || 'NGN',
    maximumFractionDigits: 0
  }).format(product.price);

  return (
    <div className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:border-brand-primary/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1">
      {/* Thumbnail */}
      <Link href={`/learning_products/${product.id}`}>
        {product.thumbnail_url ? (
          <Image
            src={product.thumbnail_url}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono text-xs uppercase tracking-widest">
            No Image
          </div>
        )}
        {/* Category Pill Stub */}
        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm text-foreground text-xs font-semibold px-2 py-1 rounded-md">
          {product.product_type}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <Link href={`/learning_products/${product.id}`} className="block mb-2 hover:text-brand-primary transition-colors">
          <h3 className="font-heading font-bold text-lg text-foreground line-clamp-2 leading-tight">
            {product.title}
          </h3>
        </Link>
        
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
            {product.description}
          </p>
        )}

        {/* Metadata Row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            <span>English</span>
          </div>
          {product.access_duration_days && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{product.access_duration_days} Days</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-border/50 mb-4" />

        {/* Footer: Author & Price */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
              {/* Stub Avatar */}
              <UserAvatar placeholder={authorName.charAt(0)} />
            </div>
            <span className="text-sm font-medium text-foreground">{authorName}</span>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <span className="font-bold text-lg text-foreground">{formattedPrice}</span>
            <AddToCartButton productId={product.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

function UserAvatar({ placeholder }: { placeholder: string }) {
  return <span className="font-semibold text-xs text-muted-foreground">{placeholder}</span>;
}
