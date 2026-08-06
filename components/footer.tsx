"use client"

import { Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative z-20 border-t border-border bg-surface">
      <div className="container mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-light mb-4 text-foreground">autoLearn</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Master AI agents and build autonomous systems that work for you.
            </p>
          </div>

          {/* Learning */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Learning</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Fundamentals
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Advanced Courses
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Community Projects
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Career
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Connect</h4>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border transition-all"
              >
                <span className="w-5 h-5 flex items-center justify-center font-bold">GH</span>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border transition-all"
              >
                <span className="w-5 h-5 flex items-center justify-center font-bold">X</span>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border transition-all"
              >
                <span className="w-5 h-5 flex items-center justify-center font-bold">IN</span>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border transition-all"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-zinc-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-zinc-500 text-sm">© 2024 autoLearn. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-zinc-500 hover:text-foreground text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-zinc-500 hover:text-foreground text-sm transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
