"use client"

import { Menu } from "lucide-react"

export function MobileMenu() {
  return (
    <button className="p-2 text-brand-text hover:text-zinc-300 transition-colors" aria-label="Menu">
      <Menu className="w-6 h-6" />
    </button>
  )
}
