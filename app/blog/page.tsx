import { MarketplaceNavigation } from '@/components/MarketplaceNavigation'
import { Footer } from '@/components/footer'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const blogPosts = [
  {
    id: 1,
    title: 'The Future of Online Learning: Trends to Watch in 2024',
    excerpt: 'Explore the latest trends shaping the future of online education and how AutoLearn Spot is leading the way.',
    date: '2024-01-15',
    readTime: '5 min read',
    category: 'Education',
  },
  {
    id: 2,
    title: 'How to Become a Successful Course Author',
    excerpt: 'Learn the essential skills and strategies to create engaging courses that students love.',
    date: '2024-01-10',
    readTime: '7 min read',
    category: 'Author Tips',
  },
  {
    id: 3,
    title: 'Mastering AI Tools for Content Creation',
    excerpt: 'Discover how AI can help you create better educational content faster and more efficiently.',
    date: '2024-01-05',
    readTime: '6 min read',
    category: 'Technology',
  },
]

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-brand-bg text-brand-text">
      <MarketplaceNavigation />
      <AnnouncementBanner />

      {/* Hero Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-brand-bg to-brand-bg/95">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-text mb-6">
              Blog
            </h1>
            <p className="text-lg sm:text-xl text-brand-text/70 leading-relaxed">
              Insights, tips, and stories from the world of online learning and course creation.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16 sm:py-24 bg-brand-bg border-t border-brand-border/50">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="border border-brand-border/50 bg-brand-bg/80 rounded-2xl overflow-hidden hover:border-brand-primary/50 transition-colors"
              >
                <div className="h-48 bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
                  <span className="text-6xl">📝</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 text-sm text-brand-text/60 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(post.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.readTime}
                    </span>
                  </div>
                  <span className="inline-block px-3 py-1 text-xs font-medium bg-brand-primary/10 text-brand-primary rounded-full mb-3">
                    {post.category}
                  </span>
                  <h2 className="text-xl font-semibold text-brand-text mb-3 line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-brand-text/70 text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <Link
                    href={`/blog/${post.id}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary hover:text-brand-primary-hover transition-colors"
                  >
                    Read More
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {blogPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-brand-text/70 text-lg">
                No blog posts yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
