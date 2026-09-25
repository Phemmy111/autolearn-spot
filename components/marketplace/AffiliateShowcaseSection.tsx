import Link from 'next/link';
import { ArrowRight, Sparkles, Compass, Link2, Wallet, Users, CheckCircle2 } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase';
import { DynamicSlider } from '@/components/ui/DynamicSlider';

const AFFILIATE_HIGHLIGHTS = [
  {
    targetId: 'affiliate:pick_course',
    step: 'Step 01',
    icon: Compass,
    title: 'Pick Any Course to Promote',
    description: 'Explore the Affiliate Marketplace and choose from high-demand AI, Tech, and Marketing courses with transparent author-set commission rates.',
    gradient: 'from-emerald-600/30 via-teal-900/40 to-slate-950/80',
    accentColor: 'text-emerald-500',
  },
  {
    targetId: 'affiliate:share_link',
    step: 'Step 02',
    icon: Link2,
    title: 'Generate & Share Unique Links',
    description: 'Generate your personal referral link in one click. 30-day cookie tracking ensures you get full credit for every student enrollment.',
    gradient: 'from-cyan-600/30 via-blue-900/40 to-slate-950/80',
    accentColor: 'text-cyan-400',
  },
  {
    targetId: 'affiliate:earn_payout',
    step: 'Step 03',
    icon: Wallet,
    title: 'Earn 10%–70% Direct Payouts',
    description: 'Commissions are automatically credited to your Partner Wallet on confirmed purchases, with fast and reliable weekly withdrawals.',
    gradient: 'from-purple-600/30 via-indigo-900/40 to-slate-950/80',
    accentColor: 'text-purple-400',
  },
];

export async function AffiliateShowcaseSection() {
  const targetIds = AFFILIATE_HIGHLIGHTS.map(h => h.targetId);

  // Fetch slider configs from database
  const { data: sliderConfigs } = await supabaseAdmin
    .from('page_sliders')
    .select('*, slider_media(*)')
    .in('target_id', targetIds);

  const sliderMediaMap = new Map();
  (sliderConfigs || []).forEach(slider => {
    if (slider.slider_media && slider.slider_media.length > 0) {
      const sortedMedia = slider.slider_media.sort((a: any, b: any) => a.order_index - b.order_index);
      sliderMediaMap.set(slider.target_id, {
        media: sortedMedia,
        transitionStyle: slider.transition_style,
        durationMs: slider.duration_ms,
      });
    }
  });

  return (
    <section className="py-16 md:py-24 bg-brand-bg border-t border-brand-border/50 relative overflow-hidden">
      {/* Background ambient decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-brand-primary/5 blur-[140px] rounded-full pointer-events-none" />

      <div className="container relative z-10 mx-auto px-6 lg:px-8 max-w-7xl">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wider mb-4 border border-brand-primary/20 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Affiliate Partner Program
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-extrabold text-brand-text tracking-tight mb-4">
              Turn Your Audience <span className="text-brand-primary">Into Income.</span>
            </h2>
            <p className="text-base sm:text-lg text-brand-text/70 leading-relaxed">
              Recommend world-class tech and AI courses to your audience. Earn custom commissions from <strong className="text-brand-text">10% up to 70%</strong> on every sale.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/partners/apply"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-primary text-white font-bold rounded-full hover:bg-brand-primary-hover transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 text-sm"
            >
              Become an Affiliate Partner
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/partners"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-brand-primary text-brand-primary font-bold rounded-full hover:bg-brand-primary/5 transition-all duration-300 text-sm"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* 3 Highlight Cards Grid with Media/Video Slider Backgrounds */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {AFFILIATE_HIGHLIGHTS.map((card) => {
            const Icon = card.icon;
            const sliderConfig = sliderMediaMap.get(card.targetId);

            return (
              <div
                key={card.targetId}
                className="group flex flex-col bg-[var(--card)] rounded-[28px] overflow-hidden border border-brand-border/60 hover:border-brand-primary/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5"
              >
                {/* Media Container */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-900">
                  {sliderConfig ? (
                    <DynamicSlider
                      media={sliderConfig.media}
                      transitionStyle={sliderConfig.transitionStyle}
                      durationMs={sliderConfig.durationMs}
                      className="w-full h-full object-cover"
                      autoPlay={true}
                      showIndicators={false}
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`}>
                      <div className="absolute inset-0 bg-brand-bg/10 backdrop-blur-[2px] mix-blend-overlay" />
                      {/* Decorative glowing spheres */}
                      <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors duration-500" />
                      <div className="absolute -left-6 -bottom-6 w-36 h-36 bg-brand-primary/20 rounded-full blur-3xl group-hover:bg-brand-primary/30 transition-colors duration-500" />
                    </div>
                  )}

                  {/* Dark overlay for crystal clear contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/20 to-transparent pointer-events-none" />

                  {/* Step Badge & Floating Icon */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-black/50 text-white backdrop-blur-md border border-white/20">
                      {card.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/15 backdrop-blur-md text-white border border-white/20 shadow-md">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-heading font-bold text-brand-text mb-2.5 group-hover:text-brand-primary transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-brand-text/70 leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  <div className="pt-5 mt-4 border-t border-brand-border/60 flex items-center justify-between text-xs font-bold text-brand-primary">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-brand-primary" />
                      Verified Feature
                    </span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
