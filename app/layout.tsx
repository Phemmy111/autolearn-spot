import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { getPublicSettings } from '@/lib/public-settings'
import { BrandTheming } from '@/components/BrandTheming'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import { MetaPixel } from '@/components/meta/MetaPixel'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  let settings;
  try {
    settings = await getPublicSettings([
      'site_title',
      'meta_description',
      'keywords',
      'og_title',
      'og_description',
      'og_image',
      'twitter_card_type'
    ])
  } catch (error) {
    console.error('Error fetching settings for metadata:', error);
    settings = {};
  }

  const defaultTitle = settings.siteTitle || 'AutoLearn Spot | Modern Tech, Coding, AI & Digital Skills Marketplace';
  const defaultDescription = settings.metaDescription || 'Master in-demand tech skills, AI automation, coding, digital workflows, and modern software tools with hands-on, project-based courses taught by industry experts. Build real projects, earn verified certificates, and accelerate your career.';
  const defaultKeywords = settings.keywords || 'tech skills, online courses, AI automation, coding, software development, n8n training, digital skills, programming, workflow automation, python, web development, tech certifications, learn tech, AutoLearn Spot, practical courses, freelance skills, business automation';

  return {
    metadataBase: new URL('https://www.autolearnspot.com'),
    title: {
      default: defaultTitle,
      template: '%s | AutoLearn Spot',
    },
    description: defaultDescription,
    keywords: typeof defaultKeywords === 'string' ? defaultKeywords.split(',').map((k: string) => k.trim()) : defaultKeywords,
    authors: [{ name: 'AutoLearn Spot', url: 'https://www.autolearnspot.com' }],
    creator: 'AutoLearn Spot',
    publisher: 'AutoLearn Spot',
    generator: 'Codex',
    icons: {
      icon: '/autolearn-brandmark.png',
      apple: '/autolearn-brandmark.png',
    },
    alternates: {
      canonical: 'https://www.autolearnspot.com',
    },
    openGraph: {
      title: settings.ogTitle || defaultTitle,
      description: settings.ogDescription || defaultDescription,
      url: 'https://www.autolearnspot.com',
      siteName: 'AutoLearn Spot',
      images: [
        {
          url: settings.ogImage || '/og-image.png',
          width: 1200,
          height: 630,
          alt: settings.ogTitle || defaultTitle,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: (settings.twitterCardType as any) || 'summary_large_image',
      title: settings.ogTitle || defaultTitle,
      description: settings.ogDescription || defaultDescription,
      images: [settings.ogImage || '/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: [{ color: '#ffffff' }],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className="font-sans antialiased h-full bg-brand-bg text-brand-text">
          <MetaPixel />
          <BrandTheming />
          <ServiceWorkerRegister />
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </body>
      </html>
    </ClerkProvider>
  )
}
