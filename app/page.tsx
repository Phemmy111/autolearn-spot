import {
  CheckCircle,
  Star,
  Play,
  GraduationCap,
  Users,
  Award,
  Clock,
  Video,
  FileText,
  MessageCircle,
  Globe,
  Rocket,
  Webhook,
  BrainCircuit,
  GitFork,
  Sheet,
  Plus,
  Target,
  Zap,
  Shield,
  Trophy,
  Infinity,
  Mail
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import Navigation from '@/components/Navigation'
import FAQSection from '@/components/FAQSection'
import { StudentTestimonialCard } from '@/components/student-testimonial-card'
import { LiveActivityFeed } from '@/components/live-activity-feed'
import { SocialIcon } from '@/components/social-icon'
import { socialLinks } from '@/config/social'
import { studentTestimonials } from '@/config/testimonials'
import { AutolearnBot } from '@/components/autolearn-bot'
import { WhatsAppChatModal } from '@/components/whatsapp-chat-modal'
import './page.css'

const navItems = [
  { name: 'Curriculum', href: '#curriculum' },
  { name: 'Tools', href: '#tools' },
  { name: 'Why AutoLearn Spot', href: '#why' },
  { name: 'FAQ', href: '#faq' },
  { name: 'Partners', href: '/partners' },
  { name: 'Student Dashboard', href: '/dashboard' },
  { name: 'Scholarship', href: '/scholarship' },
]

const stats = [
  { value: '10+', label: 'Real Workflows Built' },
  { value: '12', label: 'Live Hands-on Sessions' },
  { value: '4 Weeks', label: 'Program Duration' },
  { value: '100%', label: 'Practical Learning' },
]

const enrollmentBenefits = [
  'Live classes every Saturday',
  'Recorded lessons',
  'Practical assignments',
  'Certificate',
  'Community',
]

const curriculumWeeks = [
  {
    step: '01',
    title: 'n8n Fundamentals',
    phase: 'WEEK 1',
    body: 'Build your first workflow from scratch.',
    items: ['Theory + Account Setup', 'Form -> Email Automation', 'Add Google Sheets'],
  },
  {
    step: '02',
    title: 'AI-Powered Workflows',
    phase: 'WEEK 2',
    body: 'Connect ChatGPT to your automations.',
    items: ['AI Telegram Bot', 'AI Email Auto-Responder', 'AI Content Summarizer'],
  },
  {
    step: '03',
    title: 'Deploy & Scale',
    phase: 'WEEK 3',
    body: 'Take your workflows live on Railway.',
    items: ['Deploy n8n on Railway', 'AI Customer Support Bot', 'Lead Capture + AI Qualifier'],
  },
  {
    step: '04',
    title: 'Capstone Project',
    phase: 'WEEK 4',
    body: 'Build a full product and get certified.',
    items: ['Social Media Content Bot', 'Capstone Build Day', 'Presentation + Certificate'],
    active: true,
  },
]

const featureIcons = [
  { icon: Webhook, title: 'n8n Automation', description: 'Master visual workflow automation' },
  { icon: BrainCircuit, title: 'AI Integration', description: 'Connect ChatGPT to real workflows' },
  { icon: Rocket, title: 'Real Projects', description: 'Build 10+ production-ready automations' },
  { icon: MessageCircle, title: 'Live Support', description: 'Direct access to instructors' },
  { icon: GraduationCap, title: 'Certification', description: 'Verified credential from Moon Space Network' },
  { icon: Target, title: 'Career Opportunities', description: 'Launch your automation career' },
]

const trustBadges = [
  { icon: Award, text: 'Certificate Issued' },
  { icon: Video, text: 'Live Classes' },
  { icon: Rocket, text: 'Practical Projects' },
  { icon: Infinity, text: 'Lifetime Access' },
  { icon: Users, text: 'Community Support' },
]

const workflowNodes = [
  {
    label: 'Form',
    detail: 'Student lead',
    icon: Webhook,
    x: '7%',
    y: '42%',
    tone: 'cyan',
    delay: '0s',
  },
  {
    label: 'AI Agent',
    detail: 'Score intent',
    icon: Star,
    x: '31%',
    y: '18%',
    tone: 'active',
    delay: '0.45s',
  },
  {
    label: 'IF / Switch',
    detail: 'Route lead',
    icon: GitFork,
    x: '49%',
    y: '42%',
    tone: 'cyan',
    delay: '0.9s',
  },
  {
    label: 'Sheets',
    detail: 'Save record',
    icon: Sheet,
    x: '68%',
    y: '14%',
    tone: 'brand',
    delay: '1.35s',
  },
  {
    label: 'WhatsApp',
    detail: 'Send reply',
    icon: MessageCircle,
    x: '68%',
    y: '58%',
    tone: 'brand',
    delay: '1.8s',
  },
]

const workflowLog = ['Form submitted', 'AI score: 94%', 'Student added to sheet']

function WorkflowNode({
  node,
}: {
  node: (typeof workflowNodes)[number]
}) {
  const Icon = node.icon

  return (
    <div
      className={`workflow-node absolute z-10 w-[108px] border bg-[#111317] p-3 shadow-[0_12px_30px_rgba(0,0,0,0.28)] sm:w-[132px] ${
        node.tone === 'active'
          ? 'border-[#00f0ff] shadow-[0_0_18px_rgba(0,240,255,0.22)]'
          : node.tone === 'brand'
            ? 'border-[#00f0ff]/70'
            : 'border-[#1f2229]'
      }`}
      style={{ left: node.x, top: node.y, animationDelay: node.delay }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div
          className={`flex h-8 w-8 items-center justify-center border ${
            node.tone === 'brand'
              ? 'border-[#00f0ff]/70 bg-[#00f0ff]/10 text-[#00f0ff]'
              : 'border-[#00f0ff]/70 bg-[#00f0ff]/10 text-[#00f0ff]'
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="workflow-status-dot h-2 w-2 rounded-full bg-[#00f0ff]" />
      </div>
      <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#e2e2e8] sm:text-[11px]">
        {node.label}
      </h3>
      <p className="mt-1 font-mono text-[10px] text-[#b9cacb]">{node.detail}</p>
    </div>
  )
}

function N8nWorkflowPanel() {
  return (
    <div className="relative z-10 w-full border border-border bg-card rounded-2xl overflow-hidden shadow-lg">
      <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl" />
      <div className="flex h-8 items-center justify-between border-b border-border bg-popover px-4">
        <span className="font-mono text-[10px] text-muted-foreground">live_workflow.n8n</span>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-muted" />
          <span className="h-2 w-2 rounded-full bg-muted" />
          <span className="h-2 w-2 rounded-full bg-muted" />
        </div>
      </div>

      <div className="flex h-10 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-primary">n8n canvas</span>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span className="hidden font-mono text-[10px] text-muted-foreground sm:block">real training workflow / active</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-6 w-6 items-center justify-center border border-border text-primary">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <span className="workflow-running border border-primary/70 bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary">
            RUNNING
          </span>
        </div>
      </div>

      <div className="relative min-h-[300px] sm:min-h-[360px] overflow-hidden bg-background">
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(border-color_1px,transparent_1px),linear-gradient(90deg,border-color_1px,transparent_1px)] [background-size:32px_32px]" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 620 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path d="M92 185 C170 185 162 112 242 112" fill="none" stroke="#3b494b" strokeWidth="1.5" />
          <path d="M335 138 C385 170 390 185 430 185" fill="none" stroke="#3b494b" strokeWidth="1.5" />
          <path d="M512 170 C532 138 535 105 560 86" fill="none" stroke="#3b494b" strokeWidth="1.5" />
          <path d="M512 206 C536 222 535 250 560 266" fill="none" stroke="#3b494b" strokeWidth="1.5" />
          <path
            className="workflow-path workflow-path-1"
            d="M92 185 C170 185 162 112 242 112"
            fill="none"
            stroke="#00f0ff"
            strokeDasharray="10 18"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            className="workflow-path workflow-path-2"
            d="M335 138 C385 170 390 185 430 185"
            fill="none"
            stroke="#00f0ff"
            strokeDasharray="10 18"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            className="workflow-path workflow-path-3"
            d="M512 170 C532 138 535 105 560 86"
            fill="none"
            stroke="#00f0ff"
            strokeDasharray="10 18"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            className="workflow-path workflow-path-4"
            d="M512 206 C536 222 535 250 560 266"
            fill="none"
            stroke="#00f0ff"
            strokeDasharray="10 18"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <circle className="workflow-packet workflow-packet-1" r="4" fill="#00f0ff">
            <animateMotion dur="3.2s" repeatCount="indefinite" path="M92 185 C170 185 162 112 242 112" />
          </circle>
          <circle className="workflow-packet workflow-packet-2" r="4" fill="#00f0ff">
            <animateMotion begin="0.7s" dur="3.2s" repeatCount="indefinite" path="M335 138 C385 170 390 185 430 185" />
          </circle>
          <circle className="workflow-packet workflow-packet-3" r="4" fill="#00f0ff">
            <animateMotion begin="1.3s" dur="3.2s" repeatCount="indefinite" path="M512 170 C532 138 535 105 560 86" />
          </circle>
          <circle className="workflow-packet workflow-packet-4" r="4" fill="#00f0ff">
            <animateMotion begin="1.55s" dur="3.2s" repeatCount="indefinite" path="M512 206 C536 222 535 250 560 266" />
          </circle>
          <circle className="workflow-junction" cx="242" cy="112" r="4" fill="#00f0ff" />
          <circle className="workflow-junction" cx="430" cy="185" r="4" fill="#00f0ff" />
          <circle className="workflow-junction" cx="522" cy="86" r="4" fill="#00f0ff" />
          <circle className="workflow-junction" cx="522" cy="266" r="4" fill="#00f0ff" />
        </svg>

        {workflowNodes.map((node) => (
          <WorkflowNode key={node.label} node={node} />
        ))}

        <div className="absolute bottom-4 left-4 w-[196px] border border-border bg-card/95 p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Execution Log</span>
            <span className="workflow-status-dot h-2 w-2 bg-primary" />
          </div>
          <div className="space-y-2 font-mono text-[10px] text-muted-foreground">
            {workflowLog.map((item, index) => (
              <p key={item}>
                <span className={index === workflowLog.length - 1 ? 'text-[#00f0ff]' : 'text-[#00f0ff]'}>&gt;</span>{' '}
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#050505] p-4 sm:hidden">
        <div className="relative space-y-4">
          <div className="absolute bottom-16 left-6 top-8 w-px bg-[#3b494b]" />
          {workflowNodes.map((node, index) => {
            const Icon = node.icon
            return (
              <div
                className="workflow-mobile-step relative z-10 flex items-center gap-3"
                key={node.label}
                style={{ animationDelay: node.delay }}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center border bg-[#111317] ${
                    node.tone === 'brand'
                      ? 'border-[#00f0ff]/70 text-[#00f0ff]'
                      : 'border-[#00f0ff]/70 text-[#00f0ff]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div
                  className={`min-w-0 flex-1 border bg-[#111317] p-3 ${
                    node.tone === 'active'
                      ? 'border-[#00f0ff]'
                      : node.tone === 'brand'
                        ? 'border-[#00f0ff]/70'
                        : 'border-[#1f2229]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#e2e2e8]">
                      {node.label}
                    </h3>
                    <span className="workflow-status-dot h-2 w-2 rounded-full bg-[#00f0ff]" />
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-[#b9cacb]">{node.detail}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center bg-background overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_50%_50%,rgba(0,240,255,0.1)_0%,transparent_50%)]" />

      <div className="relative max-w-[1280px] mx-auto px-6 lg:px-8 pt-24 md:pt-20 lg:pt-16 pb-12">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-6 lg:space-y-8 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 border border-primary/60 bg-primary/10 px-3 py-1.5 sm:px-4 sm:py-2">
              <Star className="h-4 w-4 text-primary" />
              <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                4 WEEK HANDS-ON TRAINING
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight">
              BUILD REAL AI
              <span className="text-primary"> AUTOMATIONS.</span>
              <br />
              GET CERTIFIED.
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
              Master n8n automation and build powerful AI-powered workflows without coding.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/enroll"
                className="flex items-center justify-center gap-2 border border-primary bg-primary px-5 py-3 sm:px-6 sm:py-3 lg:px-8 lg:py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-foreground transition duration-150 hover:translate-y-[-1px] hover:shadow-lg w-full sm:w-auto"
              >
                Enroll Now — ₦8,000
              </Link>
              <button className="flex items-center justify-center gap-2 border border-primary bg-transparent px-5 py-3 sm:px-6 sm:py-3 lg:px-8 lg:py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-primary transition duration-150 hover:bg-primary/10 w-full sm:w-auto">
                <Play className="h-4 w-4" />
                Watch Preview
              </button>
            </div>
          </div>

          <div className="relative order-2 md:order-2 mt-8 md:mt-0">
            <N8nWorkflowPanel />
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  )
}

function InfoCards() {
  return (
    <section className="py-6 lg:py-8 bg-card">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:gap-6">
          <div className="border border-border bg-card/80 backdrop-blur-xl rounded-xl p-4 lg:p-6 text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">COHORT</div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Current Cohort</div>
          </div>
          <div className="border border-border bg-card/80 backdrop-blur-xl rounded-xl p-4 lg:p-6 text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">SEATS LEFT</div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">Remaining Seats</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatsSection() {
  return (
    <section className="py-4 sm:py-6 lg:py-8 bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="border border-border bg-card/80 backdrop-blur-xl rounded-xl p-3 sm:p-4 lg:p-6 text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-primary">{stat.value}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function EnrollmentSection() {
  return (
    <section className="py-6 sm:py-8 lg:py-12 bg-card">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 lg:gap-12">
          <div className="border border-border bg-background/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 xl:p-10">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-4 sm:mb-6">
              Enroll Now
            </h2>
            <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#00f0ff] mb-4 sm:mb-6">
              ₦8,000
            </div>
            
            <div className="space-y-2 sm:space-y-3 lg:space-y-4 mb-6 sm:mb-8">
              {enrollmentBenefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-[#00f0ff] flex-shrink-0" />
                  <span className="text-sm sm:text-base text-[#e2e2e8]">{benefit}</span>
                </div>
              ))}
            </div>
            
            <Link
              href="/enroll"
              className="flex items-center justify-center gap-2 w-full border border-primary bg-primary px-5 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-foreground transition duration-150 hover:translate-y-[-1px] hover:shadow-lg"
            >
              Enroll Now — ₦8,000
            </Link>
            
            <p className="text-center text-xs sm:text-sm text-[#b9cacb] mt-3 sm:mt-4">
              Secure payment powered by Paystack
            </p>
          </div>
          
          <div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#e2e2e8] mb-4 sm:mb-6 lg:mb-8">What You'll Get</h3>
            <div className="space-y-3 sm:space-y-4">
              {[
                { icon: Star, title: 'Lifetime Access', description: 'Access all content forever' },
                { icon: Rocket, title: 'Real Projects', description: 'Build 10+ production workflows' },
                { icon: Users, title: 'Community', description: 'Join a network of automation experts' },
                { icon: GraduationCap, title: 'Certificate', description: 'Verified credential from Moon Space Network' },
                { icon: MessageCircle, title: 'Support', description: 'Direct access to instructors' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 sm:gap-4 border border-border bg-card/80 backdrop-blur-xl rounded-xl p-4 sm:p-5 hover:border-primary/50 transition-all duration-300"
                  >
                    <div className="flex h-10 w-10 items-center justify-center border border-primary/60 bg-primary/10 rounded-lg flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#e2e2e8] text-sm sm:text-base">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-[#b9cacb] mt-1">{item.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ScholarshipSection() {
  return (
    <section className="py-4 sm:py-6 lg:py-8 bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="border border-border bg-card/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 xl:p-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 lg:gap-8">
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-2">
                Need Financial Support?
              </h2>
              <p className="text-sm sm:text-base text-[#b9cacb]">
                Apply for our scholarship programme and get trained at a reduced rate.
              </p>
            </div>
            <Link
              href="/scholarship/apply"
              className="flex items-center justify-center gap-2 border border-purple-500 bg-purple-500/10 px-5 py-3 sm:px-6 sm:py-3 lg:px-8 lg:py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-purple-400 transition duration-150 hover:bg-purple-500/20 whitespace-nowrap"
            >
              Apply For Scholarship
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function CurriculumSection() {
  return (
    <section id="curriculum" className="py-6 sm:py-8 lg:py-12 bg-card">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Curriculum
          </h2>
          <p className="text-sm sm:text-base text-[#b9cacb] max-w-2xl mx-auto">
            A structured 4-week program designed to take you from beginner to certified automation expert
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {curriculumWeeks.map((week) => (
            <div
              key={week.step}
              className={`border ${
                week.active 
                  ? 'border-[#00f0ff] bg-[#00f0ff]/5' 
                  : 'border-[#1f2229] bg-[#050505]/80'
              } backdrop-blur-xl rounded-2xl p-4 sm:p-5 lg:p-6 hover:border-[#00f0ff]/50 transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                  week.active 
                    ? 'bg-[#00f0ff] text-[#00363a]' 
                    : 'bg-[#1f2229] text-[#00f0ff]'
                }`}>
                  <span className="text-lg sm:text-xl font-bold">{week.step}</span>
                </div>
                {week.active && (
                  <span className="px-2 py-1 bg-[#00f0ff]/10 text-[#00f0ff] text-xs font-mono uppercase tracking-wider">
                    Current
                  </span>
                )}
              </div>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#00f0ff] mb-2">
                {week.phase}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#e2e2e8] mb-2">{week.title}</h3>
              <p className="text-sm text-[#b9cacb] mb-3 sm:mb-4">{week.body}</p>
              <ul className="space-y-1 sm:space-y-2">
                {week.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-[#b9cacb]">
                    <CheckCircle className="h-3 w-3 text-[#00f0ff] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section id="tools" className="py-6 sm:py-8 lg:py-12 bg-[#050505]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e2e2e8] mb-3 sm:mb-4">
            What You'll Learn
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {featureIcons.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-4 sm:p-5 lg:p-6 hover:border-[#00f0ff]/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.1)]"
              >
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center border border-[#00f0ff]/60 bg-[#00f0ff]/10 rounded-xl mb-3 sm:mb-4">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-[#00f0ff]" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-[#e2e2e8] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#b9cacb]">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  return (
    <section className="py-6 sm:py-8 lg:py-12 bg-[#0c0e12]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e2e2e8] mb-3 sm:mb-4">
            What Our Students Say
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {studentTestimonials.map((testimonial) => (
            <StudentTestimonialCard
              key={testimonial.name}
              name={testimonial.name}
              school={testimonial.school}
              rating={testimonial.rating}
              testimonial={testimonial.testimonial}
              verified={testimonial.verified}
              image={testimonial.image}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function SocialProofSection() {
  return (
    <section className="py-6 sm:py-8 lg:py-12 bg-[#050505]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <LiveActivityFeed />
        </div>
      </div>
    </section>
  )
}

function TrustBadgesSection() {
  return (
    <section className="py-4 sm:py-6 lg:py-8 bg-[#0c0e12]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4">
          {trustBadges.map((badge) => {
            const Icon = badge.icon
            return (
              <div
                key={badge.text}
                className="flex items-center gap-2 border border-[#1f2229] bg-[#050505]/80 backdrop-blur-xl rounded-full px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5"
              >
                <Icon className="h-4 w-4 text-[#00f0ff]" />
                <span className="text-xs sm:text-sm text-[#e2e2e8]">{badge.text}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function ContactSection() {
  return (
    <section className="py-6 sm:py-8 lg:py-12 bg-[#050505]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e2e2e8] mb-3 sm:mb-4">
            Get In Touch
          </h2>
          <p className="text-sm sm:text-base text-[#b9cacb]">
            Have questions? We'd love to hear from you.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          <a
            href={socialLinks.whatsapp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-6 hover:border-[#00f0ff]/50 transition-all duration-300 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center border border-[#00f0ff]/60 bg-[#00f0ff]/10 rounded-xl mx-auto mb-4">
              <MessageCircle className="h-6 w-6 text-[#00f0ff]" />
            </div>
            <h3 className="text-lg font-semibold text-[#e2e2e8] mb-2">WhatsApp</h3>
            <p className="text-sm text-[#b9cacb]">Chat with us directly</p>
          </a>
          
          <Link
            href="/contact"
            className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-6 hover:border-[#00f0ff]/50 transition-all duration-300 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center border border-[#00f0ff]/60 bg-[#00f0ff]/10 rounded-xl mx-auto mb-4">
              <Mail className="h-6 w-6 text-[#00f0ff]" />
            </div>
            <h3 className="text-lg font-semibold text-[#e2e2e8] mb-2">Email</h3>
            <p className="text-sm text-[#b9cacb]">Send us a message</p>
          </Link>
          
          <Link
            href="/partners"
            className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-6 hover:border-[#00f0ff]/50 transition-all duration-300 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center border border-[#00f0ff]/60 bg-[#00f0ff]/10 rounded-xl mx-auto mb-4">
              <Users className="h-6 w-6 text-[#00f0ff]" />
            </div>
            <h3 className="text-lg font-semibold text-[#e2e2e8] mb-2">Partners</h3>
            <p className="text-sm text-[#b9cacb]">Join our partner program</p>
          </Link>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-[#1f2229] bg-[#0c0e12] py-6 sm:py-8 lg:py-12">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 lg:mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="AutoLearn Spot"
                width={32}
                height={32}
              />
              <span className="font-mono text-sm font-semibold tracking-[0.1em] text-[#e2e2e8]">
                AutoLearn Spot
              </span>
            </div>
            <p className="text-sm text-[#b9cacb] mb-4">
              Master AI automation with hands-on training and get certified.
            </p>
            <div className="flex gap-3 flex-wrap">
              <SocialIcon
                label="Facebook"
                href={socialLinks.facebook.url}
              />
              <SocialIcon
                label="Instagram"
                href={socialLinks.instagram.url}
              />
              <SocialIcon
                label="LinkedIn"
                href={socialLinks.linkedin.url}
              />
              <SocialIcon
                label="YouTube"
                href={socialLinks.youtube.url}
              />
              <SocialIcon
                label="TikTok"
                href={socialLinks.tiktok.url}
              />
              <SocialIcon
                label="X (Twitter)"
                href={socialLinks.x.url}
              />
              <SocialIcon
                label="WhatsApp"
                href={socialLinks.whatsapp.url}
              />
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-[#e2e2e8] mb-4">Navigation</h3>
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm text-[#b9cacb] hover:text-[#00f0ff] transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-[#e2e2e8] mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-[#b9cacb] hover:text-[#00f0ff] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/partners" className="text-sm text-[#b9cacb] hover:text-[#00f0ff] transition-colors">
                  Partners
                </Link>
              </li>
              <li>
                <Link href="/scholarship" className="text-sm text-[#b9cacb] hover:text-[#00f0ff] transition-colors">
                  Scholarship
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-[#b9cacb] hover:text-[#00f0ff] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-[#1f2229] pt-8 text-center">
          <p className="text-sm text-[#b9cacb]">
            © 2026 AutoLearn Spot. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[#050505]">
      <Navigation />
      <WhatsAppChatModal variant="floating" />
      <AutolearnBot />
      <HeroSection />
      <InfoCards />
      <StatsSection />
      <EnrollmentSection />
      <ScholarshipSection />
      <CurriculumSection />
      <FeaturesSection />
      <TestimonialsSection />
      <SocialProofSection />
      <TrustBadgesSection />
      <FAQSection />
      <ContactSection />
      <Footer />
    </main>
  )
}