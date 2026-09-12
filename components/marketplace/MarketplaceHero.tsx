import Link from 'next/link';
import { Sparkles, ArrowRight, Play, Code, Megaphone, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export function MarketplaceHero() {
  return (
    <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden bg-[#d1d5db]">
      {/* Background radial gradient */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#edf0f4] via-[#e5e9ed] to-[#dce1e7]" />
      
      {/* Accent glows */}
      <div className="absolute top-20 left-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-teal-100/30 blur-[120px] rounded-full pointer-events-none mix-blend-multiply" />

      <div className="container relative z-10 mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Content */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold mb-8 border border-emerald-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Sparkles className="w-4 h-4" />
              Learn Without Limits
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-[72px] font-heading font-extrabold text-neutral-900 tracking-tight mb-6 leading-[1.05]">
              <span className="inline-block animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">Discover Your</span>{' '}
              <span className="inline-block animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">Next Skill.</span>{' '}
              <span className="inline-block animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-both text-[#10b981]">Learn</span>{' '}
              <span className="inline-block animate-in fade-in slide-in-from-bottom-8 duration-700 delay-600 fill-mode-both text-[#10b981]">and</span>{' '}
              <span className="inline-block animate-in fade-in slide-in-from-bottom-8 duration-700 delay-700 fill-mode-both text-[#10b981]">Grow.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-neutral-600 mb-10 max-w-xl leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500 fill-mode-both">
              Elevate your career with premium courses, curated digital products, and communities led by industry experts.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 mb-12 animate-in fade-in zoom-in-95 duration-700 delay-700 fill-mode-both">
              <Link 
                href="#products" 
                className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-[#10b981] text-neutral-900 font-semibold rounded-full hover:bg-[#059669] transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)] hover:shadow-[0_12px_24px_-8px_rgba(16,185,129,0.6)] hover:-translate-y-0.5"
              >
                Explore Marketplace
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/author-apply"
                className="w-full sm:w-auto px-8 py-4 bg-white border border-neutral-300 text-neutral-700 font-semibold rounded-full hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 shadow-sm"
              >
                Become a Creator
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-900 fill-mode-both">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[#e5e9ed] bg-neutral-300 overflow-hidden relative">
                    <Image 
                      src={`https://i.pravatar.cc/100?img=${i + 10}`} 
                      alt="Student" 
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-[#e5e9ed] bg-neutral-200 text-neutral-600 text-xs font-bold flex items-center justify-center relative z-10">
                  +
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-neutral-900">Join 50,000+ learners</span>
                <span className="text-xs font-medium text-neutral-500">Building better futures together</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visuals */}
          <div className="relative h-[500px] lg:h-[650px] w-full hidden md:block animate-in fade-in zoom-in-95 duration-1000 delay-300 fill-mode-both">
            {/* Main Image Mask/Container */}
            <div className="absolute right-0 bottom-0 w-[90%] h-[95%] bg-neutral-300 rounded-[40px] overflow-hidden shadow-2xl">
               <Image
                 src="https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2069&auto=format&fit=crop"
                 alt="Student learning"
                 fill
                 className="object-cover object-top"
                 priority
               />
            </div>

            {/* Floating Card 1: AI Automation */}
            <div className="absolute top-[10%] left-0 bg-white/90 backdrop-blur-md p-3 pr-6 rounded-2xl shadow-xl flex items-center gap-4 hover:-translate-y-1 transition-transform cursor-default">
              <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center shadow-inner">
                <Play className="w-5 h-5 text-neutral-900 ml-0.5" fill="currentColor" />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900 leading-tight">AI Automation</p>
                <p className="text-xs text-neutral-500 font-medium">Beginner • 4.8 ★</p>
              </div>
            </div>

            {/* Floating Card 2: Web Dev */}
            <div className="absolute top-[35%] -right-4 bg-white/90 backdrop-blur-md p-3 pr-6 rounded-2xl shadow-xl flex items-center gap-4 hover:-translate-y-1 transition-transform cursor-default z-20">
              <div className="w-12 h-12 bg-[#314a7e] rounded-xl flex items-center justify-center shadow-inner">
                <Code className="w-5 h-5 text-neutral-900" />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900 leading-tight">Web Development</p>
                <p className="text-xs text-neutral-500 font-medium">Intermediate • 4.9 ★</p>
              </div>
            </div>

            {/* Floating Card 3: Digital Marketing */}
            <div className="absolute bottom-[25%] -left-8 bg-white/90 backdrop-blur-md p-3 pr-6 rounded-2xl shadow-xl flex items-center gap-4 hover:-translate-y-1 transition-transform cursor-default z-20">
              <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-inner">
                <Megaphone className="w-5 h-5 text-neutral-900" />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900 leading-tight">Digital Marketing</p>
                <p className="text-xs text-neutral-500 font-medium">Beginner • 4.7 ★</p>
              </div>
            </div>

            {/* Floating Card 4: Progress */}
            <div className="absolute bottom-[10%] -right-8 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl w-48 hover:-translate-y-1 transition-transform cursor-default z-20">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-neutral-900">Your Progress</span>
                <span className="text-xs font-bold text-neutral-500">68%</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div className="bg-[#10b981] h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>
            </div>

            {/* Hand-drawn text element */}
            <div className="absolute top-[15%] right-[5%] -rotate-6 z-20 hidden lg:block">
              <p className="font-serif italic text-xl text-neutral-600">
                Better Skills<br/>Bigger Opportunities
              </p>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="absolute -bottom-6 -right-2 text-neutral-400 -rotate-45" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 9c2.5-3 7-3 9 0s2 7 6 7"/>
                <path d="M16 16l4 0l0-4"/>
              </svg>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
}
