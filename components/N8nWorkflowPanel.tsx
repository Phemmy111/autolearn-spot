import { Plus, GitFork, Sheet, MessageCircle } from 'lucide-react'

const workflowNodes = [
  {
    label: 'Form',
    detail: 'Webhook trigger',
    icon: Plus,
    x: '13%',
    y: '42%',
    tone: 'active',
    delay: '0.45s',
  },
  {
    label: 'IF / Switch',
    detail: 'Route lead',
    icon: GitFork,
    x: '49%',
    y: '42%',
    tone: 'cyan',
    delay: '0.9s',
  },
  {
    label: 'Sheets',
    detail: 'Save record',
    icon: Sheet,
    x: '68%',
    y: '14%',
    tone: 'brand',
    delay: '1.35s',
  },
  {
    label: 'WhatsApp',
    detail: 'Send reply',
    icon: MessageCircle,
    x: '68%',
    y: '58%',
    tone: 'brand',
    delay: '1.8s',
  },
]

const workflowLog = ['Form submitted', 'AI score: 94%', 'Student added to sheet']

function WorkflowNode({
  node,
}: {
  node: (typeof workflowNodes)[number]
}) {
  const Icon = node.icon

  return (
    <div
      className={`workflow-node absolute z-10 w-[108px] border bg-[#111317] p-3 shadow-[0_12px_30px_rgba(0,0,0,0.28)] sm:w-[132px] ${
        node.tone === 'active'
          ? 'border-[#00f0ff] shadow-[0_0_18px_rgba(0,240,255,0.22)]'
          : node.tone === 'brand'
            ? 'border-[#00f0ff]/70'
            : 'border-[#1f2229]'
      }`}
      style={{ left: node.x, top: node.y, animationDelay: node.delay }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div
          className={`flex h-8 w-8 items-center justify-center border ${
            node.tone === 'brand'
              ? 'border-[#00f0ff]/70 bg-[#00f0ff]/10 text-[#00f0ff]'
              : 'border-[#00f0ff]/70 bg-[#00f0ff]/10 text-[#00f0ff]'
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="workflow-status-dot h-2 w-2 rounded-full bg-[#00f0ff]" />
      </div>
      <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#e2e2e8] sm:text-[11px]">
        {node.label}
      </h3>
      <p className="mt-1 font-mono text-[10px] text-[#b9cacb]">{node.detail}</p>
    </div>
  )
}

export function N8nWorkflowPanel() {
  return (
    <div className="relative z-10 w-full border border-[#1f2229] bg-[#0c0e12] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,240,255,0.1)]">
      <div className="absolute inset-0 bg-[#00f0ff]/5 rounded-2xl blur-xl" />
      <div className="flex h-8 items-center justify-between border-b border-[#1f2229] bg-[#1a1c20] px-4">
        <span className="font-mono text-[10px] text-[#b9cacb]">live_workflow.n8n</span>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#333539]" />
          <span className="h-2 w-2 rounded-full bg-[#333539]" />
          <span className="h-2 w-2 rounded-full bg-[#333539]" />
        </div>
      </div>

      <div className="flex h-10 items-center justify-between border-b border-[#1f2229] bg-[#111317] px-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#00f0ff]">n8n canvas</span>
          <span className="hidden h-4 w-px bg-[#1f2229] sm:block" />
          <span className="hidden font-mono text-[10px] text-[#b9cacb] sm:block">real training workflow / active</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-6 w-6 items-center justify-center border border-[#1f2229] text-[#00f0ff]">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <span className="workflow-running border border-[#00f0ff]/70 bg-[#00f0ff]/10 px-2 py-1 font-mono text-[10px] text-[#00f0ff]">
            RUNNING
          </span>
        </div>
      </div>

      <div className="relative min-h-[300px] sm:min-h-[360px] overflow-hidden bg-[#050505]">
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(#1f2229_1px,transparent_1px),linear-gradient(90deg,#1f2229_1px,transparent_1px)] [background-size:32px_32px]" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 620 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path d="M92 185 C170 185 162 112 242 112" fill="none" stroke="#3b494b" strokeWidth="1.5" />
          <path d="M335 138 C385 170 390 185 430 185" fill="none" stroke="#3b494b" strokeWidth="1.5" />
          <path d="M512 170 C532 138 535 105 560 86" fill="none" stroke="#3b494b" strokeWidth="1.5" />
          <path d="M512 206 C536 222 535 250 560 266" fill="none" stroke="#3b494b" strokeWidth="1.5" />
          <path
            className="workflow-path workflow-path-1"
            d="M92 185 C170 185 162 112 242 112"
            fill="none"
            stroke="#00f0ff"
            strokeDasharray="10 18"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            className="workflow-path workflow-path-2"
            d="M335 138 C385 170 390 185 430 185"
            fill="none"
            stroke="#00f0ff"
            strokeDasharray="10 18"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            className="workflow-path workflow-path-3"
            d="M512 170 C532 138 535 105 560 86"
            fill="none"
            stroke="#00f0ff"
            strokeDasharray="10 18"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            className="workflow-path workflow-path-4"
            d="M512 206 C536 222 535 250 560 266"
            fill="none"
            stroke="#00f0ff"
            strokeDasharray="10 18"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <circle className="workflow-packet workflow-packet-1" r="4" fill="#00f0ff">
            <animateMotion dur="3.2s" repeatCount="indefinite" path="M92 185 C170 185 162 112 242 112" />
          </circle>
          <circle className="workflow-packet workflow-packet-2" r="4" fill="#00f0ff">
            <animateMotion begin="0.7s" dur="3.2s" repeatCount="indefinite" path="M335 138 C385 170 390 185 430 185" />
          </circle>
          <circle className="workflow-packet workflow-packet-3" r="4" fill="#00f0ff">
            <animateMotion begin="1.3s" dur="3.2s" repeatCount="indefinite" path="M512 170 C532 138 535 105 560 86" />
          </circle>
          <circle className="workflow-packet workflow-packet-4" r="4" fill="#00f0ff">
            <animateMotion begin="1.55s" dur="3.2s" repeatCount="indefinite" path="M512 206 C536 222 535 250 560 266" />
          </circle>
          <circle className="workflow-junction" cx="242" cy="112" r="4" fill="#00f0ff" />
          <circle className="workflow-junction" cx="430" cy="185" r="4" fill="#00f0ff" />
          <circle className="workflow-junction" cx="522" cy="86" r="4" fill="#00f0ff" />
          <circle className="workflow-junction" cx="522" cy="266" r="4" fill="#00f0ff" />
        </svg>

        {workflowNodes.map((node) => (
          <WorkflowNode key={node.label} node={node} />
        ))}

        <div className="absolute bottom-4 left-4 w-[196px] border border-[#1f2229] bg-[#111317]/95 p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#b9cacb]">Execution Log</span>
            <span className="workflow-status-dot h-2 w-2 bg-[#00f0ff]" />
          </div>
          <div className="space-y-2 font-mono text-[10px] text-[#b9cacb]">
            {workflowLog.map((item, index) => (
              <p key={item}>
                <span className={index === workflowLog.length - 1 ? 'text-[#00f0ff]' : 'text-[#00f0ff]'}>&gt;</span>{' '}
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}