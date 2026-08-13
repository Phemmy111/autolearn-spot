"use client";

import { useState, useEffect } from 'react';
import { StudentTestimonialCard } from '@/components/student-testimonial-card';
import { Play } from 'lucide-react';

interface Testimonial {
  id: string;
  student_name: string;
  cohort: string;
  course: string;
  screenshot_url: string;
  media_url: string;
  media_type: string;
  thumbnail_url: string;
  caption: string;
  featured: boolean;
  enabled: boolean;
  display_order: number;
}

export function DynamicTestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const res = await fetch('/api/content/testimonials?enabled=true');
        if (res.ok) {
          const data = await res.json();
          setTestimonials(data.testimonials || []);
        }
      } catch (error) {
        console.error('Failed to fetch testimonials:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTestimonials();
  }, []);

  if (isLoading) {
    return (
      <section className="py-6 sm:py-8 lg:py-12 bg-[#0c0e12]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-4 sm:mb-6 lg:mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e2e2e8] mb-3 sm:mb-4">
              What Our Students Say
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-[#1f2229] bg-[#0c0e12]/50 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-[#1f2229] rounded mb-4"></div>
                <div className="h-3 bg-[#1f2229] rounded mb-2"></div>
                <div className="h-3 bg-[#1f2229] rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null; // Don't show section if no testimonials
  }

  return (
    <section className="py-6 sm:py-8 lg:py-12 bg-[#0c0e12]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e2e2e8] mb-3 sm:mb-4">
            What Our Students Say
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
              <div className="mb-4 relative">
                {testimonial.media_type === 'video' ? (
                  <div className="relative">
                    <video
                      src={testimonial.screenshot_url || testimonial.media_url}
                      poster={testimonial.thumbnail_url}
                      className="w-full h-48 object-cover rounded-lg"
                      muted
                      playsInline
                      controls
                    />
                  </div>
                ) : (
                  <img
                    src={testimonial.screenshot_url || testimonial.media_url}
                    alt={`Testimonial from ${testimonial.student_name || 'Student'}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
              </div>
              {testimonial.student_name && (
                <h3 className="text-lg font-semibold text-[#e2e2e8] mb-1">{testimonial.student_name}</h3>
              )}
              {(testimonial.cohort || testimonial.course) && (
                <p className="text-xs text-[#b9cacb] mb-2">
                  {testimonial.cohort && `${testimonial.cohort} `}
                  {testimonial.course && `• ${testimonial.course}`}
                </p>
              )}
              {testimonial.caption && (
                <p className="text-sm text-[#b9cacb] line-clamp-3">{testimonial.caption}</p>
              )}
              {testimonial.featured && (
                <span className="inline-block mt-2 px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded-full">
                  Featured
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}