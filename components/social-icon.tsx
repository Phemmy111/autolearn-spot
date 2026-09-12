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
      className={`flex items-center justify-center w-28 h-10 border border-neutral-200 bg-[#c0c4c9] rounded-lg hover:border-[#10b981] hover:bg-[#10b981]/10 transition-all duration-300 hover:scale-105 ${className}`}
      aria-label={label}
    >
      <span className="text-xs font-mono text-[#b9cacb] hover:text-[#10b981] uppercase tracking-wider">
        {label}
      </span>
    </a>
  );
}