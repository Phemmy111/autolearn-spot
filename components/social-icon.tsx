import { Facebook, Instagram, Linkedin, Youtube, MessageCircle } from 'lucide-react';

interface SocialIconProps {
  platform: string;
  href: string;
  className?: string;
}

const iconMap = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: Youtube, // Using YouTube as fallback for TikTok
  x: MessageCircle, // Using MessageCircle as fallback for X
  whatsapp: MessageCircle,
};

export function SocialIcon({ platform, href, className = '' }: SocialIconProps) {
  const Icon = iconMap[platform as keyof typeof iconMap] || MessageCircle;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center w-10 h-10 border border-[#1f2229] bg-[#0c0e12] rounded-lg hover:border-[#00f0ff] hover:bg-[#00f0ff]/10 transition-all duration-300 ${className}`}
      aria-label={platform}
    >
      <Icon className="h-5 w-5 text-[#b9cacb] hover:text-[#00f0ff]" />
    </a>
  );
}