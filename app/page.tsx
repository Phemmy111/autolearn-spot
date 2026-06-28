'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useState, useEffect, useRef } from 'react'

// Workflow Animation Canvas Component
const WorkflowCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let packets: { x: number, y: number, progress: number, pathIndex: number }[] = [];

    // Define workflow nodes
    const nodes = [
      { id: 0, x: 100, y: 200, label: 'Trigger', color: '#10b981', icon: '⚡' },
      { id: 1, x: 300, y: 200, label: 'AI Agent', color: '#818cf8', icon: '🧠' },
      { id: 2, x: 500, y: 100, label: 'Gmail', color: '#f87171', icon: '📧' },
      { id: 3, x: 500, y: 300, label: 'Sheets', color: '#34d399', icon: '📊' },
    ];

    // Define connections (paths)
    const paths = [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 1, to: 3 },
    ];

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 450;
    };
    
    // Add packets periodically (workflow execution)
    const packetInterval = setInterval(() => {
      // Start a packet from Webhook to AI Agent
      packets.push({ x: 0, y: 0, progress: 0, pathIndex: 0 });
    }, 1200);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate scale to center the workflow layout
      const scaleX = canvas.width / 600;
      const scaleY = canvas.height / 400;
      const scale = Math.min(scaleX, scaleY) * 0.8;
      const offsetX = (canvas.width - (600 * scale)) / 2;
      const offsetY = (canvas.height - (400 * scale)) / 2;

      const getScaledPos = (nx: number, ny: number) => {
        return { x: nx * scale + offsetX, y: ny * scale + offsetY };
      }

      // 1. Draw paths
      paths.forEach(path => {
        const p1 = getScaledPos(nodes[path.from].x, nodes[path.from].y);
        const p2 = getScaledPos(nodes[path.to].x, nodes[path.to].y);
        
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2 * scale;
        ctx.setLineDash([5 * scale, 5 * scale]);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 2. Update and draw packets (data moving along paths)
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.progress += 0.015; // Animation speed
        
        if (p.progress >= 1) {
          // If it reached the AI node, split into two tasks (Gmail & Sheets)
          if (p.pathIndex === 0) {
            packets.push({ x: 0, y: 0, progress: 0, pathIndex: 1 });
            packets.push({ x: 0, y: 0, progress: 0, pathIndex: 2 });
          }
          packets.splice(i, 1);
          continue;
        }

        const path = paths[p.pathIndex];
        const p1 = getScaledPos(nodes[path.from].x, nodes[path.from].y);
        const p2 = getScaledPos(nodes[path.to].x, nodes[path.to].y);
        
        const cx = p1.x + (p2.x - p1.x) * p.progress;
        const cy = p1.y + (p2.y - p1.y) * p.progress;

        // Glowing packet dot
        ctx.beginPath();
        ctx.arc(cx, cy, 6 * scale, 0, Math.PI * 2);
        ctx.fillStyle = nodes[path.to].color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = nodes[path.to].color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 3. Draw nodes on top
      nodes.forEach(node => {
        const pos = getScaledPos(node.x, node.y);
        
        // Node background
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 35 * scale, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b'; // slate-800
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 3 * scale;
        ctx.fill();
        ctx.stroke();

        // Node Icon (Text)
        ctx.fillStyle = 'white';
        ctx.font = `${20 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.icon, pos.x, pos.y - 5 * scale);

        // Node Label
        ctx.fillStyle = '#94a3b8'; // slate-400
        ctx.font = `bold ${11 * scale}px Inter, sans-serif`;
        ctx.fillText(node.label, pos.x, pos.y + 18 * scale);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      clearInterval(packetInterval);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[450px] bg-[#0f172a] rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200/50 flex items-center justify-center border-4 border-white ring-1 ring-slate-100">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      
      {/* Editor UI Accents */}
      <div className="absolute top-6 left-6 bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-700 p-3 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
        </div>
        <span className="text-xs font-mono text-slate-300">live_workflow.n8n</span>
      </div>

      <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-3 flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        <span className="text-xs font-semibold text-white tracking-wide">Executing</span>
      </div>
    </div>
  );
};

export default function Page() {
  const [activeWorkflow, setActiveWorkflow] = useState(0)
  const [showRegModal, setShowRegModal] = useState(false)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showBanner, setShowBanner] = useState(true)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [regData, setRegData] = useState({ name: '', email: '', phone: '', referral: '' })
  const [regLoading, setRegLoading] = useState(false)

  // Auto-fill referral code from URL query parameter if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const ref = params.get('ref')
      if (ref) {
        setRegData(prev => ({ ...prev, referral: ref }))
      }
    }
  }, [])
  const [regSuccess, setRegSuccess] = useState(false)
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const [hasScrolledPlayed, setHasScrolledPlayed] = useState(false);
  const adVideoRef = useRef<HTMLVideoElement>(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const totalSlides = 4;

  const nextSlide = () => setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));

  useEffect(() => {
    const slideInterval = setInterval(nextSlide, 4000);
    return () => clearInterval(slideInterval);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    
    // Countdown Timer Logic
    const deadline = new Date('July 13, 2026 23:59:59').getTime()
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = deadline - now
      if (distance < 0) {
        clearInterval(timer)
        return
      }
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      })
    }, 1000)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearInterval(timer)
    }
  }, [])

// Auto‑play video (once) when it first scrolls into view (unmuted) and pause when out of view.
useEffect(() => {
  const handleVisibility = () => {
    const video = adVideoRef.current;
    if (!video) return;
    const rect = video.getBoundingClientRect();
    const inView = rect.bottom > 0 && rect.top < window.innerHeight;

    if (inView) {
      if (video.paused) {
        video.play()
          .then(() => {
            video.muted = false;
            setIsMuted(false);
          })
          .catch(() => {});
      }
    } else {
      // Pause whenever the video leaves the viewport
      if (!video.paused) {
        video.pause();
      }
    }
  };
  window.addEventListener('scroll', handleVisibility);
  // Initial check in case already in view
  handleVisibility();
  return () => window.removeEventListener('scroll', handleVisibility);
}, []);

  const webhookUrl = 'https://n8n-wj6g.onrender.com/webhook/6f985fb5-f10a-4ad3-99c0-d58d70f86408'
  const paystackLink = 'https://paystack.shop/pay/yoksvlq4xn'
  const whatsappNumber = '2348120934828'
  const whatsappCommunity = 'https://chat.whatsapp.com/FqgDAgL34Wq6tyPkT3nZ20'
  const programPrice = '₦3,000'

  const messages = [
    { icon: '💬', text: 'I want to register', msg: 'Hi Femi! I am interested in AutoLearn Spot. How do I register?' },
    { icon: '📅', text: 'When does it start?', msg: 'Hi Femi! When does the next AutoLearn Spot cohort begin?' },
    { icon: '🤔', text: 'I have a question', msg: 'Hi Femi! I have a question about AutoLearn Spot.' },
    { icon: '💰', text: 'Payment help', msg: 'Hi Femi! I need help completing my payment for AutoLearn Spot.' },
    { icon: '🚀', text: 'I want to be an ambassador', msg: 'Hi Femi! I am interested in becoming an ambassador for AutoLearn Spot.' },
  ]

  const handleSubmitReg = async () => {
    if (!regData.name.trim()) { alert('Please enter your full name.'); return }
    if (!regData.email.trim() || !regData.email.includes('@')) { alert('Please enter a valid email.'); return }
    if (!regData.phone.trim()) { alert('Please enter your phone number.'); return }

    setRegLoading(true)
    const payload = { 'Full Name': regData.name, Email1: regData.email, Phone: regData.phone, ReferralCode: regData.referral }
    try {
      await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), mode: 'no-cors' })
      setRegSuccess(true)
      
      const metadata = {
        referralCode: regData.referral || "",
        fullName: regData.name,
        phone: regData.phone
      }
      const dynamicPaystackLink = `${paystackLink}?email=${encodeURIComponent(regData.email)}&metadata=${encodeURIComponent(JSON.stringify(metadata))}`
      
      setTimeout(() => { window.location.href = dynamicPaystackLink }, 1800)
    } catch (error) {
      console.error('Webhook error:', error)
      setRegSuccess(true)
      
      const metadata = {
        referralCode: regData.referral || "",
        fullName: regData.name,
        phone: regData.phone
      }
      const dynamicPaystackLink = `${paystackLink}?email=${encodeURIComponent(regData.email)}&metadata=${encodeURIComponent(JSON.stringify(metadata))}`
      
      setTimeout(() => { window.location.href = dynamicPaystackLink }, 1800)
    }
  }

  const sendWhatsApp = (message: string) => {
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank')
    setShowWhatsAppModal(false)
  }

  const joinCommunity = () => { window.open(whatsappCommunity, '_blank'); setShowWhatsAppModal(false) }

  const closeRegModal = () => {
    if (!regSuccess) { setShowRegModal(false); setRegData({ name: '', email: '', phone: '', referral: '' }) }
  }

  const workflows = [
    { title: 'Email Responder', src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_2026-06-24-16-42-55-750_com.playit.videoplayer-NeXBGsSEq0TAhzDebstVdH4ojDWudU.jpg' },
    { title: 'Form Submission', src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_2026-06-24-16-41-59-581_com.playit.videoplayer-wKF8HBnGTjyg5jtgwF4Dm5ZuLBv0Zq.jpg' },
    { title: 'Email Responder (Advanced)', src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_2026-06-24-16-42-32-051_com.playit.videoplayer-RaIbheFNV5m53K4ycv0bOryZRlrgXF.jpg' },
    { title: 'AutoLearn Day 4', src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_2026-06-24-16-43-28-995_com.playit.videoplayer-Wx9wfXXNVy7rJaPLARxfntNz6gveOw.jpg' },
    { title: 'AutoLearn Day 3', src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_2026-06-24-16-43-55-665_com.playit.videoplayer-kOfEbpPWhJUn7nO40BFoTsUGu6A0sZ.jpg' },
  ]

  useEffect(() => {
    const interval = setInterval(() => setActiveWorkflow((prev) => (prev + 1) % workflows.length), 5000)
    return () => clearInterval(interval)
  }, [])

  const stats = [
    { value: '10+', label: 'Real workflows deployed' },
    { value: '12', label: 'Live hands-on sessions' },
    { value: '4 weeks', label: 'Program duration' },
    { value: '100%', label: 'Practical, no fluff' },
  ]

  return (
    <main className="bg-[#f9fafb] text-slate-900 font-sans">

      {/* ── ANNOUNCEMENT BANNER ── */}
      {showBanner && (
        <div className="bg-slate-900 text-slate-200 text-xs sm:text-sm font-semibold text-center py-2.5 px-4 flex items-center justify-center gap-3 relative z-[60]">
          <span>🚀 Training begins July 13th. Only <strong className="text-emerald-400">15 seats</strong> available!</span>
          <button onClick={() => setShowBanner(false)} className="absolute right-4 text-slate-400 hover:text-white" aria-label="Close banner">✕</button>
        </div>
      )}

      {/* ── NAVIGATION ── */}
      <nav className={`sticky top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-white border-b border-transparent'}`}>
        <div className="mx-auto max-w-7xl px-6 py-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/autolearn-brandmark.png" alt="AutoLearn Spot Logo" width={32} height={32} className="rounded-lg shadow-sm" />
            <span className="text-lg font-bold text-slate-900 tracking-tight">AutoLearn <span className="text-emerald-500">Spot</span></span>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <Button
              className="bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-full px-6 shadow-md shadow-emerald-200 hover:shadow-emerald-300 transition-all hover:scale-[1.02]"
              onClick={() => setShowRegModal(true)}
            >
              Enroll Now — {programPrice}
            </Button>
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-slate-600 hover:text-emerald-500 transition-colors bg-white rounded-full shadow-sm border border-slate-100"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Hamburger Dropdown Menu */}
        {showMobileMenu && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-xl py-4 px-6 flex flex-col gap-4 animate-in slide-in-from-top-2">
            {['Curriculum', 'Tools', 'Instructor', 'FAQ'].map((item) => (
              <a 
                key={item}
                href={`#${item.toLowerCase()}`} 
                onClick={() => setShowMobileMenu(false)}
                className="text-base font-bold text-slate-600 hover:text-emerald-500 transition-colors py-2 border-b border-slate-50 last:border-0"
              >
                {item}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-emerald-100/50 via-teal-50/40 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/40 to-cyan-100/30 rounded-full blur-2xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6 sm:px-8">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            {/* Left */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">🎓 Next Cohort Open</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.05] tracking-tight mb-6">
                Build Real AI<br />
                Automations.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Get Certified.</span>
              </h1>

              <p className="text-lg text-slate-500 leading-relaxed mb-8">
                A 4-week, hands-on n8n automation training. No theory overload — every session ends with a working, deployable workflow you built yourself.
              </p>

              {/* Countdown Timer */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 bg-white/50 backdrop-blur-sm border border-slate-200 p-3 rounded-2xl w-fit">
                <div className="flex items-center gap-2">
                  {[
                    { label: 'DAYS', value: timeLeft.days },
                    { label: 'HOURS', value: timeLeft.hours },
                    { label: 'MINS', value: timeLeft.minutes },
                    { label: 'SECS', value: timeLeft.seconds }
                  ].map((unit, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-slate-900 shadow-sm rounded-lg flex items-center justify-center text-xl font-bold text-white tracking-wider">
                        {unit.value.toString().padStart(2, '0')}
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 mt-1.5 uppercase tracking-wider">{unit.label}</span>
                    </div>
                  ))}
                </div>
                <div className="hidden sm:block w-px h-10 bg-slate-200"></div>
                <div className="text-sm font-semibold text-slate-600 max-w-[140px] leading-snug">
                  Until registration <span className="text-red-500 font-bold">closes</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-full px-8 h-14 text-base font-semibold shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all hover:scale-[1.02]"
                  onClick={() => setShowRegModal(true)}
                >
                  Start Learning — {programPrice} →
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-full px-8 h-14 text-base font-medium transition-all"
                  onClick={() => document.getElementById('curriculum')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  View Curriculum
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['🧑‍💻', '👩‍💼', '👨‍🎓', '👩‍🔬'].map((e, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 border-2 border-white flex items-center justify-center text-sm shadow-sm">{e}</div>
                  ))}
                </div>
                <p className="text-sm text-slate-500"><span className="font-semibold text-slate-800">Designed for beginners</span> and professionals</p>
              </div>
            </div>

            {/* Right — Interactive Workflow Execution Canvas */}
            <div className="relative">
              <WorkflowCanvas />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-white border-y border-slate-100 py-10">
        <div className="mx-auto max-w-5xl px-6 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s, i) => (
              <div key={i}>
                <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">{s.value}</div>
                <div className="text-sm text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4-WEEK CURRICULUM ── */}
      <section id="curriculum" className="py-24 bg-slate-50 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-4">4-Week Curriculum</span>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">What You&apos;ll Build</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Every session is 100% practical. You leave with a working workflow, not just notes.</p>
          </div>

          {/* Heavy, Detailed Bento-grid weeks */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { week: 'Week 1', gradient: 'from-emerald-400 to-teal-500', title: 'n8n Fundamentals', subtitle: 'Build your first workflow from scratch', icon: '🏗️', sessions: ['Theory + Account Setup', 'Form → Email Automation', 'Add Google Sheets'] },
              { week: 'Week 2', gradient: 'from-violet-400 to-purple-500', title: 'AI-Powered Workflows', subtitle: 'Connect ChatGPT to your automations', icon: '🤖', sessions: ['AI Telegram Bot', 'AI Email Auto-Responder', 'AI Content Summarizer'] },
              { week: 'Week 3', gradient: 'from-blue-400 to-cyan-500', title: 'Deploy & Scale', subtitle: 'Take your workflows live on Railway', icon: '🚀', sessions: ['Deploy n8n on Railway', 'AI Customer Support Bot', 'Lead Capture + AI Qualifier'] },
              { week: 'Week 4', gradient: 'from-emerald-400 to-green-500', title: 'Capstone Project', subtitle: 'Build a full product & get certified', icon: '🎓', sessions: ['Social Media Content Bot', 'Capstone Build Day', 'Presentation + Certificate'] },
            ].map((week, i) => (
              <div 
                key={i} 
                className={`bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col relative transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-2xl group`}
              >
                {/* Colorful top bar */}
                <div className={`h-2 w-full bg-gradient-to-r ${week.gradient}`}></div>
                
                <div className="p-8 flex-1">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-6 bg-slate-50 border border-slate-100 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    {week.icon}
                  </div>
                  <span className={`text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2 block`}>{week.week}</span>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{week.title}</h3>
                  <p className="text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">{week.subtitle}</p>
                  
                  <div className="space-y-4">
                    {week.sessions.map((s, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <span className="text-emerald-500 text-lg leading-none mt-0.5">✓</span>
                        <span className="text-sm text-slate-700 font-medium leading-snug">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-5 mt-10">
            {[
              { icon: '📅', label: 'Schedule', value: 'Mon, Wed, Fri — 30 mins each session' },
              { icon: '🏆', label: 'Certificate', value: 'Issued by Moon Space Network on completion' },
              { icon: '💳', label: 'Investment', value: `${programPrice} — Full access, all 12 sessions` },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-3xl flex-shrink-0">{item.icon}</span>
                <div>
                  <div className="text-sm font-bold text-slate-900">{item.label}</div>
                  <div className="text-sm text-slate-500 mt-1">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOOLS ── */}
      <section id="tools" className="py-24 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Tools You&apos;ll Master</h2>
            <p className="text-slate-500 max-w-xl mx-auto">From triggering workflows to deploying production bots — you&apos;ll use the same tools professionals use every day.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: 'n8n', desc: 'Workflow engine', icon: '/icons/brands/n8n.svg', bg: 'bg-emerald-50 border-emerald-100' },
              { name: 'ChatGPT', desc: 'AI integration', icon: '/icons/brands/openai.svg', bg: 'bg-green-50 border-green-100' },
              { name: 'Gmail', desc: 'Email automation', icon: '/icons/brands/gmail.svg', bg: 'bg-red-50 border-red-100' },
              { name: 'Telegram', desc: 'Bot creation', icon: '/icons/brands/telegram.svg', bg: 'bg-blue-50 border-blue-100' },
              { name: 'Google Sheets', desc: 'Data pipelines', icon: '/icons/brands/googlesheets.svg', bg: 'bg-emerald-50 border-emerald-100' },
              { name: 'WhatsApp', desc: 'Messaging bots', icon: '/icons/brands/whatsapp.svg', bg: 'bg-green-50 border-green-100' },
              { name: 'Railway', desc: 'Live deployment', icon: '/icons/brands/railway.svg', bg: 'bg-violet-50 border-violet-100' },
              { name: 'Supabase', desc: 'Database & auth', icon: '/icons/brands/supabase.svg', bg: 'bg-teal-50 border-teal-100' },
            ].map((tool, i) => (
              <div key={i} className={`${tool.bg} border rounded-2xl p-5 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-lg transition-all duration-300 cursor-default group`}>
                <div className="w-10 h-10 mb-3 flex items-center justify-center text-slate-800 dark:text-slate-100 group-hover:scale-110 transition-transform">
                  <img src={tool.icon} alt={tool.name} className="w-8 h-8 object-contain filter grayscale opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-sm font-bold text-slate-900">{tool.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{tool.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

        {/* ── AD VIDEO — PROMO ── */}
        <section id="ad-video" className="relative py-12 bg-white/80 backdrop-blur-md border-t border-slate-100">
          <div className="mx-auto max-w-5xl px-6 sm:px-8">
            <div className="relative overflow-hidden rounded-2xl shadow-lg border border-slate-200">
              {/* Video element with ref for controls */}
              <video
                ref={adVideoRef}
                src="/videos/ad.mp4"
                className="w-full h-auto object-cover"
                loop
                playsInline
                preload="auto"
                muted
                onClick={() => {
                  const vid = adVideoRef.current;
                  if (!vid) return;
                  if (vid.paused) {
                    vid.play();
                  } else {
                    vid.pause();
                  }
                }}
              />
              {/* Small mute toggle button at top‑right */}
              <button
                type="button"
                className="absolute top-2 right-2 flex items-center justify-center bg-black/30 hover:bg-black/40 p-2 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  const video = adVideoRef.current;
                  if (video) {
                    video.muted = !video.muted;
                    setIsMuted(!video.muted);
                  }
                }}
                aria-label="Toggle mute"
              >
                {isMuted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 010 14.14" /><path d="M15.54 8.46a5 5 0 010 7.07" /></svg>
                )}
              </button>
            </div>
          </div>
        </section>



      {/* ── WHY AUTOLEARN ── */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Why AutoLearn Spot?</h2>
            <p className="text-slate-500 max-w-xl mx-auto">We built the training we wished existed — practical, beginner-friendly, and outcome-focused.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-12 h-12" fill="none">
                    <circle cx="24" cy="24" r="22" fill="#ecfdf5" stroke="#10b981" strokeWidth="2"/>
                    <path d="M14 26l6 6 14-14" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
               ), title: '100% Practical', desc: 'No slides and lectures. Every session = a live workflow you built and deployed.', bg: 'bg-white', size: 'lg:col-span-1' },
              { icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-12 h-12" fill="none">
                    <circle cx="24" cy="24" r="22" fill="#ede9fe" stroke="#8b5cf6" strokeWidth="2"/>
                    <rect x="16" y="16" width="7" height="7" rx="2" fill="#8b5cf6"/>
                    <rect x="25" y="16" width="7" height="7" rx="2" fill="#8b5cf6" opacity="0.5"/>
                    <rect x="16" y="25" width="7" height="7" rx="2" fill="#8b5cf6" opacity="0.5"/>
                    <rect x="25" y="25" width="7" height="7" rx="2" fill="#8b5cf6"/>
                  </svg>
               ), title: 'AI-Native Training', desc: 'ChatGPT, OpenRouter, Claude — you learn how to wire AI into real business workflows from Day 4.', bg: 'bg-white', size: 'lg:col-span-1' },
              { icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-12 h-12" fill="none">
                    <circle cx="24" cy="24" r="22" fill="#fff7ed" stroke="#f97316" strokeWidth="2"/>
                    <path d="M24 10c0 0 8 6 8 14a8 8 0 01-16 0c0-8 8-14 8-14z" fill="#f97316"/>
                    <path d="M20 34l-3 4M28 34l3 4" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
               ), title: 'Deploy Live in Week 3', desc: 'Your automation goes to production on Railway. Real URL. Real users. Not a sandbox toy.', bg: 'bg-white', size: 'lg:col-span-1' },
              { icon: '🎓', title: 'MSN Certificate', desc: 'Earn a verified certificate from Moon Space Network to display on LinkedIn and your portfolio.', bg: 'bg-white', size: 'lg:col-span-1' },
              { icon: '👨‍🏫', title: 'Direct Instructor Access', desc: 'You get direct Q&A time with Femi. No generic support queues. Get unblocked fast.', bg: 'bg-white', size: 'lg:col-span-1' },
              { icon: '♾️', title: 'Lifetime Recordings', desc: 'Miss a session? Replay all 12 recorded sessions forever at your own pace.', bg: 'bg-white', size: 'lg:col-span-1' },
            ].map((item, i) => (
              <div key={i} className={`${item.bg} ${item.size} border border-slate-200 shadow-sm rounded-2xl p-8 hover:-translate-y-1 hover:shadow-lg transition-all duration-200`}>
                <div className="text-4xl flex justify-center mb-5">{item.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE WORKFLOWS SLIDESHOW ── */}
      <section id="workflows" className="py-24 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-6">Real n8n Workflows</span>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-4">See What You&apos;ll Build</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">These are actual screenshots from our training sessions — real workflows, not demos. By the end of Week 4, you&apos;ll have built all of these.</p>
              <div className="space-y-3">
                {workflows.map((w, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveWorkflow(i)}
                    className={`w-full text-left px-5 py-4 rounded-xl transition-all ${i === activeWorkflow ? 'bg-emerald-50 border-2 border-emerald-400 text-emerald-800 font-bold shadow-sm' : 'bg-white border-2 border-slate-100 text-slate-600 hover:border-slate-300'}`}
                  >
                    <span className="text-sm">{w.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-slate-200 border border-slate-200 bg-slate-900 p-2">
              <div className="bg-slate-900 relative rounded-xl overflow-hidden">
                <Image
                  src={workflows[activeWorkflow].src}
                  alt={workflows[activeWorkflow].title}
                  width={1000}
                  height={600}
                  className="w-full h-auto transition-opacity duration-500"
                />
              </div>
              <div className="bg-slate-900 px-4 py-3 flex items-center justify-between mt-2 rounded-xl">
                <div>
                  <div className="text-sm font-semibold text-white">{workflows[activeWorkflow].title}</div>
                  <div className="text-xs text-slate-400">Workflow {activeWorkflow + 1} of {workflows.length}</div>
                </div>
                <div className="flex gap-1.5">
                  {workflows.map((_, i) => (
                    <button key={i} onClick={() => setActiveWorkflow(i)} className={`h-2 rounded-full transition-all ${i === activeWorkflow ? 'bg-emerald-500 w-6' : 'bg-slate-700 w-2 hover:bg-slate-600'}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INSTRUCTOR ── */}
      <section id="instructor" className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 lg:order-1 flex justify-center">
              <Image
                src="/femi-headshot.webp"
                alt="Femi Adeleke - Instructor"
                width={400}
                height={500}
                className="relative rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-sm mx-auto hover:scale-[1.02] hover:-rotate-1 transition-all duration-500 object-cover border-4 border-white"
              />
            </div>

            <div className="order-1 lg:order-2">
              <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-6">Your Instructor</span>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Meet Femi Adeleke</h2>
              <p className="text-slate-500 mb-4 leading-relaxed">
                I&apos;m a full-stack developer and automation engineer based in Ibadan, Nigeria. I specialize in building production-grade n8n workflows, connecting LLMs to real business applications, and AI-powered solutions.
              </p>
              <p className="text-slate-500 mb-8 leading-relaxed">
                AutoLearn Spot is my first formal training program — and that&apos;s <strong className="text-slate-900">your advantage</strong>. You get direct access to me, real-time problem-solving, and curriculum built from workflows I&apos;m deploying right now.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: '🔧', text: '10+ Production Projects' },
                  { icon: '📱', text: 'Flutter & React Expert' },
                  { icon: '🧠', text: 'AI Integration Specialist' },
                  { icon: '🎓', text: 'Educator & Trainer' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white shadow-sm rounded-xl p-3 border border-slate-200">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm font-bold text-slate-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-3xl px-6 sm:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-500">Got questions? We&apos;ve got answers.</p>
          </div>

          <div className="space-y-3">
            {[
              { q: 'Do I need coding experience?', a: 'No. AutoLearn Spot is 100% beginner-friendly. n8n is visual — no coding required. Many learners had zero technical background before joining.' },
              { q: 'What if I miss a session?', a: 'All 12 sessions are recorded and available for lifetime access. You can catch up anytime, though live sessions offer real-time Q&A.' },
              { q: 'Is the certificate recognized?', a: 'Yes. The certificate is issued by Moon Space Network, a trusted organization. You can display it on LinkedIn and professional profiles.' },
              { q: 'What payment methods do you accept?', a: 'We use Paystack for secure payments — Visa, Mastercard, bank transfer, or USSD. All transactions are encrypted.' },
              { q: 'Can I get a refund?', a: 'We offer a full refund within the first 3 days if you\'re not satisfied. No questions asked.' },
              { q: 'How long do I have access?', a: 'Lifetime. Once enrolled, you have access to all 12 recordings and any future updates to the curriculum.' },
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-emerald-300 transition-all">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-white transition-colors text-left"
                >
                  <h3 className="text-sm font-bold text-slate-900">{item.q}</h3>
                  <span className={`text-emerald-500 text-xl transition-transform duration-300 ml-4 flex-shrink-0 ${expandedFAQ === i ? 'rotate-180' : ''}`}>⌄</span>
                </button>
                {expandedFAQ === i && (
                  <div className="px-6 pb-6 bg-white border-t border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed pt-4">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 text-center p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
            <p className="text-slate-600 mb-4 font-medium text-sm">Still have questions?</p>
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold text-sm transition-all shadow-md shadow-green-200 hover:shadow-green-300"
            >
              💬 Chat with us on WhatsApp
            </button>
          </div>
        </div>
      </section>

      {/* ── HERO SLIDER ── */}
      <section id="hero-slider" className="relative py-12 bg-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="relative" onTouchStart={e => setTouchStartX(e.touches[0].clientX)} onTouchEnd={e => {
            const delta = e.changedTouches[0].clientX - touchStartX;
            if (delta > 50) prevSlide();
            else if (delta < -50) nextSlide();
          }}>
            {/* Slides */}
            <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
              {/* Flyer 1 */}
              <div className="w-full flex-shrink-0">
                <img src="/flyers/file_000000006b3471f498a468f3a2f44c82.png" alt="Flyer 1" className="w-full h-auto rounded-lg shadow-lg" />
              </div>
              {/* Flyer 2 */}
              <div className="w-full flex-shrink-0">
                <img src="/flyers/file_00000000b6f071f4bddf5270e506a2d5.png" alt="Flyer 2" className="w-full h-auto rounded-lg shadow-lg" />
              </div>
              {/* Flyer 3 */}
              <div className="w-full flex-shrink-0">
                <img src="/flyers/file_00000000e4cc71f48aa57cacf6254375.png" alt="Flyer 3" className="w-full h-auto rounded-lg shadow-lg" />
              </div>
              {/* CTA Slide */}
              <div className="w-full flex-shrink-0">
                <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-12 overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                  <div className="relative text-center">
                    <span className="text-5xl block mb-6">🚀</span>
                    <h2 className="text-4xl font-extrabold text-white mb-4">Ready to start building?</h2>
                    <p className="text-slate-300 mb-8 max-w-lg mx-auto leading-relaxed text-lg">
                      Stop watching tutorials and start building real automations. Join the training and get certified.
                    </p>
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-full px-10 h-14 text-base font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02]"
                      onClick={() => setShowRegModal(true)}
                    >
                      Enroll Now — Only {programPrice} →
                    </Button>
                    <p className="text-xs text-slate-400 mt-5 font-medium">3-day money back guarantee · Secure payment via Paystack</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Navigation */}
            <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-2 hover:bg-black/50 transition">
              ←
            </button>
            <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-2 hover:bg-black/50 transition">
              →
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 bg-slate-50 py-10">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/autolearn-brandmark.png" alt="AutoLearn Spot Logo" width={32} height={32} className="rounded-lg" />
            <span className="text-base font-bold text-slate-900">AutoLearn <span className="text-emerald-500">Spot</span></span>
          </div>
          <div className="text-sm font-medium text-slate-500">© 2026 AutoLearn Spot. All rights reserved.</div>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Contact'].map((l) => (
              <a key={l} href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* ── FLOATING WHATSAPP ── */}
      <button
        onClick={() => setShowWhatsAppModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg shadow-green-200 flex items-center justify-center text-white transition-all duration-300 hover:scale-110 z-50"
        aria-label="Chat on WhatsApp"
      >
        <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </button>

      {/* ── REGISTRATION MODAL ── */}
      {showRegModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeRegModal}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeRegModal} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">✕</button>

            {!regSuccess ? (
              <>
                <div className="mb-6">
                  <span className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full mb-3">STEP 1 OF 2</span>
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Join AutoLearn Spot</h2>
                  <p className="text-slate-500 text-sm">Enter your details, then complete payment securely via Paystack.</p>
                </div>

                <div className="space-y-4 mb-5">
                  {[
                    { label: 'Full Name *', type: 'text', key: 'name', placeholder: 'e.g., Chioma Adeleke' },
                    { label: 'Email Address *', type: 'email', key: 'email', placeholder: 'e.g., chioma@gmail.com' },
                    { label: 'Phone Number *', type: 'tel', key: 'phone', placeholder: 'e.g., 08120934828' },
                    { label: 'Referral Code', type: 'text', key: 'referral', placeholder: 'Optional' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">{field.label}</label>
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={regData[field.key as keyof typeof regData]}
                        onChange={(e) => setRegData({ ...regData, [field.key]: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Investment</p>
                    <p className="text-xs text-green-600 mt-1 font-semibold flex items-center gap-1">🔒 Secure via Paystack</p>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900">{programPrice}</p>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl h-14 text-base font-bold shadow-lg shadow-emerald-200 mb-3 transition-all"
                  onClick={handleSubmitReg}
                  disabled={regLoading}
                >
                  {regLoading ? 'Processing...' : 'Continue to Payment →'}
                </Button>
                <button onClick={closeRegModal} className="w-full py-2 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors">
                  Cancel
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-100 flex items-center justify-center text-4xl mx-auto mb-5">✅</div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Details Saved!</h3>
                <p className="text-slate-500 font-medium mb-6">Redirecting you to secure payment...</p>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-emerald-500"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── WHATSAPP MODAL ── */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowWhatsAppModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowWhatsAppModal(false)} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">✕</button>

            <div className="text-center mb-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-green-500 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Chat with Femi</h2>
              <p className="text-slate-500 font-medium">Pick a message to open WhatsApp instantly</p>
            </div>

            <div className="space-y-3 mb-6">
              {messages.map((item, i) => (
                <button
                  key={i}
                  onClick={() => sendWhatsApp(item.msg)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-green-50 border border-slate-200 hover:border-green-300 transition-all text-left group"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-sm text-slate-700 font-bold group-hover:text-green-800">{item.text}</span>
                  <span className="ml-auto text-slate-300 group-hover:text-green-500 font-bold">→</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Or</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <button
              onClick={joinCommunity}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-base transition-all shadow-lg shadow-green-200 mb-4"
            >
              👥 Join WhatsApp Community
            </button>
            <p className="text-center text-slate-400 font-medium text-xs">Usually replies within a few hours</p>
          </div>
        </div>
      )}
    </main>
  )
}
