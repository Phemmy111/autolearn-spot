import {
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
import { HeroSection } from './HeroSection'
import { EnrollmentSection } from './EnrollmentSection'
import { CohortAnnouncementStrip } from '@/components/CohortAnnouncementStrip'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { AnimatedInfoCards } from './components/AnimatedInfoCards'
import { AnimatedStatsSection } from './components/AnimatedStatsSection'
import { AnimatedScholarshipSection } from './components/AnimatedScholarshipSection'
import { AnimatedCurriculumSection } from './components/AnimatedCurriculumSection'
import { AnimatedFeaturesSection } from './components/AnimatedFeaturesSection'
import { DynamicTestimonialsSection } from '@/components/dynamic-testimonials'
import { AnimatedSocialProofSection } from './components/AnimatedSocialProofSection'
import { AnimatedTrustBadgesSection } from './components/AnimatedTrustBadgesSection'
import { Footer } from '@/components/footer'
import { getPublicSettings } from '@/lib/public-settings'
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
    <div className="relative z-10 w-full border border-[#1f2229] bg-[#0c0e12] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,240,255,0.1)]">
      <div className="absolute inset-0 bg-[#00f0ff]/5 rounded-2xl blur-xl" />
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

      <div className="relative min-h-[300px] sm:min-h-[360px] overflow-hidden bg-[#050505]">
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(#1f2229_1px,transparent_1px),linear-gradient(90deg,#1f2229_1px,transparent_1px)] [background-size:32px_32px]" />
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

function InfoCards() {
  return <AnimatedInfoCards />;
}

function StatsSection() {
  return <AnimatedStatsSection />;
}

function ScholarshipSection() {
  return <AnimatedScholarshipSection />;
}

function CurriculumSection() {
  return <AnimatedCurriculumSection />;
}

function FeaturesSection() {
  return <AnimatedFeaturesSection />;
}

async function TestimonialsSection() {
  const settings = await getPublicSettings(['section_testimonials_enabled']);
  const sectionEnabled = settings.section_testimonials_enabled !== 'false' && settings.section_testimonials_enabled !== false;

  if (!sectionEnabled) {
    return null;
  }

  return (
    <section className="py-6 sm:py-8 lg:py-12 bg-[#050505]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e2e2e8] mb-3 sm:mb-4">
            What Our Students Say
          </h2>
          <p className="text-sm sm:text-base text-[#b9cacb] mb-6">
            Real experiences from AutoLearn Spot learners
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {studentTestimonials.map((testimonial) => (
            <StudentTestimonialCard key={testimonial.name} {...testimonial} />
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/testimonials"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#00f0ff] text-[#00363a] rounded-lg font-medium hover:bg-[#00f0ff]/90 transition-colors"
          >
            View All Testimonials
          </Link>
        </div>
      </div>
    </section>
  );
}

function SocialProofSection() {
  return <AnimatedSocialProofSection />;
}

function TrustBadgesSection() {
  return <AnimatedTrustBadgesSection />;
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

export default async function Page() {
  const settings = await getPublicSettings([
    'section_hero_enabled',
    'section_workflow_showcase_enabled',
    'section_features_enabled',
    'section_testimonials_enabled',
    'section_scholarship_enabled',
    'section_faq_enabled',
    'section_footer_enabled'
  ])

  const sectionEnabled = (key: string) => {
    const value = settings[key as keyof typeof settings]
    return value !== 'false' && value !== false
  }

  return (
    <main className="min-h-screen bg-[#050505]">
      <Navigation />
      <AnnouncementBanner />
      <CohortAnnouncementStrip />
      <WhatsAppChatModal variant="floating" />
      <AutolearnBot />
      {sectionEnabled('section_hero_enabled') && <HeroSection />}
      <InfoCards />
      <StatsSection />
      <EnrollmentSection />
      {sectionEnabled('section_scholarship_enabled') && <ScholarshipSection />}
      <CurriculumSection />
      {sectionEnabled('section_features_enabled') && <FeaturesSection />}
      {sectionEnabled('section_testimonials_enabled') && <TestimonialsSection />}
      <SocialProofSection />
      <TrustBadgesSection />
      {sectionEnabled('section_faq_enabled') && <FAQSection />}
      <ContactSection />
      {sectionEnabled('section_footer_enabled') && <Footer />}
    </main>
  )
}