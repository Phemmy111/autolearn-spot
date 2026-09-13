'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { BookOpen, PlayCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductMediaGalleryProps {
  thumbnailUrl: string | null;
  mediaGallery: string[];
}

export function ProductMediaGallery({ thumbnailUrl, mediaGallery }: ProductMediaGalleryProps) {
  const allMedia = [thumbnailUrl, ...mediaGallery].filter((url): url is string => !!url);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const isVideo = (url: string) => url.match(/\.(mp4|webm|ogg)$/i);

  // Auto-scroll logic (Temu style)
  useEffect(() => {
    if (allMedia.length <= 1) return;
    if (isHovered) return;
    
    // Pause auto-scroll if the current media is a video so the user can watch it
    if (isVideo(allMedia[activeIndex])) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % allMedia.length);
    }, 4000); // Auto-advance every 4 seconds

    return () => clearInterval(timer);
  }, [allMedia.length, isHovered, activeIndex]);

  // Keep active thumbnail scrolled into view
  useEffect(() => {
    if (!thumbnailsRef.current) return;
    const activeThumb = thumbnailsRef.current.children[activeIndex] as HTMLElement;
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeIndex]);

  if (allMedia.length === 0) {
    return (
      <div className="relative aspect-video bg-muted/30 flex items-center justify-center rounded-2xl overflow-hidden border border-border">
        <BookOpen className="w-16 h-16 text-muted-foreground/30" />
      </div>
    );
  }

  const activeUrl = allMedia[activeIndex];

  const goPrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1));
  };

  const goNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % allMedia.length);
  };

  return (
    <div 
      className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Display */}
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-border shadow-md group">
        {isVideo(activeUrl) ? (
          <video 
            key={activeUrl}
            src={activeUrl} 
            controls 
            autoPlay 
            muted 
            loop 
            playsInline
            className="w-full h-full object-contain"
          />
        ) : (
          <Image
            key={activeUrl}
            src={activeUrl}
            alt="Product media"
            fill
            className="object-contain bg-muted/10 transition-opacity duration-300"
            priority
          />
        )}
        
        {/* Manual Navigation Arrows (Temu style) */}
        {allMedia.length > 1 && (
          <>
            <button 
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 backdrop-blur-sm shadow-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 backdrop-blur-sm shadow-lg"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {allMedia.length > 1 && (
        <div 
          ref={thumbnailsRef}
          className="flex gap-2 overflow-x-auto pb-2 snap-x scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40"
        >
          {allMedia.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={"relative h-20 min-w-[80px] w-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all snap-start " + (activeIndex === idx ? 'border-brand-primary opacity-100 shadow-sm scale-95' : 'border-transparent opacity-60 hover:opacity-100')}
            >
              {isVideo(url) ? (
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <PlayCircle className="w-8 h-8 text-white/80" />
                </div>
              ) : (
                <Image
                  src={url}
                  alt={"Thumbnail " + (idx + 1)}
                  fill
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
