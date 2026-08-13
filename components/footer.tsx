import { Mail } from "lucide-react"
import { getPublicSettings } from "@/lib/public-settings"

async function FooterContent() {
  const settings = await getPublicSettings([
    'footerCopyrightText',
    'siteName',
    'footerPrivacyLink',
    'footerTermsLink',
    'footerDescription',
    'siteTagline',
    'footerContactLink',
    'facebookUrl',
    'instagramUrl',
    'twitterUrl',
    'linkedinUrl',
    'youtubeUrl',
    'supportEmail'
  ])

  return (
    <footer className="relative z-20 border-t border-zinc-800 bg-black">
      <div className="container mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-light mb-4 text-white">{settings.siteName}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {settings.siteTagline}
            </p>
          </div>

          {/* Learning */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Learning</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Fundamentals
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Advanced Courses
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Community Projects
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href={settings.footerContactLink || '/contact'} className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Career
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Connect</h4>
            <div className="flex gap-4">
              {settings.facebookUrl && (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-400 transition-all"
                >
                  <span className="w-5 h-5 flex items-center justify-center font-bold">FB</span>
                </a>
              )}
              {settings.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-400 transition-all"
                >
                  <span className="w-5 h-5 flex items-center justify-center font-bold">IG</span>
                </a>
              )}
              {settings.twitterUrl && (
                <a
                  href={settings.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-400 transition-all"
                >
                  <span className="w-5 h-5 flex items-center justify-center font-bold">X</span>
                </a>
              )}
              {settings.linkedinUrl && (
                <a
                  href={settings.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-400 transition-all"
                >
                  <span className="w-5 h-5 flex items-center justify-center font-bold">IN</span>
                </a>
              )}
              {settings.youtubeUrl && (
                <a
                  href={settings.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-400 transition-all"
                >
                  <span className="w-5 h-5 flex items-center justify-center font-bold">YT</span>
                </a>
              )}
              <a
                href={`mailto:${settings.supportEmail}`}
                className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-400 transition-all"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-zinc-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-zinc-500 text-sm">{settings.footerCopyrightText || `© ${new Date().getFullYear()} ${settings.siteName}. All rights reserved.`}</p>
            <div className="flex gap-6">
              <a href={settings.footerPrivacyLink || '/privacy'} className="text-zinc-500 hover:text-white text-sm transition-colors">
                Privacy Policy
              </a>
              <a href={settings.footerTermsLink || '/terms'} className="text-zinc-500 hover:text-white text-sm transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export function Footer() {
  return <FooterContent />
}
