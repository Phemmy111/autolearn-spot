'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BookOpen, PlayCircle } from 'lucide-react';

interface ProductMediaGalleryProps {
  thumbnailUrl: string | null;
  mediaGallery: string[];
}

export function ProductMediaGallery({ thumbnailUrl, mediaGallery }: ProductMediaGalleryProps) {
  const allMedia = [thumbnailUrl, ...mediaGallery].filter((url): url is string => !!url);
  const [activeIndex, setActiveIndex] = useState(0);

  if (allMedia.length === 0) {
    return (
      <div className="relative aspect-video bg-muted/30 flex items-center justify-center rounded-2xl overflow-hidden border border-border">
        <BookOpen className="w-16 h-16 text-muted-foreground/30" />
      </div>
    );
  }

  const activeUrl = allMedia[activeIndex];
  const isVideo = (url: string) => url.match(/\.(mp4|webm|ogg)$/i);

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
      {/* Main Display */}
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-border shadow-md">
        {isVideo(activeUrl) ? (
          <video 
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
            src={activeUrl}
            alt="Product media"
            fill
            className="object-contain bg-muted/10"
            priority
          />
        )}
      </div>

      {/* Thumbnails Row */}
      {allMedia.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
          {allMedia.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={"relative h-20 min-w-[80px] w-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all snap-start " + (activeIndex === idx ? 'border-brand-primary opacity-100' : 'border-transparent opacity-60 hover:opacity-100')}
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
