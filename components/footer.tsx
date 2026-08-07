"use client"

import { Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative z-20 border-t border-[var(--border-default)] bg-[var(--surface-hover)]">
      <div className="container mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-light mb-4 text-[var(--text-primary)]">autoLearn</h3>
            <p className="text-[var(--text-body)] text-sm leading-relaxed">
              Master AI agents and build autonomous systems that work for you.
            </p>
          </div>

          {/* Learning */}
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4">Learning</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-[var(--text-body)] hover:text-[var(--primary)] text-sm transition-colors">
                  Fundamentals
                </a>
              </li>
              <li>
                <a href="#" className="text-[var(--text-body)] hover:text-[var(--primary)] text-sm transition-colors">
                  Advanced Courses
                </a>
              </li>
              <li>
                <a href="#" className="text-[var(--text-body)] hover:text-[var(--primary)] text-sm transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-[var(--text-body)] hover:text-[var(--primary)] text-sm transition-colors">
                  Community Projects
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-[var(--text-body)] hover:text-[var(--primary)] text-sm transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-[var(--text-body)] hover:text-[var(--primary)] text-sm transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-[var(--text-body)] hover:text-[var(--primary)] text-sm transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-[var(--text-body)] hover:text-[var(--primary)] text-sm transition-colors">
                  Career
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4">Connect</h4>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-[var(--border-default)] bg-[var(--background)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)] transition-all"
              >
                <span className="w-5 h-5 flex items-center justify-center font-bold">GH</span>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-[var(--border-default)] bg-[var(--background)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)] transition-all"
              >
                <span className="w-5 h-5 flex items-center justify-center font-bold">X</span>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-[var(--border-default)] bg-[var(--background)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)] transition-all"
              >
                <span className="w-5 h-5 flex items-center justify-center font-bold">IN</span>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-[var(--border-default)] bg-[var(--background)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)] transition-all"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-[var(--border-default)] pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[var(--text-muted)] text-sm">© 2024 autoLearn. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-[var(--text-muted)] hover:text-[var(--primary)] text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-[var(--text-muted)] hover:text-[var(--primary)] text-sm transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
