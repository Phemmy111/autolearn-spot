import Link from 'next/link';

export function MarketplaceHero() {
  return (
    <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 [background-image:linear-gradient(var(--color-brand-primary)_1px,transparent_1px),linear-gradient(90deg,var(--color-brand-primary)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_20%,transparent_100%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-medium mb-8 border border-brand-primary/20">
          <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
          The Premier Digital Skills Marketplace
        </div>
        
        <h1 className="text-4xl md:text-6xl font-heading font-extrabold text-foreground tracking-tight mb-6 leading-tight">
          Discover Your Next Skill.<br/>
          <span className="text-brand-primary">Browse, Learn, and Grow.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Explore a wide range of courses and upskill your career. Join communities, get the best digital products, and learn from top creators all in one place.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="#products" 
            className="w-full sm:w-auto px-8 py-3.5 bg-brand-primary text-primary-foreground font-semibold rounded-xl hover:bg-brand-primary-hover transition-all shadow-[0_0_20px_rgba(var(--color-brand-primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--color-brand-primary),0.5)]"
          >
            Explore Courses
          </Link>
          <Link 
            href="/authors/apply" 
            className="w-full sm:w-auto px-8 py-3.5 bg-card border border-border text-foreground font-semibold rounded-xl hover:border-brand-primary/50 transition-colors"
          >
            Become a Creator
          </Link>
        </div>
      </div>
    </section>
  );
}
