'use client'

import { useEffect } from 'react'

export function SectionFadeController() {
  useEffect(() => {
    const root = document.documentElement
    let observer: IntersectionObserver | null = null;
    let revealItems: HTMLElement[] = [];

    const init = () => {
      revealItems = Array.from(document.querySelectorAll<HTMLElement>('.section-fade, .page-animate'))
      
      root.classList.add('scroll-reveal-ready')

      if (!('IntersectionObserver' in window)) {
        revealItems.forEach((item) => item.classList.add('is-visible'))
        return
      }

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return

            entry.target.classList.add('is-visible')
            if (observer) {
              observer.unobserve(entry.target)
            }
          })
        },
        {
          rootMargin: '0px 0px 24% 0px',
          threshold: 0.04,
        },
      )

      revealItems.forEach((item) => observer?.observe(item))
    }

    // Delay initialization to ensure all DOM elements are mounted
    const timeoutId = setTimeout(init, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observer) {
        observer.disconnect()
      }
      root.classList.remove('scroll-reveal-ready')
    }
  }, [])

  return null
}
