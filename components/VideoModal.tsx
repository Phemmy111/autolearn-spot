"use client";

import { useState, useEffect, useRef } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
}

export function VideoModal({ isOpen, onClose, videoUrl }: VideoModalProps) {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play().catch(err => console.log('Auto-play prevented:', err));
    }
  }, [isOpen]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl bg-[#0c0e12] border border-[#1f2229] rounded-xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>

        {/* Video player */}
        <div className="relative">
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            muted={isMuted}
            playsInline
            controls
            className="w-full aspect-video"
          />
          
          {/* Mute button overlay */}
          <button
            onClick={toggleMute}
            className="absolute bottom-4 right-4 flex items-center justify-center w-10 h-10 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5 text-white" />
            ) : (
              <Volume2 className="h-5 w-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}