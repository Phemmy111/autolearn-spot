"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, TrendingUp, Users, DollarSign, Star } from "lucide-react";
import { Navbar } from "@/components/navbar";

export default function AmbassadorLandingPage() {
  return (
    <div className="min-h-screen bg-[#0c0e12] text-white">
      <Navbar />
      
      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[#00f0ff] mb-8 animate-fade-in">
            <Star className="h-4 w-4" />
            <span className="text-sm font-medium">AutoLearn Spot Ambassador Program</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
            Share knowledge.<br />
            <span className="text-[#00f0ff]">Earn rewards.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-[#b9cacb] max-w-2xl mb-10 leading-relaxed">
            Join the AutoLearn Spot Community Ambassador program. Earn ₦1,000 for every student you refer who completes their enrollment. No limits, no caps.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/ambassador/apply" 
              className="px-8 py-4 rounded-full bg-[#00f0ff] text-black font-bold text-lg hover:bg-white transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Apply Now <ArrowRight className="h-5 w-5" />
            </Link>
            <Link 
              href="/ambassador/login" 
              className="px-8 py-4 rounded-full bg-white/5 border border-white/10 font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center"
            >
              Partner Login
            </Link>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="px-6 lg:px-8 max-w-7xl mx-auto mt-32">
          <h2 className="text-3xl font-bold text-center mb-16">Why become an Ambassador?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-[#00f0ff]/50 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f0ff]/10 blur-3xl rounded-full -mr-16 -mt-16 transition-all group-hover:bg-[#00f0ff]/20" />
              <DollarSign className="h-10 w-10 text-[#00f0ff] mb-6" />
              <h3 className="text-xl font-bold mb-4">Earn ₦1,000 per referral</h3>
              <p className="text-[#b9cacb] leading-relaxed">Get paid directly to your bank account for every verified student enrollment you bring to the platform.</p>
            </div>
            
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-[#00f0ff]/50 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full -mr-16 -mt-16 transition-all group-hover:bg-purple-500/20" />
              <TrendingUp className="h-10 w-10 text-purple-400 mb-6" />
              <h3 className="text-xl font-bold mb-4">Real-time Tracking</h3>
              <p className="text-[#b9cacb] leading-relaxed">Monitor your clicks, registrations, and earnings in real-time through your dedicated ambassador dashboard.</p>
            </div>
            
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-[#00f0ff]/50 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl rounded-full -mr-16 -mt-16 transition-all group-hover:bg-green-500/20" />
              <Users className="h-10 w-10 text-green-400 mb-6" />
              <h3 className="text-xl font-bold mb-4">Impact Lives</h3>
              <p className="text-[#b9cacb] leading-relaxed">Help others discover high-quality tech education and start their journey into the tech industry.</p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 lg:px-8 max-w-7xl mx-auto mt-32">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-white/5 to-[#00f0ff]/5 border border-white/10">
            <h2 className="text-3xl font-bold mb-12 text-center">How it works</h2>
            
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center relative">
                <div className="w-16 h-16 rounded-full bg-[#00f0ff]/20 text-[#00f0ff] flex items-center justify-center text-2xl font-bold mx-auto mb-6">1</div>
                <h4 className="font-bold mb-2">Apply</h4>
                <p className="text-sm text-[#b9cacb]">Submit your simple application to join</p>
                <div className="hidden md:block absolute top-8 left-[60%] w-full h-[2px] bg-gradient-to-r from-[#00f0ff]/50 to-transparent" />
              </div>
              
              <div className="text-center relative">
                <div className="w-16 h-16 rounded-full bg-[#00f0ff]/20 text-[#00f0ff] flex items-center justify-center text-2xl font-bold mx-auto mb-6">2</div>
                <h4 className="font-bold mb-2">Get Approved</h4>
                <p className="text-sm text-[#b9cacb]">Receive your unique referral link</p>
                <div className="hidden md:block absolute top-8 left-[60%] w-full h-[2px] bg-gradient-to-r from-[#00f0ff]/50 to-transparent" />
              </div>
              
              <div className="text-center relative">
                <div className="w-16 h-16 rounded-full bg-[#00f0ff]/20 text-[#00f0ff] flex items-center justify-center text-2xl font-bold mx-auto mb-6">3</div>
                <h4 className="font-bold mb-2">Share</h4>
                <p className="text-sm text-[#b9cacb]">Share your link with your network</p>
                <div className="hidden md:block absolute top-8 left-[60%] w-full h-[2px] bg-gradient-to-r from-[#00f0ff]/50 to-transparent" />
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#00f0ff]/20 text-[#00f0ff] flex items-center justify-center text-2xl font-bold mx-auto mb-6">4</div>
                <h4 className="font-bold mb-2">Earn</h4>
                <p className="text-sm text-[#b9cacb]">Get ₦1,000 for every enrollment</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
