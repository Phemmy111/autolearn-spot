'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function Page() {
  const [activeWorkflow, setActiveWorkflow] = useState('email')

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
                <Button size="lg" variant="outline" className="border-slate-300 text-slate-900 hover:bg-slate-50">
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

      {/* What You'll Learn */}
      <section id="features" className="border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
          <h2 className="text-3xl font-serif text-slate-900 mb-12">What You&apos;ll Learn</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { title: 'Email Automation', description: 'Build intelligent email workflows with AI-powered responses and automation.' },
              { title: 'Data Integration', description: 'Connect and sync data across Gmail, Sheets, and other business tools.' },
              { title: 'Real-World Solutions', description: 'Create automations that solve actual business challenges and workflows.' },
            ].map((item, i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-6 hover:border-slate-300 transition-colors">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
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

          {/* Workflow Tabs */}
          <div className="mb-8 flex gap-3 border-b border-slate-200">
            {[
              { id: 'email', label: 'Email Responder' },
              { id: 'form', label: 'Form Submission' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveWorkflow(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeWorkflow === tab.id
                    ? 'border-amber-600 text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Workflow Display */}
          <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-6">
            {activeWorkflow === 'email' && (
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_2026-06-24-16-42-55-750_com.playit.videoplayer-NeXBGsSEq0TAhzDebstVdH4ojDWudU.jpg"
                alt="Email Responder Workflow"
                width={1000}
                height={600}
                className="w-full h-auto rounded"
              />
            )}
            {activeWorkflow === 'form' && (
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_2026-06-24-16-41-59-581_com.playit.videoplayer-wKF8HBnGTjyg5jtgwF4Dm5ZuLBv0Zq.jpg"
                alt="Form Submission Workflow"
                width={1000}
                height={600}
                className="w-full h-auto rounded"
              />
            )}
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
