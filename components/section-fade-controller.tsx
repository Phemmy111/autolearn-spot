'use client'

import { useEffect } from 'react'

export function SectionFadeController() {
  useEffect(() => {
    const root = document.documentElement
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>('.section-fade, .page-animate'))

    root.classList.add('scroll-reveal-ready')

    if (!('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'))
      return () => {
        root.classList.remove('scroll-reveal-ready')
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      {
        rootMargin: '0px 0px -14% 0px',
        threshold: 0.14,
      },
    )

    revealItems.forEach((item) => observer.observe(item))

    return () => {
      observer.disconnect()
      root.classList.remove('scroll-reveal-ready')
    }
  }, [])

  return null
}
