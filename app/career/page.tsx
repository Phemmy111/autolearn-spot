import { MarketplaceNavigation } from '@/components/MarketplaceNavigation'
import { Footer } from '@/components/footer'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { Briefcase, Users, Zap, ArrowRight, Building2 } from 'lucide-react'
import Link from 'next/link'

const openPositions = [
  {
    title: 'Senior Full Stack Developer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
  },
  {
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote',
    type: 'Full-time',
  },
  {
    title: 'Content Marketing Manager',
    department: 'Marketing',
    location: 'Remote',
    type: 'Full-time',
  },
  {
    title: 'Customer Success Manager',
    department: 'Customer Success',
    location: 'Remote',
    type: 'Full-time',
  },
]

export default function CareerPage() {
  return (
    <main className="min-h-screen bg-brand-bg text-brand-text">
      <MarketplaceNavigation />
      <AnnouncementBanner />

      {/* Hero Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-brand-bg to-brand-bg/95">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-text mb-6">
              Join Our Team
            </h1>
            <p className="text-lg sm:text-xl text-brand-text/70 leading-relaxed">
              Build the future of education with us. We're looking for passionate individuals 
              who want to make a difference in how people learn.
            </p>
          </div>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-16 sm:py-24 bg-brand-bg border-t border-brand-border/50">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-text mb-4">
              Why Work With Us
            </h2>
            <p className="text-base sm:text-lg text-brand-text/70">
              We offer more than just a job – we offer a career
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border border-brand-border/50 bg-brand-bg/80 rounded-2xl p-8">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-brand-primary" />
              </div>
              <h3 className="text-xl font-semibold text-brand-text mb-3">Fast-Paced Environment</h3>
              <p className="text-brand-text/70">
                Work on cutting-edge projects with a team that moves fast and ships frequently.
              </p>
            </div>

            <div className="border border-brand-border/50 bg-brand-bg/80 rounded-2xl p-8">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-brand-primary" />
              </div>
              <h3 className="text-xl font-semibold text-brand-text mb-3">Great Team</h3>
              <p className="text-brand-text/70">
                Collaborate with talented, passionate people who love what they do.
              </p>
            </div>

            <div className="border border-brand-border/50 bg-brand-bg/80 rounded-2xl p-8">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-6">
                <Building2 className="w-8 h-8 text-brand-primary" />
              </div>
              <h3 className="text-xl font-semibold text-brand-text mb-3">Remote-First</h3>
              <p className="text-brand-text/70">
                Work from anywhere in the world with flexible hours and a great work-life balance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 sm:py-24 bg-brand-bg border-t border-brand-border/50">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-text mb-4">
              Open Positions
            </h2>
            <p className="text-base sm:text-lg text-brand-text/70">
              Find your perfect role
            </p>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            {openPositions.map((position, index) => (
              <div
                key={index}
                className="border border-brand-border/50 bg-brand-bg/80 rounded-xl p-6 hover:border-brand-primary/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-brand-text mb-2">
                      {position.title}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-sm text-brand-text/60">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {position.department}
                      </span>
                      <span>•</span>
                      <span>{position.location}</span>
                      <span>•</span>
                      <span>{position.type}</span>
                    </div>
                  </div>
                  <Link
                    href={`/career/${position.title.toLowerCase().replace(/\s+/g, '-')}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-primary-foreground rounded-lg font-medium hover:bg-brand-primary-hover transition-colors text-sm"
                  >
                    Apply Now
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {openPositions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-brand-text/70 text-lg">
                No open positions at the moment. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Culture Section */}
      <section className="py-16 sm:py-24 bg-brand-bg border-t border-brand-border/50">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-text mb-6">
                Our Culture
              </h2>
              <p className="text-base sm:text-lg text-brand-text/70 leading-relaxed mb-6">
                At AutoLearn Spot, we believe in continuous learning, transparency, and mutual respect. 
                We encourage innovation and celebrate diverse perspectives.
              </p>
              <p className="text-base sm:text-lg text-brand-text/70 leading-relaxed">
                We're committed to creating an inclusive environment where everyone can thrive 
                and contribute their best work.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="w-64 h-64 bg-brand-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-32 h-32 text-brand-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
