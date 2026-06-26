import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://autolearn-spot.vercel.app'),
  title: 'AutoLearn Spot – Master n8n & AI Automation',
  description: 'Learn practical n8n automation through hands-on projects. Build AI automations, Telegram bots, WhatsApp bots, APIs, and real business workflows.',
 generator: 'AutoLearn Spot',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'AutoLearn Spot – Master n8n & AI Automation',
    description: 'Learn practical n8n automation through hands-on projects. Build AI automations, Telegram bots, WhatsApp bots, APIs, and real business workflows.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AutoLearn Spot – Master n8n & AI Automation',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoLearn Spot – Master n8n & AI Automation',
    description: 'Learn practical n8n automation through hands-on projects. Build AI automations, Telegram bots, WhatsApp bots, APIs, and real business workflows.',
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: [{ color: 'white' }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
