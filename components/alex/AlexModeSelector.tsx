'use client'

import { AlexMode } from '@/lib/alex/types'

interface AlexModeSelectorProps {
  currentMode: AlexMode
  onModeChange: (mode: AlexMode) => void
}

const MODES = [
  { id: 'auto' as AlexMode, name: 'Auto', description: 'ALEX determines the best approach' },
  { id: 'tutor' as AlexMode, name: 'Tutor', description: 'Learning and explanations' },
  { id: 'developer' as AlexMode, name: 'Developer', description: 'Code and technical assistance' },
  { id: 'automation' as AlexMode, name: 'Automation', description: 'n8n workflows and integrations' },
  { id: 'research' as AlexMode, name: 'Research', description: 'Web search and information gathering' },
  { id: 'agent_builder' as AlexMode, name: 'Agent Builder', description: 'Create AI agents' },
]

export function AlexModeSelector({ currentMode, onModeChange }: AlexModeSelectorProps) {
  return (
    <div className="border-b border-[#1f2229] bg-[#0c0e12]/50 px-6 py-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 overflow-x-auto" role="group" aria-label="ALEX mode selection">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#00f0ff] focus:ring-offset-2 focus:ring-offset-[#0c0e12] ${
                currentMode === mode.id
                  ? 'bg-[#00f0ff] text-[#00363a]'
                  : 'bg-[#1f2229] text-[#b9cacb] hover:bg-[#1f2229]/80 hover:text-white'
              }`}
              title={mode.description}
              aria-label={`Switch to ${mode.name} mode: ${mode.description}`}
              aria-pressed={currentMode === mode.id}
            >
              {mode.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}