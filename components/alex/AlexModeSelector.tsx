'use client'

import { AlexMode } from '@/lib/alex/types'
import { Sparkles, Code, Workflow, Search, Bot, Zap } from 'lucide-react'

interface AlexModeSelectorProps {
  currentMode: AlexMode
  onModeChange: (mode: AlexMode) => void
  isMobile?: boolean
}

const MODES = [
  { 
    id: 'auto' as AlexMode, 
    name: 'Auto', 
    description: 'ALEX determines the best approach',
    icon: Sparkles
  },
  { 
    id: 'tutor' as AlexMode, 
    name: 'Tutor', 
    description: 'Learning and explanations',
    icon: Bot
  },
  { 
    id: 'developer' as AlexMode, 
    name: 'Developer', 
    description: 'Code and technical assistance',
    icon: Code
  },
  { 
    id: 'automation' as AlexMode, 
    name: 'Automation', 
    description: 'n8n workflows and integrations',
    icon: Workflow
  },
  { 
    id: 'research' as AlexMode, 
    name: 'Research', 
    description: 'Web search and information gathering',
    icon: Search
  },
  { 
    id: 'agent_builder' as AlexMode, 
    name: 'Agent Builder', 
    description: 'Create AI agents',
    icon: Zap
  },
]

export function AlexModeSelector({ currentMode, onModeChange, isMobile = false }: AlexModeSelectorProps) {
  return (
    <div className={`${isMobile ? 'px-3 py-2' : 'px-4 py-2'}`}>
      <div className={`flex items-center gap-2 overflow-x-auto ${isMobile ? 'pb-1' : ''}`} role="group" aria-label="ALEX mode selection">
        {MODES.map((mode) => {
          const Icon = mode.icon
          const isActive = currentMode === mode.id
          
          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700'
              }`}
              title={mode.description}
              aria-label={`Switch to ${mode.name} mode: ${mode.description}`}
              aria-pressed={isActive}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : ''}`} />
              <span>{mode.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
