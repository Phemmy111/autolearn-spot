'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export type TransitionStyle = 'fade' | 'slide-left' | 'slide-right' | 'zoom';
export type MediaType = 'image' | 'video';

export interface SliderMedia {
  id: string;
  media_url: string;
  media_type: MediaType;
  order_index: number;
}

interface DynamicSliderProps {
  media: SliderMedia[];
  transitionStyle?: TransitionStyle;
  durationMs?: number;
  className?: string;
  autoPlay?: boolean;
}

export function DynamicSlider({
  media,
  transitionStyle = 'fade',
  durationMs = 5000,
  className = '',
  autoPlay = true,
}: DynamicSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance logic
  useEffect(() => {
    if (!autoPlay || media.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % media.length);
    }, durationMs);

    return () => clearInterval(timer);
  }, [autoPlay, media.length, durationMs]);

  if (!media || media.length === 0) return null;

  // Define transition variants based on style
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    'slide-left': {
      initial: { opacity: 0, x: 100 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -100 },
    },
    'slide-right': {
      initial: { opacity: 0, x: -100 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 100 },
    },
    zoom: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.05 },
    },
  };

  const selectedVariant = variants[transitionStyle] || variants.fade;
  const currentMedia = media[currentIndex];

  return (
    <div className={`relative overflow-hidden w-full h-full ${className}`}>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentMedia.id}
          variants={selectedVariant}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full flex items-center justify-center bg-black"
        >
          {currentMedia.media_type === 'video' ? (
            <video
              src={currentMedia.media_url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={currentMedia.media_url}
              alt="Slider Media"
              className="w-full h-full object-cover"
            />
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Slide Indicators */}
      {media.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
          {media.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentIndex === index ? 'w-8 bg-brand-primary' : 'w-2 bg-white/50 hover:bg-white'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
