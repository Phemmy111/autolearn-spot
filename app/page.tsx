"use client";
import { useAuth } from '@clerk/nextjs';
import {
  Bot,
  BrainCircuit,
  Calendar,
  CheckCircle,
  CreditCard,
  Database,
  GraduationCap,
  GitFork,
  Infinity,
  Mail,
  MessageCircle,
  Play,
  Plus,
  Rocket,
  Send,
  Server,
  Sheet,
  Sparkles,
  Terminal,
  Trophy,
  UserCheck,
  Webhook,
  Wrench,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { EnrollModal } from '@/components/enroll-modal'
import { PreviewVideoModal } from '@/components/preview-video-modal'
import { SectionFadeController } from '@/components/section-fade-controller'
import { ThreeAiBackground } from '@/components/three-ai-background'
import { ThreeAutomationField } from '@/components/three-automation-field'
import { ToolsCarousel } from '@/components/tools-carousel'
import { WhatsAppChatModal } from '@/components/whatsapp-chat-modal'

const navItems = ['Curriculum', 'Tools', 'Why', 'FAQ'];

const stats = [
  ['10+', 'Real workflows deployed'],
  ['12', 'Live hands-on sessions'],
  ['4 weeks', 'Program duration'],
  ['100%', 'Practical, no fluff'],
]

const infoCards = [
  {
    icon: Calendar,
    title: 'Schedule',
    body: 'Mon, Wed, Fri — 30 mins each session',
  },
  {
    icon: Trophy,
    title: 'Certificate',
    body: 'Issued by Moon Space Network on completion',
  },
  {
    icon: CreditCard,
    title: 'Investment',
    body: '₦3,000 — Full access, all 12 sessions',
  },
]

const curriculumWeeks = [
  {
    step: '01',
    title: 'n8n Fundamentals',
    phase: 'WEEK_1',
    body: 'Build your first workflow from scratch.',
    items: ['Theory + Account Setup', 'Form -> Email Automation', 'Add Google Sheets'],
  },
  {
    step: '02',
    title: 'AI-Powered Workflows',
    phase: 'WEEK_2',
    body: 'Connect ChatGPT to your automations.',
    items: ['AI Telegram Bot', 'AI Email Auto-Responder', 'AI Content Summarizer'],
  },
  {
    step: '03',
    title: 'Deploy & Scale',
    phase: 'WEEK_3',
    body: 'Take your workflows live on Railway.',
    items: ['Deploy n8n on Railway', 'AI Customer Support Bot', 'Lead Capture + AI Qualifier'],
  },
  {
    step: '04',
    title: 'Capstone Project',
    phase: 'WEEK_4',
    body: 'Build a full product and get certified.',
    items: ['Social Media Content Bot', 'Capstone Build Day', 'Presentation + Certificate'],
    active: true,
  },
]

const whyCards = [
  {
    icon: CheckCircle,
    title: '100% Practical',
    body: 'No slides and lectures. Every session is a live workflow you build and deploy.',
  },
  {
    icon: Sparkles,
    title: 'AI-Native Training',
    body: 'ChatGPT, OpenRouter, Claude — you learn how to wire AI into real business workflows from Day 4.',
  },
  {
    icon: Rocket,
    title: 'Deploy Live in Week 3',
    body: 'Your automation goes to production on Railway. Real URL. Real users. Not a sandbox toy.',
  },
  {
    icon: GraduationCap,
    title: 'MSN Certificate',
    body: 'Earn a verified certificate from Moon Space Network to display on LinkedIn and your portfolio.',
  },
  {
    icon: UserCheck,
    title: 'Direct Instructor Access',
    body: 'You get direct Q&A time with Femi. No generic support queues. Get unblocked fast.',
  },
  {
    icon: Infinity,
    title: 'Lifetime Recordings',
    body: 'Miss a session? Replay all 12 recorded sessions forever at your own pace.',
  },
]

const faqs = [
  {
    question: 'Do I need coding experience?',
    answer:
      'No. AutoLearn Spot is 100% beginner-friendly. n8n is visual — no coding required. Many learners had zero technical background before joining.',
  },
  {
    question: 'What if I miss a session?',
    answer:
      'All 12 sessions are recorded and available for lifetime access. You can catch up anytime, though live sessions offer real-time Q&A.',
  },
  {
    question: 'Is the certificate recognized?',
    answer:
      'Yes. The certificate is issued by Moon Space Network, a trusted organization. You can display it on LinkedIn and professional profiles.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We use Paystack for secure payments — Visa, Mastercard, bank transfer, or USSD. All transactions are encrypted.',
  },
  {
    question: 'Can I get a refund?',
    answer: "We offer a full refund within the first 3 days if you're not satisfied. No questions asked.",
  },
  {
    question: 'How long do I have access?',
    answer: 'Lifetime. Once enrolled, you have access to all 12 recordings and any future updates to the curriculum.',
  },
]

const instructorStats = [
  { icon: Wrench, title: '10+ Production Projects' },
  { icon: Server, title: 'Flutter & React Expert' },
  { icon: BrainCircuit, title: 'AI Integration Specialist' },
  { icon: GraduationCap, title: 'Educator & Trainer' },
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
    icon: Sparkles,
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

function CornerButton({
  children,
  variant = 'primary',
  className = '',
}: {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  className?: string
}) {
  return (
    <button
      className={
        variant === 'primary'
          ? `corner-accent blueprint-cta relative inline-flex items-center justify-center gap-2 overflow-hidden border border-cyan-300 bg-[#00f0ff] px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#00363a] transition duration-150 hover:translate-y-[-1px] hover:shadow-[0_0_0_1px_rgba(0,240,255,0.45)] ${className}`
          : `inline-flex items-center justify-center gap-2 border border-cyan-300 bg-transparent px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#00f0ff] transition duration-150 hover:bg-[#00f0ff]/10 ${className}`
      }
    >
      {children}
    </button>
  )
}

const primaryCtaClass =
  'corner-accent blueprint-cta relative inline-flex items-center justify-center gap-2 overflow-hidden border border-cyan-300 bg-[#00f0ff] px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#00363a] transition duration-150 hover:translate-y-[-1px] hover:shadow-[0_0_0_1px_rgba(0,240,255,0.45)]'

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
    <div className="relative z-10 w-full max-w-[620px] border border-[#1f2229] bg-[#0c0e12]">
      <div className="flex h-8 items-center justify-between border-b border-[#1f2229] bg-[#1a1c20] px-4">
        <span className="font-mono text-[10px] text-[#b9cacb]">live_workflow.n8n</span>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#333539]" />
          <span className="h-2 w-2 rounded-full bg-[#333539]" />
          <span className="h-2 w-2 rounded-full bg-[#333539]" />
        </div>
      </div>

      <div className="flex h-10 items-center justify-between border-b border-[#1f2229] bg-[#111317] px-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#00f0ff]">n8n canvas</span>
          <span className="hidden h-4 w-px bg-[#1f2229] sm:block" />
          <span className="hidden font-mono text-[10px] text-[#b9cacb] sm:block">real training workflow / active</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-6 w-6 items-center justify-center border border-[#1f2229] text-[#00f0ff]">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <span className="workflow-running border border-[#00f0ff]/70 bg-[#00f0ff]/10 px-2 py-1 font-mono text-[10px] text-[#00f0ff]">
            RUNNING
          </span>
        </div>
      </div>

      <div className="relative hidden min-h-[360px] overflow-hidden bg-[#050505] sm:block">
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(#1f2229_1px,transparent_1px),linear-gradient(90deg,#1f2229_1px,transparent_1px)] [background-size:32px_32px]" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 620 360" preserveAspectRatio="none" aria-hidden="true">
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

        <div className="absolute bottom-4 left-4 w-[196px] border border-[#1f2229] bg-[#111317]/95 p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#b9cacb]">Execution Log</span>
            <span className="workflow-status-dot h-2 w-2 bg-[#00f0ff]" />
          </div>
          <div className="space-y-2 font-mono text-[10px] text-[#b9cacb]">
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
                    <h3 className="truncate font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#e2e2e8]">
                      {node.label}
                    </h3>
                    <span className="workflow-status-dot h-2 w-2 shrink-0 rounded-full bg-[#00f0ff]" />
                  </div>
                  <p className="mt-1 truncate font-mono text-[10px] text-[#b9cacb]">{node.detail}</p>
                </div>
                {index < workflowNodes.length - 1 ? (
                  <span className="workflow-mobile-packet absolute -bottom-3 left-[21px] h-2 w-2 rotate-45 bg-[#00f0ff]" />
                ) : null}
              </div>
            )
          })}
        </div>

        <div className="mt-4 border border-[#1f2229] bg-[#111317]/95 p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#b9cacb]">Execution Log</span>
            <span className="workflow-status-dot h-2 w-2 bg-[#00f0ff]" />
          </div>
          <div className="space-y-2 font-mono text-[10px] text-[#b9cacb]">
            {workflowLog.map((item, index) => (
              <p key={item}>
                <span className={index === workflowLog.length - 1 ? 'text-[#00f0ff]' : 'text-[#00f0ff]'}>&gt;</span>{' '}
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LogicFlow() {
  return (
    <div className="relative min-h-[220px] w-full overflow-hidden border border-[#1f2229] bg-[#050505] p-4 sm:min-h-[260px]">
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(#1f2229_1px,transparent_1px),linear-gradient(90deg,#1f2229_1px,transparent_1px)] [background-size:28px_28px]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 260" preserveAspectRatio="none" aria-hidden="true">
        <path d="M90 130 C160 130 170 92 236 92" fill="none" stroke="#3b494b" strokeWidth="1.5" />
        <path d="M330 100 C395 100 405 130 462 130" fill="none" stroke="#3b494b" strokeWidth="1.5" />
        <path d="M536 105 C580 72 620 58 670 58" fill="none" stroke="#3b494b" strokeWidth="1.5" />
        <path d="M536 130 C590 130 615 130 670 130" fill="none" stroke="#3b494b" strokeWidth="1.5" />
        <path d="M536 155 C580 188 620 202 670 202" fill="none" stroke="#3b494b" strokeWidth="1.5" />
        <path className="workflow-path" d="M90 130 C160 130 170 92 236 92" fill="none" stroke="#00f0ff" strokeDasharray="8 16" strokeLinecap="round" strokeWidth="2" />
        <path className="workflow-path workflow-path-2" d="M330 100 C395 100 405 130 462 130" fill="none" stroke="#00f0ff" strokeDasharray="8 16" strokeLinecap="round" strokeWidth="2" />
        <path className="workflow-path workflow-path-3" d="M536 105 C580 72 620 58 670 58" fill="none" stroke="#00f0ff" strokeDasharray="8 16" strokeLinecap="round" strokeWidth="2" />
        <path className="workflow-path workflow-path-4" d="M536 130 C590 130 615 130 670 130" fill="none" stroke="#00f0ff" strokeDasharray="8 16" strokeLinecap="round" strokeWidth="2" />
        <path className="workflow-path workflow-path-3" d="M536 155 C580 188 620 202 670 202" fill="none" stroke="#00f0ff" strokeDasharray="8 16" strokeLinecap="round" strokeWidth="2" />
        <circle className="workflow-packet workflow-packet-1" r="4" fill="#00f0ff">
          <animateMotion dur="3.2s" repeatCount="indefinite" path="M90 130 C160 130 170 92 236 92" />
        </circle>
        <circle className="workflow-packet workflow-packet-2" r="4" fill="#00f0ff">
          <animateMotion begin="0.6s" dur="3.2s" repeatCount="indefinite" path="M330 100 C395 100 405 130 462 130" />
        </circle>
        <circle className="workflow-packet workflow-packet-3" r="4" fill="#00f0ff">
          <animateMotion begin="1.1s" dur="3.2s" repeatCount="indefinite" path="M536 105 C580 72 620 58 670 58" />
        </circle>
        <circle className="workflow-packet workflow-packet-4" r="4" fill="#00f0ff">
          <animateMotion begin="1.35s" dur="3.2s" repeatCount="indefinite" path="M536 130 C590 130 615 130 670 130" />
        </circle>
        <circle className="workflow-packet workflow-packet-3" r="4" fill="#00f0ff">
          <animateMotion begin="1.6s" dur="3.2s" repeatCount="indefinite" path="M536 155 C580 188 620 202 670 202" />
        </circle>
      </svg>

      <div className="relative z-10 grid min-h-[188px] grid-cols-2 gap-3 sm:min-h-[228px] sm:grid-cols-5 sm:items-center">
        <div className="flex h-20 flex-col items-center justify-center border border-[#1f2229] bg-[#111317] font-mono text-[10px] uppercase tracking-[0.08em] text-[#e2e2e8]">
          <Webhook className="mb-2 h-5 w-5 text-[#00f0ff]" />
          Form Trigger
        </div>
        <div className="flex h-24 flex-col items-center justify-center border border-[#00f0ff] bg-[#00f0ff]/5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#00f0ff] shadow-[0_0_18px_rgba(0,240,255,0.18)]">
          <BrainCircuit className="mb-2 h-6 w-6" />
          AI Agent
          <span className="mt-1 text-[9px] text-[#b9cacb]">score + classify</span>
        </div>
        <div className="flex h-20 flex-col items-center justify-center border border-[#1f2229] bg-[#111317] font-mono text-[10px] uppercase tracking-[0.08em] text-[#e2e2e8]">
          <GitFork className="mb-2 h-5 w-5 text-[#00f0ff]" />
          Route
        </div>
        <div className="col-span-2 grid grid-cols-1 gap-2 sm:col-span-2">
          <div className="flex h-12 items-center gap-3 border border-[#1f2229] bg-[#111317] px-4 font-mono text-[10px] uppercase tracking-[0.08em] text-[#e2e2e8]">
            <Mail className="h-4 w-4 text-[#00f0ff]" />
            Gmail Reply
          </div>
          <div className="flex h-12 items-center gap-3 border border-[#1f2229] bg-[#111317] px-4 font-mono text-[10px] uppercase tracking-[0.08em] text-[#e2e2e8]">
            <Sheet className="h-4 w-4 text-[#00f0ff]" />
            Save to Sheets
          </div>
          <div className="flex h-12 items-center gap-3 border border-[#1f2229] bg-[#111317] px-4 font-mono text-[10px] uppercase tracking-[0.08em] text-[#e2e2e8]">
            <MessageCircle className="h-4 w-4 text-[#00f0ff]" />
            WhatsApp Notify
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  const { isSignedIn } = useAuth()

  return (
    <main className="page-shell min-h-screen bg-[#111317] text-[#e2e2e8]">
      <SectionFadeController />
      <ThreeAiBackground />
      <nav className="page-nav sticky top-0 z-50 mx-auto flex h-16 max-w-[1440px] items-center justify-between border-b border-[#3b494b] bg-[#111317]/95 px-4 backdrop-blur sm:px-6">
        <a className="flex items-center gap-2 font-mono text-sm font-bold uppercase text-white" href="#">
          <span className="text-[#00f0ff]">//</span>
          <span className="underline decoration-[#b9cacb] decoration-2 underline-offset-2">AutoLearn Spot</span>
        </a>
        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => {
            if (item === 'Live Class') {
              return (
                <Link
                  key={item}
                  href="/live-class"
                  className="px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[#b9cacb] transition hover:bg-[#1a1c20] hover:text-[#dbfcff]"
                >
                  {item}
                </Link>
              );
            }
            return (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '')}`}
                className="px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[#b9cacb] transition hover:bg-[#1a1c20] hover:text-[#dbfcff]"
              >
                {item}
              </a>
            );
          })}
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={isSignedIn ? "/dashboard" : "/sign-in"}
            className="font-mono text-[10px] sm:text-xs font-semibold uppercase text-[#b9cacb] hover:text-[#00f0ff] transition-colors"
          >
            {isSignedIn ? 'Student Dashboard' : 'Student Login'}
          </Link>
          <EnrollModal className={`${primaryCtaClass} page-animate page-delay-4`}>Enroll Now - ₦3,000</EnrollModal>
        </div>
      </nav>

      <section className="section-fade mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-4 py-16 sm:px-6 md:grid-cols-12 md:py-28">
        <div className="relative z-10 flex flex-col justify-center border-[#1f2229] md:col-span-6 md:border-r md:pr-8">
          <h1 className="page-animate page-delay-1 max-w-2xl font-heading text-4xl font-bold uppercase leading-[1.08] tracking-normal text-[#e2e2e8] sm:text-5xl lg:text-6xl">
            <span className="typewriter-headline" aria-label="Build Real AI Automations. Get Certified.">
              <span className="typewriter-line typewriter-line-1">Build Real AI</span>
              <span className="typewriter-line typewriter-line-2">Automations.</span>
              <span className="typewriter-line typewriter-line-3">Get Certified.</span>
            </span>
          </h1>
          <p className="page-animate page-delay-2 mt-6 max-w-xl font-mono text-sm leading-6 text-[#b9cacb]">
            A 4-week, hands-on n8n automation training. No theory overload — every session ends with a working,
            deployable workflow you built yourself.
          </p>
          <div className="page-animate page-delay-3 mt-10 flex flex-wrap gap-4">
            <EnrollModal className={primaryCtaClass}>
              <Terminal className="h-4 w-4" />
              Start Learning - ₦3,000
            </EnrollModal>
            <PreviewVideoModal vimeoVideoId="1209374969" className="corner-accent relative inline-flex items-center justify-center gap-2 overflow-hidden border border-[#3b494b] bg-[#0c0e12] px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#e2e2e8] transition duration-150 hover:bg-[#1a1c20] hover:text-[#00f0ff] hover:border-[#00f0ff]">
               <Play className="h-4 w-4" />
               Watch Preview
            </PreviewVideoModal>
          </div>
          <div className="page-animate page-delay-4 mt-16 flex items-center gap-6 text-[#b9cacb]/70">
            <div>
              <span className="block font-mono text-[10px] uppercase tracking-[0.1em]">COHORT</span>
              <div className="mt-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#00f0ff]" />
                <span className="font-mono text-[10px]">JULY 13</span>
              </div>
            </div>
            <div className="h-8 w-px bg-[#1f2229]" />
            <div>
              <span className="block font-mono text-[10px] uppercase tracking-[0.1em]">SEATS</span>
              <span className="mt-2 block font-mono text-[10px]">15 AVAILABLE</span>
            </div>
          </div>
        </div>

        <div className="page-animate page-delay-5 relative flex items-center justify-center p-0 md:col-span-6 md:p-8">
          <div className="hero-aura pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(40,42,46,0.35),rgba(17,19,23,0.65),#111317_70%)]" />
          <ThreeAutomationField />
          <N8nWorkflowPanel />
        </div>
      </section>

      <section
        className="section-fade mx-auto grid max-w-[1440px] grid-cols-2 gap-4 border-t border-[#1f2229] px-4 py-12 sm:px-6 md:grid-cols-4"
        id="stats"
      >
        {stats.map(([value, label], index) => (
          <div className="page-animate border border-[#1f2229] bg-[#0c0e12] p-5 text-center" key={label} style={{ animationDelay: `${0.08 + index * 0.08}s` }}>
            <div className="font-heading text-3xl font-bold text-[#00f0ff]">{value}</div>
            <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[#b9cacb]">{label}</div>
          </div>
        ))}
      </section>

      <section
        className="section-fade mx-auto max-w-[1440px] border-t border-[#1f2229] px-4 py-20 sm:px-6 md:py-24"
        id="curriculum"
      >
        <div className="page-animate mb-12 text-center">
          <span className="border border-[#00f0ff]/60 bg-[#00f0ff]/10 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#00f0ff]">
            4-week curriculum
          </span>
          <h2 className="mt-6 font-heading text-3xl font-semibold tracking-normal text-[#e2e2e8]">
            What You&apos;ll Build
          </h2>
          <p className="mx-auto mt-3 max-w-2xl font-mono text-sm leading-6 text-[#b9cacb]">
            Every session is 100% practical. You leave with a working workflow, not just notes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {curriculumWeeks.map((week, index) => {
            return (
              <article
                className="page-animate group border border-[#1f2229] bg-[#0c0e12] p-6 transition hover:border-[#00f0ff] hover:shadow-[0_0_15px_rgba(0,240,255,0.25)]"
                style={{ animationDelay: `${0.1 + index * 0.12}s` }}
                key={week.title}
              >
                <div className="mb-12 flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center border border-[#00f0ff]/60 bg-[#00f0ff]/10 font-mono text-xs text-[#00f0ff]">
                    {week.step}
                  </span>
                  <span className="font-mono text-[10px] text-[#b9cacb]">{week.phase}</span>
                </div>
                <h3 className="font-heading text-xl font-semibold tracking-normal text-[#e2e2e8]">{week.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#b9cacb]">{week.body}</p>
                <ul className="mt-8 space-y-3 font-mono text-xs text-[#b9cacb]">
                  {week.items.map((item) => (
                    <li className="flex gap-2" key={item}>
                      <span className="text-[#00f0ff]">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {infoCards.map((card, index) => {
            const Icon = card.icon
            return (
              <article className="page-animate border border-[#1f2229] bg-[#050505] p-5" key={card.title} style={{ animationDelay: `${0.2 + index * 0.1}s` }}>
                <div className="flex items-start gap-4">
                  <Icon className="h-6 w-6 text-[#00f0ff]" />
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-[#e2e2e8]">{card.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#b9cacb]">{card.body}</p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section
        className="section-fade mx-auto max-w-[1440px] border-t border-[#1f2229] px-4 py-20 sm:px-6 md:py-24"
        id="tools"
      >
        <div className="page-animate mb-12 text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-normal text-[#e2e2e8]">Tools You&apos;ll Master</h2>
          <p className="mx-auto mt-3 max-w-2xl font-mono text-sm leading-6 text-[#b9cacb]">
            From triggering workflows to deploying production bots — you&apos;ll use the same tools professionals use
            every day.
          </p>
        </div>

        <ToolsCarousel />
      </section>

      <section
        className="section-fade mx-auto max-w-[1440px] border-t border-[#1f2229] px-4 py-20 sm:px-6 md:py-24"
        id="why"
      >
        <div className="page-animate mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="font-heading text-3xl font-semibold tracking-normal text-[#e2e2e8]">
              Why AutoLearn Spot?
            </h2>
            <p className="mt-3 max-w-2xl font-mono text-sm leading-6 text-[#b9cacb]">
              Core learning advantages engineered for practical, beginner-friendly, outcome-focused automation.
            </p>
          </div>
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#00f0ff]">
            ALS_STACK_V2
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <article className="page-animate border border-[#1f2229] bg-[#0c0e12]/95 p-6 md:col-span-4">
            <div className="flex items-start justify-between">
              <CheckCircle className="h-8 w-8 text-[#00f0ff]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#5d5f63]">MOD_01</span>
            </div>
            <h3 className="mt-16 font-heading text-xl font-semibold text-[#e2e2e8]">100% Practical</h3>
            <p className="mt-3 text-sm leading-6 text-[#b9cacb]">
              No slides and lectures. Every session is a live workflow you build and deploy.
            </p>
            <div className="mt-12 space-y-2 border-t border-[#1f2229] pt-3 font-mono text-[11px] text-[#b9cacb]">
              <div className="flex justify-between gap-4 border-b border-[#1f2229] pb-2">
                <span>Session Format</span>
                <span className="text-[#e2e2e8]">Live Builds</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Outcome Focus</span>
                <span className="text-[#e2e2e8]">Deployable</span>
              </div>
            </div>
          </article>

          <article className="page-animate relative overflow-hidden border border-[#1f2229] bg-[#0c0e12]/95 p-6 md:col-span-8">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-2/3 bg-[linear-gradient(90deg,rgba(0,240,255,0),rgba(0,240,255,0.45))]" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <Sparkles className="h-8 w-8 text-[#00f0ff]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#b9cacb]">MOD_02</span>
              </div>
              <h3 className="mt-20 max-w-xl font-heading text-2xl font-semibold text-[#e2e2e8]">
                AI-Native Training
              </h3>
              <p className="mt-4 max-w-xl text-base leading-7 text-[#b9cacb]">
                ChatGPT, OpenRouter, Claude — you learn how to wire AI into real business workflows from Day 4.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {['ChatGPT', 'OpenRouter', 'Claude', 'Real Workflows'].map((tag) => (
                  <span
                    className="border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#00f0ff]"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </article>

          <article className="page-animate grid grid-cols-1 gap-6 border border-[#1f2229] bg-[#0c0e12]/95 p-6 md:col-span-12 md:grid-cols-12 md:items-center">
            <div className="md:col-span-4">
              <div className="flex items-start justify-between">
                <Rocket className="h-8 w-8 text-[#00f0ff]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#5d5f63]">MOD_03</span>
              </div>
              <h3 className="mt-12 font-heading text-2xl font-semibold text-[#e2e2e8]">Deploy Live in Week 3</h3>
              <p className="mt-3 text-sm leading-6 text-[#b9cacb]">
                Your automation goes to production on Railway. Real URL. Real users. Not a sandbox toy.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-2 font-mono text-[11px] text-[#b9cacb] sm:grid-cols-3 md:grid-cols-1">
                <span className="border border-[#1f2229] px-3 py-2">MSN Certificate</span>
                <span className="border border-[#1f2229] px-3 py-2">Direct Instructor Access</span>
                <span className="border border-[#1f2229] px-3 py-2">Lifetime Recordings</span>
              </div>
            </div>
            <div className="border border-[#1f2229] bg-[#050505] p-6 md:col-span-8">
              <LogicFlow />
            </div>
          </article>
        </div>
      </section>

      <section className="section-fade mx-auto grid max-w-[1440px] grid-cols-1 gap-8 border-t border-[#1f2229] px-4 py-20 sm:px-6 md:grid-cols-12 md:py-24">
        <div className="page-animate md:col-span-5">
          <div className="border border-[#1f2229] bg-[#050505] p-6">
            <div className="relative aspect-square overflow-hidden border border-[#3b494b] bg-[#050505]">
              <Image
                alt="Femi Adeleke"
                className="h-full w-full object-cover"
                fill
                priority={false}
                sizes="(min-width: 768px) 40vw, 100vw"
                src="/femi-headshot.webp"
              />
            </div>
          </div>
        </div>
        <div className="page-animate md:col-span-7">
          <span className="border border-[#00f0ff]/60 bg-[#00f0ff]/10 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#00f0ff]">
            Your instructor
          </span>
          <h2 className="mt-6 font-heading text-3xl font-semibold tracking-normal text-[#e2e2e8]">Meet Femi Adeleke</h2>
          <p className="mt-5 text-sm leading-7 text-[#b9cacb]">
            I&apos;m a full-stack developer and automation engineer based in Ibadan, Nigeria. I specialize in building
            production-grade n8n workflows, connecting LLMs to real business applications, and AI-powered solutions.
          </p>
          <p className="mt-4 text-sm leading-7 text-[#b9cacb]">
            AutoLearn Spot is my first formal training program — and that&apos;s your advantage. You get direct access to
            me, real-time problem-solving, and curriculum built from workflows I&apos;m deploying right now.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {instructorStats.map((item) => {
              const Icon = item.icon
              return (
                <div className="border border-[#1f2229] bg-[#0c0e12] p-4" key={item.title}>
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-[#00f0ff]" />
                    <span className="font-mono text-xs font-semibold text-[#e2e2e8]">{item.title}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section
        className="section-fade mx-auto max-w-[1440px] border-t border-[#1f2229] px-4 py-20 sm:px-6 md:py-24"
        id="faq"
      >
        <div className="page-animate mb-12 text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-normal text-[#e2e2e8]">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 font-mono text-sm text-[#b9cacb]">Got questions? We&apos;ve got answers.</p>
        </div>
        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map((item, index) => (
            <details
              className="page-animate group border border-[#1f2229] bg-[#0c0e12]"
              key={item.question}
              style={{ animationDelay: `${0.08 + index * 0.06}s` }}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 marker:content-none">
                <h3 className="font-mono text-sm font-semibold text-[#e2e2e8]">{item.question}</h3>
                <span className="shrink-0 text-[#00f0ff] transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <div className="border-t border-[#1f2229] px-5 pb-5 pt-4">
                <p className="text-sm leading-6 text-[#b9cacb]">{item.answer}</p>
              </div>
            </details>
          ))}
          <div className="page-animate border border-[#1f2229] bg-[#050505] p-6 text-center">
            <p className="font-mono text-sm text-[#b9cacb]">Still have questions?</p>
            <WhatsAppChatModal />
          </div>
        </div>
      </section>

      <footer className="section-fade page-animate mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 border-t border-[#3b494b] px-4 py-8 sm:px-6 md:flex-row">
        <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#dbfcff]">
          ©2026 AUTOLEARN_SPOT // NEXT_COHORT_JULY_13
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {[
            { label: 'Curriculum', id: 'curriculum' },
            { label: 'Tools', id: 'tools' },
            { label: 'Why Autolearn', id: 'why' },
            { label: 'FAQ', id: 'faq' }
          ].map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#5d5f63] underline decoration-[#00f0ff] underline-offset-4 transition hover:text-[#dbfcff]"
            >
              {link.label}
            </a>
          ))}
        </div>
      </footer>
    </main>
  )
}
