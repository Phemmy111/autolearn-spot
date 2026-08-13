import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { getPublicSettings } from '@/lib/public-settings'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { BrandTheming } from '@/components/BrandTheming'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings([
    'site_title',
    'meta_description',
    'og_title',
    'og_description',
    'og_image',
    'twitter_card_type'
  ])

  return {
    metadataBase: new URL('https://autolearn-spot.vercel.app'),
    title: settings.siteTitle || 'AutoLearn Spot - n8n & AI Automation Training',
    description: settings.metaDescription || 'A 4-week hands-on n8n automation training where every session ends with a working, deployable workflow.',
    generator: 'Codex',
    icons: {
      icon: '/autolearn-brandmark.png',
      apple: '/autolearn-brandmark.png',
    },
    openGraph: {
      title: settings.ogTitle || settings.siteTitle || 'AutoLearn Spot - n8n & AI Automation Training',
      description: settings.ogDescription || settings.metaDescription || 'A 4-week hands-on n8n automation training where every session ends with a working, deployable workflow.',
      images: [
        {
          url: settings.ogImage || '/og-image.png',
          width: 1200,
          height: 630,
          alt: settings.ogTitle || settings.siteTitle || 'AutoLearn Spot - n8n & AI Automation Training',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: (settings.twitterCardType as any) || 'summary_large_image',
      title: settings.ogTitle || settings.siteTitle || 'AutoLearn Spot - n8n & AI Automation Training',
      description: settings.ogDescription || settings.metaDescription || 'A 4-week hands-on n8n automation training where every session ends with a working, deployable workflow.',
      images: [settings.ogImage || '/og-image.png'],
    },
  }
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: [{ color: '#111317' }],
}

// Test commit to trigger deployment

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className="font-sans antialiased">
          <BrandTheming />
          <AnnouncementBanner />
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </body>
      </html>
    </ClerkProvider>
  )
}
