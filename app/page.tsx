'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

export default function Page() {
  const [activeWorkflow, setActiveWorkflow] = useState(0)

  const whatsappNumber = '2348120934828'
  const whatsappCommunity = 'https://chat.whatsapp.com/FqgDAgL34Wq6tyPkT3nZ20'
  const programPrice = '₦3,000'

  const handleWhatsAppClick = (message) => {
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank')
  }

  const openWhatsAppOptions = () => {
    handleWhatsAppClick('Hi Femi! I am interested in AutoLearn Spot. How do I register?')
  }

  const workflows = [
    {
      title: 'Email Responder',
      src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_2026-06-24-16-42-55-750_com.playit.videoplayer-NeXBGsSEq0TAhzDebstVdH4ojDWudU.jpg',
    },
    {
      title: 'Form Submission',
      src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_2026-06-24-16-41-59-581_com.playit.videoplayer-wKF8HBnGTjyg5jtgwF4Dm5ZuLBv0Zq.jpg',
    },
    {
      title: 'Email Responder (Advanced)',
      src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_2026-06-24-16-42-32-051_com.playit.videoplayer-RaIbheFNV5m53K4ycv0bOryZRlrgXF.jpg',
    },
    {
      title: 'AutoLearn Day 4',
      src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_2026-06-24-16-43-28-995_com.playit.videoplayer-Wx9wfXXNVy7rJaPLARxfntNz6gveOw.jpg',
    },
    {
      title: 'AutoLearn Day 3',
      src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_2026-06-24-16-43-55-665_com.playit.videoplayer-kOfEbpPWhJUn7nO40BFoTsUGu6A0sZ.jpg',
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWorkflow((prev) => (prev + 1) % workflows.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="bg-white text-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-4 sm:px-8">
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold text-slate-900">AutoLearn</div>
            <div className="flex items-center gap-6">
              <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                How It Works
              </a>
              <Button className="bg-amber-600 hover:bg-amber-700" onClick={openWhatsAppOptions}>Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h1 className="text-4xl font-serif text-slate-900 leading-tight sm:text-5xl">
                Learn n8n Automation by Building Real Workflows
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                Master workflow automation through practical, hands-on training. Build real n8n automations that solve actual business problems.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={openWhatsAppOptions}>
                  Start Learning Today
                </Button>
                <Button 
                  size="lg" 
                  className="border-2 border-slate-900 bg-white text-slate-900 hover:bg-slate-100"
                  onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                >
                  View Curriculum
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative w-full max-w-sm">
                <Image
                  src="/femi-headshot.webp"
                  alt="Femi Adeleke - Automation Trainer"
                  width={400}
                  height={500}
                  className="w-full h-auto rounded-lg shadow-lg"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Week Curriculum */}
      <section id="features" className="border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
          <div className="text-center mb-16">
            <div className="text-amber-600 font-semibold text-sm uppercase tracking-wide mb-2">4-Week Curriculum</div>
            <h2 className="text-3xl font-serif text-slate-900 mb-4">What You&apos;ll Build</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Every session is 100% practical. Deploy real workflows from Day 1.</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                week: 'Week 1',
                title: 'n8n Automation Fundamentals',
                subtitle: 'Learn the basics & build your first workflow',
                sessions: [
                  { num: '1', title: 'Theory + Account Setup' },
                  { num: '2', title: 'Form → Personalised Email' },
                  { num: '3', title: 'Add Google Sheets' },
                ]
              },
              {
                week: 'Week 2',
                title: 'AI-Powered Workflows',
                subtitle: 'Build intelligent automation with ChatGPT',
                sessions: [
                  { num: '4', title: 'AI Telegram Bot' },
                  { num: '5', title: 'AI Email Auto-Responder' },
                  { num: '6', title: 'AI Content Summarizer' },
                ]
              },
              {
                week: 'Week 3',
                title: 'Deployment + Advanced Workflows',
                subtitle: 'Deploy to production & scale your bots',
                sessions: [
                  { num: '7', title: 'Deploy n8n on Railway' },
                  { num: '8', title: 'AI Customer Support Bot' },
                  { num: '9', title: 'Lead Capture + AI Qualifier' },
                ]
              },
              {
                week: 'Week 4',
                title: 'Capstone Project',
                subtitle: 'Build, present & earn your certificate',
                sessions: [
                  { num: '10', title: 'AI Social Media Content Generator' },
                  { num: '11', title: 'Capstone Build Day' },
                  { num: '12', title: 'Presentation + Certification' },
                ]
              },
            ].map((week, i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-6 hover:border-slate-300 transition-colors">
                <div className="text-amber-600 font-semibold text-sm mb-2">{week.week}</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">{week.title}</h3>
                <p className="text-sm text-slate-500 mb-6">{week.subtitle}</p>
                <div className="space-y-3">
                  {week.sessions.map((session, j) => (
                    <div key={j} className="flex gap-3 pb-3 border-b border-slate-100 last:pb-0 last:border-b-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-semibold text-sm flex-shrink-0">
                        {session.num}
                      </div>
                      <div className="text-sm text-slate-600">{session.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Curriculum Info Cards */}
          <div className="grid gap-6 md:grid-cols-3 mt-12 pt-12 border-t border-slate-200">
            {[
              { icon: '📅', label: 'Schedule', text: 'Mon/Wed/Fri, 30 mins each' },
              { icon: '🎓', label: 'Certificate', text: 'Issued by Moon Space Network' },
              { icon: '💰', label: 'Investment', text: programPrice + ' - All Inclusive' },
            ].map((info, i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-6 text-center">
                <div className="text-3xl mb-3">{info.icon}</div>
                <h3 className="font-semibold text-slate-900 mb-1">{info.label}</h3>
                <p className="text-sm text-slate-600">{info.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Workflows */}
      <section id="how-it-works" className="border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
          <h2 className="text-3xl font-serif text-slate-900 mb-4">Real n8n Workflows</h2>
          <p className="text-slate-600 mb-12 max-w-2xl">
            See the actual workflows used in our training. Each example demonstrates practical automation patterns you can apply immediately.
          </p>

          {/* Workflow Slideshow */}
          <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
            <div className="relative w-full bg-slate-900">
              <div className="transition-opacity duration-500">
                <Image
                  src={workflows[activeWorkflow].src}
                  alt={workflows[activeWorkflow].title}
                  width={1000}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
            </div>
            
            {/* Slideshow Controls */}
            <div className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{workflows[activeWorkflow].title}</h3>
                <p className="text-sm text-slate-600 mt-1">Workflow {activeWorkflow + 1} of {workflows.length}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveWorkflow((prev) => (prev - 1 + workflows.length) % workflows.length)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-900 hover:bg-slate-100 transition-colors font-medium"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setActiveWorkflow((prev) => (prev + 1) % workflows.length)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-900 hover:bg-slate-100 transition-colors font-medium"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Slideshow Indicators */}
            <div className="px-6 pb-4 flex gap-2 justify-center">
              {workflows.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveWorkflow(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === activeWorkflow ? 'bg-amber-600 w-8' : 'bg-slate-300 w-2 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 text-center">
          <h2 className="text-3xl font-serif mb-6">Ready to Master n8n Automation?</h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Join our comprehensive training program and learn to build powerful automations that drive real business results.
          </p>
          <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={openWhatsAppOptions}>
            Enroll Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="text-slate-600 text-sm">© 2026 AutoLearn. All rights reserved.</div>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <a href="#" className="text-slate-600 hover:text-slate-900 text-sm transition-colors">Privacy</a>
              <a href="#" className="text-slate-600 hover:text-slate-900 text-sm transition-colors">Terms</a>
              <a href="#" className="text-slate-600 hover:text-slate-900 text-sm transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Icon */}
      <button
        onClick={openWhatsAppOptions}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110 z-50"
        aria-label="Contact us on WhatsApp"
        title="Chat with us on WhatsApp"
      >
        <svg
          className="w-7 h-7"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-9.746 9.798c0 2.734.743 5.404 2.153 7.718L2.854 23.75l8.132-2.135a9.847 9.847 0 004.736 1.204h.004c5.425 0 9.85-4.418 9.85-9.85 0-2.631-.997-5.109-2.81-6.977A9.833 9.833 0 0011.586 2.979zm7.607 12.614c-.265.593-1.043.967-1.796 1.087-.601.09-1.386.159-3.957-.839-3.529-1.432-5.798-5.005-5.973-5.235-.174-.23-1.422-1.897-1.422-3.615 0-1.719.9-2.563 1.22-2.915.272-.297.594-.371.84-.371.211 0 .42.009.601.015.19.006.474-.071.743.565.281.671.941 2.3.024 3.852-.217.408-.521.734-.95.734-.21 0-.42-.065-.616-.2-1.119-.743-2.17-1.903-2.17-3.793 0-2.134 1.382-4.025 3.535-4.025 1.922 0 3.598 1.385 3.973 3.246.529 2.582-.3 5.335-2.126 6.514z" />
        </svg>
      </button>
    </main>
  )
}
