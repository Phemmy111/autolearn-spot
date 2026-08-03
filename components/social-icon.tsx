import Image from 'next/image';

interface SocialIconProps {
  src: string;
  alt: string;
  href: string;
  className?: string;
}

export function SocialIcon({ src, alt, href, className = '' }: SocialIconProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center w-10 h-10 border border-[#1f2229] bg-[#0c0e12] rounded-lg hover:border-[#00f0ff] hover:bg-[#00f0ff]/10 transition-all duration-300 ${className}`}
      aria-label={alt}
    >
      <Image
        src={src}
        alt={alt}
        width={20}
        height={20}
        className="text-[#b9cacb] hover:text-[#00f0ff]"
      />
    </a>
  );
}