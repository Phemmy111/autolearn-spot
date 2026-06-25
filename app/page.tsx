'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

export default function Page() {
  const [activeWorkflow, setActiveWorkflow] = useState(0)

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
              <Button className="bg-amber-600 hover:bg-amber-700">Get Started</Button>
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
                <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white">
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
              { icon: '👥', label: 'For Everyone', text: 'No coding experience needed' },
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
          <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white">
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
    </main>
  )
}
