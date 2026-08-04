import { MessageCircle, Share2 } from 'lucide-react';

interface SocialIconProps {
  platform: string;
  href: string;
  className?: string;
}

const iconMap: Record<string, any> = {
  facebook: Share2,
  instagram: Share2,
  linkedin: Share2,
  youtube: Share2,
  tiktok: Share2,
  x: Share2,
  whatsapp: MessageCircle,
};

export function SocialIcon({ platform, href, className = '' }: SocialIconProps) {
  const Icon = iconMap[platform] || Share2;

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