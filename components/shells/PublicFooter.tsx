import Link from 'next/link';
import { Mail, Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';
import { getPublicSettings } from '@/lib/public-settings';

/**
 * Public Footer
 * 
 * Clean, premium footer for the public marketplace.
 * Modern design with social links and company information.
 */
async function PublicFooterContent() {
  const settings = await getPublicSettings([
    'siteName',
    'siteTagline',
    'footerCopyrightText',
    'footerPrivacyLink',
    'footerTermsLink',
    'footerContactLink',
    'facebookUrl',
    'instagramUrl',
    'twitterUrl',
    'linkedinUrl',
    'youtubeUrl',
    'supportEmail',
  ]);

  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="container mx-auto px-6 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-neutral-900 mb-3">
              {settings.siteName || 'AutoLearn Spot'}
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              {settings.siteTagline || 'Premium digital skills marketplace'}
            </p>
          </div>

          {/* Learning */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 mb-3">Learning</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/marketplace" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/skills" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                  Skills
                </Link>
              </li>
              <li>
                <Link href="/authors" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                  Authors
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 mb-3">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href={settings.footerContactLink || '/contact'} className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/author" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                  Become an Author
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 mb-3">Connect</h4>
            <div className="flex gap-3">
              {settings.facebookUrl && (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:text-primary-600 hover:border-primary-600 transition-all"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:text-primary-600 hover:border-primary-600 transition-all"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings.twitterUrl && (
                <a
                  href={settings.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:text-primary-600 hover:border-primary-600 transition-all"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {settings.linkedinUrl && (
                <a
                  href={settings.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:text-primary-600 hover:border-primary-600 transition-all"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {settings.youtubeUrl && (
                <a
                  href={settings.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:text-primary-600 hover:border-primary-600 transition-all"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              )}
              <a
                href={`mailto:${settings.supportEmail}`}
                className="w-10 h-10 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:text-primary-600 hover:border-primary-600 transition-all"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-neutral-200 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-neutral-500">
              {settings.footerCopyrightText || `© ${new Date().getFullYear()} ${settings.siteName || 'AutoLearn Spot'}. All rights reserved.`}
            </p>
            <div className="flex gap-6">
              <Link href={settings.footerPrivacyLink || '/privacy'} className="text-sm text-neutral-500 hover:text-primary-600 transition-colors">
                Privacy Policy
              </Link>
              <Link href={settings.footerTermsLink || '/terms'} className="text-sm text-neutral-500 hover:text-primary-600 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function PublicFooter() {
  return <PublicFooterContent />;
}