"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, CheckCircle, Loader2, Play } from 'lucide-react';
import { getPublicSettings } from '@/lib/public-settings';

interface Testimonial {
  id: string;
  student_name: string;
  cohort: string;
  course: string;
  screenshot_url: string;
  media_url: string;
  media_type: string;
  thumbnail_url: string;
  profile_image_url: string;
  social_profile_url: string;
  caption: string;
  featured: boolean;
  enabled: boolean;
  display_order: number;
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    siteName: 'AutoLearn Spot',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const loadedSettings = await getPublicSettings(['siteName']);
        setSettings(loadedSettings);

        const res = await fetch('/api/content/testimonials?enabled=true');
        if (res.ok) {
          const data = await res.json();
          setTestimonials(data.testimonials || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#00f0ff] animate-spin" />
      </div>
    );
  }

  const featuredTestimonials = testimonials.filter(t => t.featured);
  const regularTestimonials = testimonials.filter(t => !t.featured);

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <div className="border-b border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-[#b9cacb] hover:text-white transition-colors mb-4">
            <ArrowLeft className="h-5 w-5" />
            Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#e2e2e8] mb-2">
            Real Students. Real Results.
          </h1>
          <p className="text-lg text-[#b9cacb] max-w-2xl">
            See experiences from learners who have mastered AI automation with {settings.siteName}
          </p>
        </div>
      </div>

      {/* Featured Testimonials */}
      {featuredTestimonials.length > 0 && (
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#e2e2e8] mb-3">
                Featured Stories
              </h2>
              <div className="w-20 h-1 bg-[#00f0ff] mx-auto rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {featuredTestimonials.map((testimonial) => (
                <div key={testimonial.id} className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 hover:border-[#00f0ff]/50 transition-all duration-300">
                  <div className="mb-6 relative">
                    {testimonial.media_type === 'video' ? (
                      <div className="relative">
                        <video
                          src={testimonial.screenshot_url || testimonial.media_url}
                          poster={testimonial.thumbnail_url}
                          className="w-full h-64 sm:h-80 object-cover rounded-xl"
                          muted
                          playsInline
                          controls
                        />
                      </div>
                    ) : (
                      <img
                        src={testimonial.screenshot_url || testimonial.media_url}
                        alt={`Testimonial from ${testimonial.student_name || 'Student'}`}
                        className="w-full h-64 sm:h-80 object-cover rounded-xl"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    {testimonial.profile_image_url ? (
                      <a
                        href={testimonial.social_profile_url || '#'}
                        target={testimonial.social_profile_url ? '_blank' : undefined}
                        rel={testimonial.social_profile_url ? 'noopener noreferrer' : undefined}
                        className={`relative group ${testimonial.social_profile_url ? 'cursor-pointer' : ''}`}
                      >
                        <img
                          src={testimonial.profile_image_url}
                          alt={testimonial.student_name || 'Student'}
                          className="w-16 h-16 rounded-full object-cover border-2 border-[#1f2229] group-hover:border-[#00f0ff] transition-colors"
                        />
                        {testimonial.social_profile_url && (
                          <div className="absolute inset-0 rounded-full bg-[#00f0ff]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </a>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#1f2229] border-2 border-[#1f2229] flex items-center justify-center">
                        <span className="text-[#b9cacb] text-sm font-semibold">
                          {(testimonial.student_name || 'S')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      {testimonial.student_name && (
                        <h3 className="text-xl font-semibold text-[#e2e2e8]">{testimonial.student_name}</h3>
                      )}
                      {(testimonial.cohort || testimonial.course) && (
                        <p className="text-sm text-[#b9cacb]">
                          {testimonial.cohort && `${testimonial.cohort} `}
                          {testimonial.course && `• ${testimonial.course}`}
                        </p>
                      )}
                    </div>
                  </div>
                  {testimonial.caption && (
                    <p className="text-[#b9cacb] leading-relaxed text-lg">"{testimonial.caption}"</p>
                  )}
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-400 text-sm rounded-full">
                      <Star className="h-4 w-4 fill-current" />
                      Featured
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Testimonials */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#e2e2e8] mb-3">
              All Testimonials
            </h2>
            <div className="w-20 h-1 bg-[#00f0ff] mx-auto rounded-full"></div>
          </div>
          
          {regularTestimonials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularTestimonials.map((testimonial) => (
                <div key={testimonial.id} className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-6 hover:border-[#00f0ff]/50 transition-all duration-300">
                  <div className="mb-4 relative">
                    {testimonial.media_type === 'video' ? (
                      <div className="relative">
                        <video
                          src={testimonial.screenshot_url || testimonial.media_url}
                          poster={testimonial.thumbnail_url}
                          className="w-full h-48 object-cover rounded-xl"
                          muted
                          playsInline
                          controls
                        />
                      </div>
                    ) : (
                      <img
                        src={testimonial.screenshot_url || testimonial.media_url}
                        alt={`Testimonial from ${testimonial.student_name || 'Student'}`}
                        className="w-full h-48 object-cover rounded-xl"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    {testimonial.profile_image_url ? (
                      <a
                        href={testimonial.social_profile_url || '#'}
                        target={testimonial.social_profile_url ? '_blank' : undefined}
                        rel={testimonial.social_profile_url ? 'noopener noreferrer' : undefined}
                        className={`relative group ${testimonial.social_profile_url ? 'cursor-pointer' : ''}`}
                      >
                        <img
                          src={testimonial.profile_image_url}
                          alt={testimonial.student_name || 'Student'}
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#1f2229] group-hover:border-[#00f0ff] transition-colors"
                        />
                        {testimonial.social_profile_url && (
                          <div className="absolute inset-0 rounded-full bg-[#00f0ff]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </a>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#1f2229] border-2 border-[#1f2229] flex items-center justify-center">
                        <span className="text-[#b9cacb] text-xs font-semibold">
                          {(testimonial.student_name || 'S')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    {testimonial.student_name && (
                      <h3 className="text-lg font-semibold text-[#e2e2e8]">{testimonial.student_name}</h3>
                    )}
                  </div>
                  {(testimonial.cohort || testimonial.course) && (
                    <p className="text-xs text-[#b9cacb] mb-2">
                      {testimonial.cohort && `${testimonial.cohort} `}
                      {testimonial.course && `• ${testimonial.course}`}
                    </p>
                  )}
                  {testimonial.caption && (
                    <p className="text-sm text-[#b9cacb] line-clamp-3">{testimonial.caption}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#b9cacb]">No testimonials available yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl py-8">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 text-center">
          <p className="text-[#b9cacb] text-sm">
            © {new Date().getFullYear()} {settings.siteName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
