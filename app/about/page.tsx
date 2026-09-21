import { MarketplaceNavigation } from '@/components/MarketplaceNavigation'
import { Footer } from '@/components/footer'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { Award, Users, Target, BookOpen, Globe, Heart } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-brand-bg text-brand-text">
      <MarketplaceNavigation />
      <AnnouncementBanner />

      {/* Hero Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-brand-bg to-brand-bg/95">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-text mb-6">
              About AutoLearn Spot
            </h1>
            <p className="text-lg sm:text-xl text-brand-text/70 leading-relaxed">
              Empowering learners worldwide with accessible, high-quality education from expert authors. 
              We're democratizing learning by connecting passionate educators with curious minds.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-24 bg-brand-bg border-t border-brand-border/50">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-text mb-6">
                Our Mission
              </h2>
              <p className="text-base sm:text-lg text-brand-text/70 leading-relaxed mb-6">
                At AutoLearn Spot, we believe everyone deserves access to quality education. 
                Our platform bridges the gap between expert knowledge and eager learners, 
                creating a global community where knowledge flows freely.
              </p>
              <p className="text-base sm:text-lg text-brand-text/70 leading-relaxed">
                We're committed to providing affordable, accessible, and practical learning 
                experiences that transform careers and lives.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="w-64 h-64 bg-brand-primary/10 rounded-full flex items-center justify-center">
                <Target className="w-32 h-32 text-brand-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 sm:py-24 bg-brand-bg border-t border-brand-border/50">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-text mb-4">
              Our Values
            </h2>
            <p className="text-base sm:text-lg text-brand-text/70">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border border-brand-border/50 bg-brand-bg/80 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-brand-primary" />
              </div>
              <h3 className="text-xl font-semibold text-brand-text mb-3">Quality First</h3>
              <p className="text-brand-text/70">
                Every course is carefully curated to ensure the highest learning standards and practical applicability.
              </p>
            </div>

            <div className="border border-brand-border/50 bg-brand-bg/80 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-brand-primary" />
              </div>
              <h3 className="text-xl font-semibold text-brand-text mb-3">Community Driven</h3>
              <p className="text-brand-text/70">
                We foster a supportive learning community where students and authors grow together.
              </p>
            </div>

            <div className="border border-brand-border/50 bg-brand-bg/80 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-brand-primary" />
              </div>
              <h3 className="text-xl font-semibold text-brand-text mb-3">Student Success</h3>
              <p className="text-brand-text/70">
                Your success is our success. We're dedicated to helping you achieve your learning goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-24 bg-brand-bg border-t border-brand-border/50">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-brand-primary mb-2">500+</div>
              <div className="text-brand-text/70">Expert Authors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-brand-primary mb-2">10K+</div>
              <div className="text-brand-text/70">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-brand-primary mb-2">200+</div>
              <div className="text-brand-text/70">Quality Courses</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-brand-primary mb-2">50+</div>
              <div className="text-brand-text/70">Countries Reached</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-brand-bg border-t border-brand-border/50">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-text mb-6">
            Join Our Learning Community
          </h2>
          <p className="text-base sm:text-lg text-brand-text/70 mb-8 max-w-2xl mx-auto">
            Whether you're looking to learn new skills or share your expertise with the world, 
            AutoLearn Spot is the place for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/courses"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-primary text-primary-foreground rounded-lg font-medium hover:bg-brand-primary-hover transition-colors"
            >
              Start Learning
            </Link>
            <Link
              href="/author-apply"
              className="inline-flex items-center justify-center px-8 py-4 border border-brand-border bg-brand-bg text-brand-text rounded-lg font-medium hover:bg-brand-bg/80 transition-colors"
            >
              Become an Author
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
