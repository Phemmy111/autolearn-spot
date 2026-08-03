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
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'
        }`}
      />
    ));
  };

  return (
    <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl p-6 rounded-2xl hover:border-[#00f0ff]/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.1)]">
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          {image ? (
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#00f0ff]/30">
              <Image
                src={image}
                alt={name}
                width={64}
                height={64}
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00f0ff]/20 to-[#00f0ff]/5 border-2 border-[#00f0ff]/30 flex items-center justify-center">
              <span className="text-[#00f0ff] font-semibold text-lg">
                {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
          )}
          {verified && (
            <div className="absolute -bottom-1 -right-1 bg-[#00f0ff] rounded-full p-1">
              <CheckCircle className="h-3 w-3 text-[#00363a]" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-[#e2e2e8] text-base">{name}</h3>
          <p className="text-sm text-[#b9cacb] mt-1">{school}</p>
          <div className="flex items-center gap-1 mt-2">
            {renderStars(rating)}
            <span className="text-xs text-[#b9cacb] ml-2">({rating}/5)</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-[#b9cacb] leading-relaxed">"{testimonial}"</p>
    </div>
  );
}