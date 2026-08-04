interface SocialIconProps {
  label: string;
  href: string;
  className?: string;
}

export function SocialIcon({ label, href, className = '' }: SocialIconProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center w-28 h-10 border border-[#1f2229] bg-[#0c0e12] rounded-lg hover:border-[#00f0ff] hover:bg-[#00f0ff]/10 transition-all duration-300 hover:scale-105 ${className}`}
      aria-label={label}
    >
      <span className="text-xs font-mono text-[#b9cacb] hover:text-[#00f0ff] uppercase tracking-wider">
        {label}
      </span>
    </a>
  );
}