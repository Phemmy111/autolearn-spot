import { CheckCircle, Star } from 'lucide-react';
import Image from 'next/image';

interface StudentTestimonialCardProps {
  image?: string;
  name: string;
  school: string;
  rating: number;
  testimonial: string;
  verified?: boolean;
}

export function StudentTestimonialCard({
  image,
  name,
  school,
  rating,
  testimonial,
  verified = false
}: StudentTestimonialCardProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="border border-[var(--border-default)] bg-[var(--card)] p-6 rounded-2xl shadow-sm hover:border-[var(--primary)] hover:shadow-lg transition-all duration-300">
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          {image ? (
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--border-default)]">
              <Image
                src={image}
                alt={name}
                width={64}
                height={64}
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary-light)] to-[var(--primary-light)]/30 border-2 border-[var(--border-default)] flex items-center justify-center">
              <span className="text-[var(--primary)] font-semibold text-lg">
                {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
          )}
          {verified && (
            <div className="absolute -bottom-1 -right-1 bg-[var(--primary)] rounded-full p-1">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-[var(--text-primary)] text-base">{name}</h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">{school}</p>
          <div className="flex items-center gap-1 mt-2">
            {renderStars(rating)}
            <span className="text-xs text-[var(--text-muted)] ml-2">({rating}/5)</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-[var(--text-body)] leading-relaxed">"{testimonial}"</p>
    </div>
  );
}