import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { WhatsAppChatModal } from '@/components/whatsapp-chat-modal'
import { ErrorBoundary } from '@/components/error-boundary'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://autolearn-spot.vercel.app'),
  title: 'AutoLearn Spot - n8n & AI Automation Training',
  description:
    'A 4-week hands-on n8n automation training where every session ends with a working, deployable workflow.',
  generator: 'Codex',
  icons: {
    icon: '/autolearn-brandmark.png',
    apple: '/autolearn-brandmark.png',
  },
  openGraph: {
    title: 'AutoLearn Spot - n8n & AI Automation Training',
    description:
      'A 4-week hands-on n8n automation training where every session ends with a working, deployable workflow.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AutoLearn Spot - n8n & AI Automation Training',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoLearn Spot - n8n & AI Automation Training',
    description:
      'A 4-week hands-on n8n automation training where every session ends with a working, deployable workflow.',
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: [{ color: '#111317' }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
      <html lang="en" className="dark">
        <body className="font-sans antialiased">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <WhatsAppChatModal variant="floating" />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </body>
      </html>
    </ClerkProvider>
  )
}
