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
      className={`flex items-center justify-center w-28 h-10 border border-brand-border bg-brand-bg rounded-lg hover:border-[#10b981] hover:bg-brand-bg/10 transition-all duration-300 hover:scale-105 ${className}`}
      aria-label={label}
    >
      <span className="text-xs font-mono text-brand-text/60 hover:text-[#10b981] uppercase tracking-wider">
        {label}
      </span>
    </a>
  );
}
