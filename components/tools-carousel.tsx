'use client'

import { useEffect, useState } from 'react'
import {
  BrainCircuit,
  Database,
  GitFork,
  Mail,
  MessageCircle,
  Rocket,
  Send,
  Sheet,
} from 'lucide-react'

const tools = [
  { icon: GitFork, title: 'n8n', body: 'Workflow engine' },
  { icon: BrainCircuit, title: 'ChatGPT', body: 'AI integration' },
  { icon: Mail, title: 'Gmail', body: 'Email automation' },
  { icon: Send, title: 'Telegram', body: 'Bot creation' },
  { icon: Sheet, title: 'Google Sheets', body: 'Data pipelines' },
  { icon: MessageCircle, title: 'WhatsApp', body: 'Messaging bots' },
  { icon: Rocket, title: 'Railway', body: 'Live deployment' },
  { icon: Database, title: 'Supabase', body: 'Database & auth' },
]

export function ToolsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % tools.length)
    }, 2000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const getOffset = (index: number) => {
    let offset = index - activeIndex

    if (offset > tools.length / 2) {
      offset -= tools.length
    }

    if (offset < -tools.length / 2) {
      offset += tools.length
    }

    return offset
  }

  return (
    <div className="page-animate">
      <div className="tools-coverflow-stage relative mx-auto h-[440px] max-w-6xl overflow-hidden sm:h-[520px]">
        <div className="pointer-events-none absolute inset-x-0 bottom-8 mx-auto h-px max-w-3xl bg-[#1f2229]" />
        {tools.map((tool, index) => {
          const Icon = tool.icon
          const offset = getOffset(index)
          const distance = Math.abs(offset)
          const isVisible = distance <= 2
          const isActive = offset === 0

          return (
            <article
              aria-hidden={!isVisible}
              className={`absolute left-1/2 top-1/2 flex h-[360px] w-[250px] flex-col items-center justify-between border bg-[#0c0e12]/95 p-7 text-center shadow-[0_28px_80px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out sm:h-[440px] sm:w-[320px] ${
                isActive
                  ? 'border-[#00f0ff] shadow-[0_0_36px_rgba(0,240,255,0.18),0_32px_80px_rgba(0,0,0,0.45)]'
                  : 'border-[#1f2229]'
              }`}
              key={tool.title}
              onClick={() => setActiveIndex(index)}
              style={{
                opacity: isVisible ? 1 - distance * 0.18 : 0,
                pointerEvents: isVisible ? 'auto' : 'none',
                transform: `translate(-50%, -50%) translateX(calc(${offset} * clamp(140px, 22vw, 300px))) translateY(${distance * 22}px) rotateY(${-offset * 18}deg) scale(${1 - distance * 0.16})`,
                zIndex: 10 - distance,
              }}
            >
              <div className="flex w-full items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-[#5d5f63]">
                <span>tool_{String(index + 1).padStart(2, '0')}</span>
                <span className={`h-2 w-2 ${isActive ? 'bg-[#00f0ff]' : 'bg-[#3b494b]'}`} />
              </div>
              <div>
                <div className="mx-auto flex h-24 w-24 items-center justify-center border border-[#00f0ff]/70 bg-[#00f0ff]/10 text-[#00f0ff] sm:h-28 sm:w-28">
                  <Icon className="h-11 w-11 sm:h-12 sm:w-12" />
                </div>
                <h3 className="mt-10 font-heading text-2xl font-semibold text-[#e2e2e8] sm:text-3xl">{tool.title}</h3>
                <p className="mt-3 font-mono text-sm text-[#b9cacb] sm:text-base">{tool.body}</p>
              </div>
              <button
                className="w-full border border-[#1f2229] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#00f0ff] transition hover:border-[#00f0ff]/80 hover:bg-[#00f0ff]/10"
                onClick={(event) => {
                  event.stopPropagation()
                  setActiveIndex(index)
                }}
                type="button"
              >
                Focus Tool
              </button>
            </article>
          )
        })}
      </div>

      <div className="mt-2 flex justify-center gap-2">
        {tools.map((tool, index) => (
          <button
            aria-label={`Go to ${tool.title}`}
            className={`h-1.5 w-8 transition ${
              index === activeIndex ? 'bg-[#00f0ff]' : 'bg-[#1f2229] hover:bg-[#3b494b]'
            }`}
            key={tool.title}
            onClick={() => setActiveIndex(index)}
            type="button"
          />
        ))}
      </div>
    </div>
  )
}
