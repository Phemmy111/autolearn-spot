import { getPublicSettings } from '@/lib/public-settings'
import { getPublishedProducts } from '@/lib/public-product-service'
import { MarketplaceNavigation } from '@/components/MarketplaceNavigation'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { WhatsAppChatModal } from '@/components/whatsapp-chat-modal'
import { AutolearnBot } from '@/components/autolearn-bot'
import FAQSection from '@/components/FAQSection'
import { Footer } from '@/components/footer'
import { StudentTestimonialCard } from '@/components/student-testimonial-card'
import { studentTestimonials } from '@/config/testimonials'
import { socialLinks } from '@/config/social'
import { MessageCircle, Mail, Users } from 'lucide-react'
import Link from 'next/link'

// New Phase 5A Marketplace components
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader'
import { MarketplaceHero } from '@/components/marketplace/MarketplaceHero'
import { MarketplaceProductGrid } from '@/components/marketplace/MarketplaceProductGrid'
import { FeatureStrip } from '@/components/marketplace/FeatureStrip'
import { TopSkillsGrid } from '@/components/marketplace/TopSkillsGrid'

import './page.css'

async function TestimonialsSection() {
  const settings = await getPublicSettings(['section_testimonials_enabled']);
  const sectionEnabled = settings.section_testimonials_enabled !== 'false' && settings.section_testimonials_enabled !== false;

  if (!sectionEnabled) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24 bg-gray-50 border-t border-neutral-300/50">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
            What Our Students Say
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 mb-6">
            Real experiences from AutoLearn Spot learners
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {studentTestimonials.map((testimonial) => (
            <StudentTestimonialCard key={testimonial.name} {...testimonial} />
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/testimonials"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-primary-foreground rounded-lg font-medium hover:bg-brand-primary-hover transition-colors"
          >
            View All Testimonials
          </Link>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section className="py-16 sm:py-24 bg-gray-50 border-t border-neutral-300/50">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
            Get In Touch
          </h2>
          <p className="text-sm sm:text-base text-neutral-600">
            Have questions? We'd love to hear from you.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <a
            href={socialLinks.whatsapp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-neutral-300/50 bg-gray-100 rounded-2xl p-6 hover:border-[#10b981]/50 transition-all duration-300 text-center shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center border border-[#10b981]/60 bg-gray-50/10 rounded-xl mx-auto mb-4">
              <MessageCircle className="h-6 w-6 text-[#10b981]" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">WhatsApp</h3>
            <p className="text-sm text-neutral-500">Chat with us directly</p>
          </a>
          
          <Link
            href="/contact"
            className="border border-neutral-300/50 bg-gray-100 rounded-2xl p-6 hover:border-[#10b981]/50 transition-all duration-300 text-center shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center border border-[#10b981]/60 bg-gray-50/10 rounded-xl mx-auto mb-4">
              <Mail className="h-6 w-6 text-[#10b981]" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Email</h3>
            <p className="text-sm text-neutral-500">Send us a message</p>
          </Link>
          
          <Link
            href="/partners"
            className="border border-neutral-300/50 bg-gray-100 rounded-2xl p-6 hover:border-[#10b981]/50 transition-all duration-300 text-center shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center border border-[#10b981]/60 bg-gray-50/10 rounded-xl mx-auto mb-4">
              <Users className="h-6 w-6 text-[#10b981]" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Partners</h3>
            <p className="text-sm text-neutral-500">Join our partner program</p>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default async function Page() {
  const settings = await getPublicSettings([
    'section_hero_enabled',
    'section_testimonials_enabled',
    'section_faq_enabled',
    'section_footer_enabled'
  ])

  const sectionEnabled = (key: string) => {
    const value = settings[key as keyof typeof settings]
    return value !== 'false' && value !== false
  }

  // Fetch real published learning products from the DB
  const publishedProducts = await getPublishedProducts();

  return (
    <main className="relative min-h-screen bg-gray-50">
      <MarketplaceNavigation />
      <AnnouncementBanner />
      
      {/* Floating widgets */}
      <WhatsAppChatModal variant="floating" />
      <AutolearnBot />
      
      {/* Marketplace Core Sections */}
      {sectionEnabled('section_hero_enabled') && <MarketplaceHero />}
      <FeatureStrip />
      <TopSkillsGrid />
      <MarketplaceProductGrid products={publishedProducts} />

      {/* Social Proof & Contact */}
      {sectionEnabled('section_testimonials_enabled') && <TestimonialsSection />}
      {sectionEnabled('section_faq_enabled') && <FAQSection />}
      <ContactSection />
      
      {sectionEnabled('section_footer_enabled') && <Footer />}
    </main>
  )
}
