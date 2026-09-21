import { MarketplaceNavigation } from '@/components/MarketplaceNavigation'
import { Footer } from '@/components/footer'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { Mail, MessageCircle, MapPin, Send } from 'lucide-react'
import { socialLinks } from '@/config/social'

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-brand-bg text-brand-text">
      <MarketplaceNavigation />
      <AnnouncementBanner />

      {/* Hero Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-brand-bg to-brand-bg/95">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-text mb-6">
              Get In Touch
            </h1>
            <p className="text-lg sm:text-xl text-brand-text/70 leading-relaxed">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 sm:py-24 bg-brand-bg border-t border-brand-border/50">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <a
              href={socialLinks.whatsapp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-brand-border/50 bg-brand-bg/80 rounded-2xl p-8 hover:border-[#10b981]/50 transition-all duration-300 text-center"
            >
              <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-8 h-8 text-brand-primary" />
              </div>
              <h3 className="text-xl font-semibold text-brand-text mb-3">WhatsApp</h3>
              <p className="text-brand-text/70">
                Chat with us directly for quick responses
              </p>
            </a>

            <a
              href={`mailto:${socialLinks.email || 'support@autolearnspot.com'}`}
              className="border border-brand-border/50 bg-brand-bg/80 rounded-2xl p-8 hover:border-[#10b981]/50 transition-all duration-300 text-center"
            >
              <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-brand-primary" />
              </div>
              <h3 className="text-xl font-semibold text-brand-text mb-3">Email</h3>
              <p className="text-brand-text/70">
                Send us a detailed message via email
              </p>
            </a>

            <div className="border border-brand-border/50 bg-brand-bg/80 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-8 h-8 text-brand-primary" />
              </div>
              <h3 className="text-xl font-semibold text-brand-text mb-3">Location</h3>
              <p className="text-brand-text/70">
                Global platform, accessible from anywhere
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto">
            <div className="border border-brand-border/50 bg-brand-bg/80 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-brand-text mb-6">Send us a message</h2>
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-brand-text mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 bg-brand-bg border border-brand-border rounded-lg text-brand-text placeholder-brand-text/50 focus:outline-none focus:border-brand-primary transition-colors"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-brand-text mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 bg-brand-bg border border-brand-border rounded-lg text-brand-text placeholder-brand-text/50 focus:outline-none focus:border-brand-primary transition-colors"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-brand-text mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    className="w-full px-4 py-3 bg-brand-bg border border-brand-border rounded-lg text-brand-text placeholder-brand-text/50 focus:outline-none focus:border-brand-primary transition-colors"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-brand-text mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    className="w-full px-4 py-3 bg-brand-bg border border-brand-border rounded-lg text-brand-text placeholder-brand-text/50 focus:outline-none focus:border-brand-primary transition-colors resize-none"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-primary text-primary-foreground rounded-lg font-medium hover:bg-brand-primary-hover transition-colors"
                >
                  <Send className="w-5 h-5" />
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
