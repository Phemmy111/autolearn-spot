"use client";

import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { StudentTestimonialCard } from '@/components/student-testimonial-card';
import { studentTestimonials } from '@/config/testimonials';

export function AnimatedTestimonialsSection() {
  const [sectionRef, isVisible] = useScrollAnimation(0.1);

  return (
    <section ref={sectionRef} className="py-6 sm:py-8 lg:py-12 bg-[#0c0e12]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className={`text-center mb-4 sm:mb-6 lg:mb-8 reveal-on-scroll ${isVisible ? 'is-visible' : ''}`}>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e2e2e8] mb-3 sm:mb-4">
            What Our Students Say
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {studentTestimonials.map((testimonial, index) => (
            <div key={testimonial.name} className={`reveal-on-scroll ${isVisible ? 'is-visible' : ''}`} style={{ transitionDelay: `${0.1 + index * 0.1}s` }}>
              <StudentTestimonialCard
                name={testimonial.name}
                school={testimonial.school}
                rating={testimonial.rating}
                testimonial={testimonial.testimonial}
                verified={testimonial.verified}
                image={testimonial.image}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
