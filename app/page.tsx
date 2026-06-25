'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

export default function Page() {
  const [activeWorkflow, setActiveWorkflow] = useState(0)
  const [showRegModal, setShowRegModal] = useState(false)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [regData, setRegData] = useState({ name: '', email: '', phone: '', referral: '' })
  const [regLoading, setRegLoading] = useState(false)
  const [regSuccess, setRegSuccess] = useState(false)
  const [expandedFAQ, setExpandedFAQ] = useState(null)

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
  ]

  const handleSubmitReg = async () => {
    if (!regData.name.trim()) {
      alert('Please enter your full name.')
      return
    }
    if (!regData.email.trim() || !regData.email.includes('@')) {
      alert('Please enter a valid email.')
      return
    }
    if (!regData.phone.trim()) {
      alert('Please enter your phone number.')
      return
    }

    setRegLoading(true)
    const payload = {
      'Full Name': regData.name,
      Email1: regData.email,
      Phone: regData.phone,
      ReferralCode: regData.referral,
    }

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      })
      setRegSuccess(true)
      setTimeout(() => {
        window.location.href = paystackLink
      }, 1800)
    } catch (error) {
      console.error('Webhook error:', error)
      setRegSuccess(true)
      setTimeout(() => {
        window.location.href = paystackLink
      }, 1800)
    }
  }

  const sendWhatsApp = (message) => {
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank')
    setShowWhatsAppModal(false)
  }

  const joinCommunity = () => {
    window.open(whatsappCommunity, '_blank')
    setShowWhatsAppModal(false)
  }

  const closeRegModal = () => {
    if (!regSuccess) {
      setShowRegModal(false)
      setRegData({ name: '', email: '', phone: '', referral: '' })
    }
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

  useEffect(() => {
    const mainFlow = ['node-1', 'node-2', 'node-3', 'node-4', 'node-5', 'node-6', 'node-7']
    const branches = ['node-8', 'node-9', 'node-10', 'node-11', 'node-12', 'node-13']
    
    const animateWorkflow = () => {
      // Animate main flow
      mainFlow.forEach((nodeId, index) => {
        setTimeout(() => {
          const element = document.getElementById(nodeId)
          if (element) {
            element.classList.add('active')
            setTimeout(() => {
              element.classList.remove('active')
            }, 800)
          }
        }, index * 700)
      })
      
      // Animate branches after main flow completes
      const mainFlowDuration = mainFlow.length * 700
      branches.forEach((nodeId, index) => {
        setTimeout(() => {
          const element = document.getElementById(nodeId)
          if (element) {
            element.classList.add('active')
            setTimeout(() => {
              element.classList.remove('active')
            }, 600)
          }
        }, mainFlowDuration + index * 500)
      })
    }
    
    animateWorkflow()
    const interval = setInterval(animateWorkflow, 9000)
    
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
              <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setShowRegModal(true)}>Get Started</Button>
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
                <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setShowRegModal(true)}>
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
            <div className="flex justify-center w-full">
              <div className="relative w-full max-w-2xl" style={{ aspectRatio: '16/10' }}>
                <style>{`
                  @keyframes nodeGlow {
                    0%, 100% {
                      transform: scale(1);
                      box-shadow: 0 0 0px rgba(34, 197, 94, 0.4);
                    }
                    50% {
                      transform: scale(1.2);
                      box-shadow: 0 0 16px rgba(34, 197, 94, 1), inset 0 0 8px rgba(34, 197, 94, 0.6);
                    }
                  }
                  
                  .workflow-image-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    border-radius: 8px;
                    overflow: hidden;
                    border: 2px solid rgba(34, 197, 94, 0.3);
                  }
                  
                  .workflow-image-container img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                  }
                  
                  .animation-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                  }
                  
                  .node-indicator {
                    position: absolute;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: rgba(34, 197, 94, 0.3);
                    border: 2px solid rgba(34, 197, 94, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    transform: translate(-50%, -50%);
                  }
                  
                  .node-indicator.active {
                    animation: nodeGlow 0.8s ease-in-out;
                  }
                `}</style>
                
                <div className="workflow-image-container">
                  <Image
                    src="/workflow-real.jpg"
                    alt="n8n Workflow Automation"
                    width={1200}
                    height={750}
                    className="w-full h-full"
                    priority
                  />
                  <div className="animation-overlay" id="animation-overlay">
                    {/* Main flow nodes - positioned at approximate node locations */}
                    <div className="node-indicator" id="node-1" style={{ left: '18%', top: '25%' }} />
                    <div className="node-indicator" id="node-2" style={{ left: '28%', top: '38%' }} />
                    <div className="node-indicator" id="node-3" style={{ left: '38%', top: '32%' }} />
                    <div className="node-indicator" id="node-4" style={{ left: '48%', top: '30%' }} />
                    <div className="node-indicator" id="node-5" style={{ left: '55%', top: '35%' }} />
                    <div className="node-indicator" id="node-6" style={{ left: '62%', top: '32%' }} />
                    <div className="node-indicator" id="node-7" style={{ left: '72%', top: '38%' }} />
                    
                    {/* Branch nodes */}
                    <div className="node-indicator" id="node-8" style={{ left: '40%', top: '58%' }} />
                    <div className="node-indicator" id="node-9" style={{ left: '52%', top: '60%' }} />
                    <div className="node-indicator" id="node-10" style={{ left: '58%', top: '62%' }} />
                    <div className="node-indicator" id="node-11" style={{ left: '64%', top: '60%' }} />
                    <div className="node-indicator" id="node-12" style={{ left: '70%', top: '62%' }} />
                    <div className="node-indicator" id="node-13" style={{ left: '82%', top: '60%' }} />
                  </div>
                </div>
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

      {/* Tools You'll Master */}
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif text-slate-900 mb-4">Tools You&apos;ll Master</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Master the complete n8n ecosystem and integrate with the tools your business already uses</p>
          </div>
          
          <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-4">
            {[
              { name: 'n8n', desc: 'Workflow automation' },
              { name: 'ChatGPT', desc: 'AI integration' },
              { name: 'Gmail', desc: 'Email automation' },
              { name: 'Telegram', desc: 'Bot creation' },
              { name: 'Google Sheets', desc: 'Data management' },
              { name: 'WhatsApp', desc: 'Messaging automation' },
              { name: 'Railway', desc: 'Production deployment' },
              { name: 'Supabase', desc: 'Database & auth' },
            ].map((tool, i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-4 text-center hover:border-amber-400 transition-colors hover:shadow-md">
                <div className="text-3xl mb-2 inline-block px-3 py-2 bg-slate-50 rounded-lg">{tool.name[0]}</div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">{tool.name}</h3>
                <p className="text-xs text-slate-500">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif text-slate-900 mb-4">Why AutoLearn Spot Stands Out</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">We focus on what truly matters for your success</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: '⚡',
                title: '100% Practical',
                desc: 'Every session produces production-ready workflows you can deploy immediately'
              },
              {
                icon: '🤖',
                title: 'AI-Powered First',
                desc: 'Learn ChatGPT integration and AI automation from day one'
              },
              {
                icon: '🚀',
                title: 'Deploy to Production',
                desc: 'Deploy your automations live with Railway in Week 3'
              },
              {
                icon: '🎓',
                title: 'Certified by MSN',
                desc: 'Earn a recognized certificate from Moon Space Network'
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-200 p-6 text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
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

      {/* Instructor Section */}
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-serif text-slate-900 mb-4">Meet Your Instructor</h2>
              <p className="text-slate-600 mb-6">
                I&apos;m Femi Adeleke, a full-stack developer and automation engineer based in Ibadan, Nigeria. I specialize in building production-grade automation workflows with n8n, connecting LLMs to real-world applications, and creating AI-powered solutions. I&apos;m also an educator at heart, currently teaching English Language and Literature while building automation projects that solve actual business problems.
              </p>
              <p className="text-slate-600 mb-6">
                AutoLearn Spot is my first formal training program—and that&apos;s your advantage. You get direct access to me, real-time problem-solving, and training that&apos;s shaped by the exact workflows I&apos;m building right now in production. No outdated curriculum, no theory-heavy lectures. Pure, practical automation.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-amber-600 font-bold mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-slate-900">10+ Production Automation Projects</p>
                    <p className="text-sm text-slate-600">Including WhatsApp bots, content pipelines, AI chatbots, and more</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-amber-600 font-bold mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-slate-900">Full-Stack Developer</p>
                    <p className="text-sm text-slate-600">Flutter mobile apps, React frontends, Supabase/Firebase backends</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-amber-600 font-bold mt-1">✓</span>
                  <div>
                    <p className="font-semibold text-slate-900">AI Integration Specialist</p>
                    <p className="text-sm text-slate-600">Claude, Gemini, GPT-4o, and multi-model routing with OpenRouter</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <Image
                src="/femi-headshot.webp"
                alt="Femi Adeleke - Instructor"
                width={350}
                height={450}
                className="w-full max-w-sm h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-3xl px-6 py-20 sm:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-600">Got questions? We&apos;ve got answers. Can&apos;t find what you&apos;re looking for? Reach out on WhatsApp.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Do I need coding experience?',
                a: 'No, absolutely not. AutoLearn Spot is 100% beginner-friendly. We teach n8n visually with no coding required. Many of our learners had zero technical background before joining.'
              },
              {
                q: 'What if I miss a session?',
                a: 'All sessions are recorded and available to access anytime. You can watch at your own pace, though we recommend keeping up with the live sessions for Q&A and community interaction.'
              },
              {
                q: 'Is the certificate recognized?',
                a: 'Yes. Our certificate is issued by Moon Space Network, a trusted organization in the tech community. You can display it on LinkedIn and your professional profiles.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We use Paystack for secure payments. You can pay with your card (Visa, Mastercard), bank transfer, or USSD. All transactions are secure and encrypted.'
              },
              {
                q: 'Can I get a refund?',
                a: 'We stand behind our training. If you&apos;re not satisfied within the first 3 days, we offer a full refund. No questions asked.'
              },
              {
                q: 'How long do I have access?',
                a: 'You get lifetime access to all course materials, recorded sessions, and resources. You can revisit any content anytime.'
              },
            ].map((item, i) => (
              <div
                key={i}
                className="border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-colors"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                >
                  <h3 className="font-semibold text-slate-900">{item.q}</h3>
                  <span className={`text-amber-600 transition-transform duration-300 ${expandedFAQ === i ? 'rotate-180' : ''}`}>
                    ⌄
                  </span>
                </button>
                {expandedFAQ === i && (
                  <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                    <p className="text-slate-600 text-sm leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center p-6 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-slate-600 mb-4">Still have questions?</p>
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="inline-block px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              Chat with us on WhatsApp
            </button>
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
          <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setShowRegModal(true)}>
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
        onClick={() => setShowWhatsAppModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center text-white text-2xl transition-all duration-300 hover:scale-110 z-50"
        aria-label="Chat with us on WhatsApp"
        title="Chat with us on WhatsApp"
      >
        💬
      </button>

      {/* Registration Modal */}
      {showRegModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeRegModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {!regSuccess ? (
              <>
                <button
                  onClick={closeRegModal}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl"
                >
                  ✕
                </button>
                <div className="mb-6">
                  <div className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full mb-3">
                    STEP 1 OF 2
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Join AutoLearn Spot</h2>
                  <p className="text-slate-600 text-sm">Enter your details then complete payment.</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Chioma Adeleke"
                      value={regData.name}
                      onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Email Address *</label>
                    <input
                      type="email"
                      placeholder="e.g., chioma@gmail.com"
                      value={regData.email}
                      onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="e.g., 08120934828"
                      value={regData.phone}
                      onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Referral Code</label>
                    <input
                      type="text"
                      placeholder="Optional referral code"
                      value={regData.referral}
                      onChange={(e) => setRegData({ ...regData, referral: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg mb-6">
                  <p className="text-xs text-slate-600 mb-1">Total — 12 sessions + certificate</p>
                  <p className="text-xs text-slate-600 mb-3">✓ Secure via Paystack</p>
                  <p className="text-xl font-bold text-slate-900">{programPrice}</p>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white mb-3"
                  onClick={handleSubmitReg}
                  disabled={regLoading}
                >
                  {regLoading ? 'Processing...' : 'Continue to Payment →'}
                </Button>
                <button
                  onClick={closeRegModal}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✓</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Details Saved!</h3>
                <p className="text-slate-600 text-sm mb-4">Redirecting to payment...</p>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowWhatsAppModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowWhatsAppModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl"
            >
              ✕
            </button>

            <div className="text-center mb-8">
              <div className="text-5xl mb-3">💬</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Chat with Femi</h2>
              <p className="text-slate-600 text-sm">Pick a message — opens WhatsApp instantly</p>
            </div>

            <div className="space-y-3 mb-6">
              {messages.map((item, i) => (
                <button
                  key={i}
                  onClick={() => sendWhatsApp(item.msg)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-green-50 border border-slate-200 hover:border-green-400 transition-colors text-left group"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-slate-900 font-medium group-hover:text-green-600">{item.text}</span>
                  <span className="ml-auto text-slate-400 group-hover:text-green-600">→</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-slate-500 text-sm">or</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <button
              onClick={joinCommunity}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors mb-3"
            >
              <span>👥</span> Join WhatsApp Community
            </button>

            <p className="text-center text-slate-500 text-xs">Usually replies within a few hours</p>
          </div>
        </div>
      )}
    </main>
  )
}
