import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

export function MarketplaceHero() {
  return (
    <section className="relative pt-24 pb-20 md:pt-36 md:pb-32 overflow-hidden bg-background border-b border-border">
      {/* Subtle Premium Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/5 text-brand-primary text-xs font-semibold uppercase tracking-wider mb-8 border border-brand-primary/10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Sparkles className="w-3.5 h-3.5" />
          The Premier Learning Destination
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-extrabold text-foreground tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-both">
          Discover Your Next Skill.<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-blue-600">
            Learn and Grow.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 fill-mode-both">
          Elevate your career with premium courses, curated digital products, and communities led by industry experts.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in zoom-in-95 duration-700 delay-500 fill-mode-both">
          <Link 
            href="#products" 
            className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-brand-primary text-primary-foreground font-semibold rounded-full hover:bg-brand-primary-hover transition-all duration-300 shadow-[0_4px_14px_0_rgba(var(--color-brand-primary),0.39)] hover:shadow-[0_6px_20px_rgba(var(--color-brand-primary),0.23)] hover:-translate-y-0.5"
          >
            Explore Marketplace
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/author/apply"
            className="w-full sm:w-auto px-8 py-4 bg-transparent border border-border text-foreground font-medium rounded-full hover:bg-muted/50 transition-colors duration-300"
          >
            Become a Creator
          </Link>
        </div>
      </div>
    </section>
  );
}
