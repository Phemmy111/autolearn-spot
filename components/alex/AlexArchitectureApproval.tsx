'use client'

import { Check, Edit2, RotateCcw, FileText, Download } from 'lucide-react'
import { useState } from 'react'

interface AlexArchitectureApprovalProps {
  architecture: {
    description: string
    platform: string
    platformReasoning: string
    complexity: 'simple' | 'moderate' | 'complex'
    stages: string[]
    assumptions: string[]
    recommendations: string[]
  }
  onApprove: () => void
  onModify: () => void
  onImprove: () => void
  disabled?: boolean
  conversationId?: string
}

export function AlexArchitectureApproval({
  architecture,
  onApprove,
  onModify,
  onImprove,
  disabled = false,
  conversationId
}: AlexArchitectureApprovalProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [approvalResult, setApprovalResult] = useState<any>(null)

  const handleApprove = async () => {
    if (disabled || !conversationId) return
    
    setIsApproving(true)
    try {
      const response = await fetch('/api/alex/artifacts/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId,
          plan: {
            objective: architecture.description,
            platform: architecture.platform ? { name: architecture.platform } : undefined
          }
        })
      })

      const result = await response.json()
      setApprovalResult(result)
      
      if (result.status === 'completed' && result.artifacts) {
        onApprove()
      }
    } catch (error) {
      console.error('Approval failed:', error)
      setApprovalResult({ error: 'Failed to approve architecture' })
    } finally {
      setIsApproving(false)
    }
  }

  return (
    <div className="my-4 p-5 bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="flex items-start gap-3 mb-4">
        <FileText className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-slate-200 font-semibold mb-1">Proposed Architecture</h3>
          <p className="text-xs text-slate-500">
            Platform: {architecture.platform || 'Not specified'} | Complexity: {architecture.complexity}
          </p>
        </div>
      </div>

      <div className="mb-4 p-3 bg-slate-900/50 rounded-lg">
        <p className="text-sm text-slate-300 whitespace-pre-line">{architecture.description}</p>
      </div>

      {!architecture.platform && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-xs text-amber-400">
            ⚠️ Platform not specified. Please select a platform before generating the workflow.
          </p>
        </div>
      )}

      {architecture.assumptions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-400 mb-2">Assumptions:</p>
          <ul className="text-xs text-slate-500 space-y-1">
            {architecture.assumptions.map((assumption, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-slate-600">•</span>
                <span>{assumption}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {architecture.recommendations.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-400 mb-2">Recommendations:</p>
          <ul className="text-xs text-slate-500 space-y-1">
            {architecture.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-slate-600">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {approvalResult && (
        <div className={`mb-4 p-3 rounded-lg ${
          approvalResult.status === 'completed' 
            ? 'bg-green-500/10 border border-green-500/30' 
            : 'bg-red-500/10 border border-red-500/30'
        }`}>
          <p className={`text-xs ${
            approvalResult.status === 'completed' ? 'text-green-400' : 'text-red-400'
          }`}>
            {approvalResult.status === 'completed' 
              ? '✅ Workflow generated successfully!' 
              : `❌ ${approvalResult.error || 'Failed to generate workflow'}`
          }
          </p>
          {approvalResult.artifacts && approvalResult.artifacts.length > 0 && (
            <div className="mt-2">
              {approvalResult.artifacts.map((artifact: any) => (
                <a
                  key={artifact.id}
                  href={artifact.download_url}
                  download={artifact.filename}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500 text-cyan-400 rounded text-xs"
                >
                  <Download className="h-3 w-3" />
                  Download {artifact.filename}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-700">
        <button
          onClick={handleApprove}
          disabled={disabled || isApproving || !architecture.platform}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="h-4 w-4" />
          <span>{isApproving ? 'Generating...' : 'Approve & Generate'}</span>
        </button>

        <button
          onClick={onModify}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Edit2 className="h-4 w-4" />
          <span>Modify</span>
        </button>

        <button
          onClick={onImprove}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Ask ALEX to Improve</span>
        </button>
      </div>
    </div>
  )
}
