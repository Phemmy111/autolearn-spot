'use client'

import { useEffect, useRef, useState } from 'react'
import { Message, AlexFile } from '@/lib/alex/types'
import { Loader2, Bot, Copy, Check, AlertCircle, Sparkles, Lightbulb, BookOpen, Award, Workflow, Search, Zap, ThumbsUp, ThumbsDown, Edit2, X, FileText, Download, Package, CheckCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { AlexInteractiveQuestion } from './AlexInteractiveQuestion'
import { AlexArchitectureApproval } from './AlexArchitectureApproval'

interface AlexMessageListProps {
  messages: Message[]
  isLoading: boolean
  isGenerating?: boolean
  isMobile?: boolean
  onEditMessage?: (messageId: string, newContent: string) => void
  onRegenerateResponse?: (messageId: string) => void
  conversationId?: string // Phase 7: For artifact downloads
}

export function AlexMessageList({ messages, isLoading, isGenerating = false, isMobile = false, onEditMessage, onRegenerateResponse, conversationId }: AlexMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down' | null>>({})
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle code copy
  const handleCopyCode = (code: string, codeId: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(codeId)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Handle copy entire message
  const handleCopyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content)
    setCopiedCode(messageId)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Handle feedback
  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    setFeedback(prev => ({
      ...prev,
      [messageId]: prev[messageId] === type ? null : type
    }))
  }

  // Handle start edit
  const handleStartEdit = (messageId: string, content: string) => {
    setEditingMessageId(messageId)
    setEditContent(content)
  }

  // Handle save edit
  const handleSaveEdit = () => {
    if (editingMessageId && onEditMessage) {
      onEditMessage(editingMessageId, editContent)
    }
    setEditingMessageId(null)
    setEditContent('')
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditContent('')
  }

  // Generate code block ID
  const generateCodeId = () => `code-${Math.random().toString(36).substr(2, 9)}`

  // Handle direct download of code artifacts
  const handleDownloadCode = (code: string, language: string) => {
    const extMap: Record<string, string> = {
      html: 'html',
      htm: 'html',
      jsx: 'jsx',
      tsx: 'tsx',
      js: 'js',
      javascript: 'js',
      ts: 'ts',
      typescript: 'ts',
      json: 'json',
      css: 'css',
      python: 'py',
      py: 'py',
      sql: 'sql',
      sh: 'sh',
      bash: 'sh',
      yaml: 'yaml',
      yml: 'yml',
      markdown: 'md',
      md: 'md',
      svg: 'svg',
    }
    const ext = extMap[language.toLowerCase()] || (language ? language.toLowerCase() : 'txt')
    
    // Try to extract filename from the first line comment if present
    let filename = `artifact.${ext}`
    const firstLine = code.split('\n')[0].trim()
    const nameMatch = firstLine.match(/(?:filename:|file:|\/\/\s*|<!--\s*|#\s*)([a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)/i)
    if (nameMatch && nameMatch[1]) {
      filename = nameMatch[1]
    }

    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return <FileText className="h-4 w-4" />
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="h-4 w-4" />
    if (['txt', 'md', 'js', 'jsx', 'ts', 'tsx', 'json', 'css', 'html', 'py', 'java', 'c', 'cpp', 'cs'].includes(ext || '')) return <FileText className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Extract downloadable code artifacts from message content
  const getExtractedArtifacts = (content: string) => {
    if (!content) return []
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const artifacts: Array<{ id: string; filename: string; language: string; code: string; size: string }> = []
    let match
    let count = 1
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const lang = (match[1] || 'text').toLowerCase()
      const code = match[2].trim()
      if (!code || code.length < 20) continue

      const extMap: Record<string, string> = {
        html: 'html', htm: 'html',
        jsx: 'jsx', tsx: 'tsx',
        js: 'js', javascript: 'js',
        ts: 'ts', typescript: 'ts',
        json: 'json', css: 'css',
        python: 'py', py: 'py',
        sql: 'sql', sh: 'sh', bash: 'sh',
        yaml: 'yaml', yml: 'yml',
        markdown: 'md', md: 'md', svg: 'svg'
      }
      const ext = extMap[lang] || (lang ? lang : 'txt')

      let filename = `artifact_${count}.${ext}`
      const firstLine = code.split('\n')[0].trim()
      const nameMatch = firstLine.match(/(?:filename:|file:|\/\/\s*|<!--\s*|#\s*)([a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)/i)
      if (nameMatch && nameMatch[1]) {
        filename = nameMatch[1]
      } else if (lang === 'html' || lang === 'htm') {
        filename = `index.html`
      } else if (lang === 'json') {
        filename = `data.json`
      } else if (lang === 'tsx' || lang === 'jsx') {
        filename = `Component.${ext}`
      } else if (lang === 'css') {
        filename = `styles.css`
      } else if (lang === 'py' || lang === 'python') {
        filename = `script.py`
      } else if (lang === 'sql') {
        filename = `schema.sql`
      }

      const bytes = new Blob([code]).size
      const sizeStr = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`

      artifacts.push({
        id: `extracted-${count}-${Math.random().toString(36).substr(2, 5)}`,
        filename,
        language: lang,
        code,
        size: sizeStr
      })
      count++
    }
    return artifacts
  }

  // Phase 7: Handle artifact download
  const handleDownloadArtifact = async (artifactId: string, filename: string, downloadUrl?: string) => {
    try {
      const url = downloadUrl || `/api/alex/artifacts/${artifactId}/download`
      const response = await fetch(url)
      if (response.ok) {
        const blob = await response.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(blobUrl)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to download artifact:', error)
    }
  }

  // Phase 7: Render artifact workflow response
  const renderArtifactWorkflow = (workflowData: any) => {
    if (!workflowData) return null

    return (
      <div className="bg-gradient-to-br from-[#10b981]/10 to-[#059669]/10 border border-[#10b981]/30 rounded-xl p-4 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-5 w-5 text-[#10b981]" />
          <span className="font-semibold text-[#10b981]">Artifact Generation</span>
          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
            workflowData.status === 'completed' ? 'bg-[#10b981]/20 text-[#10b981]' :
            workflowData.status === 'failed' ? 'bg-red-500/20 text-red-400' :
            'bg-yellow-500/20 text-yellow-400'
          }`}>
            {workflowData.status}
          </span>
        </div>

        {workflowData.message && (
          <p className="text-sm text-slate-300 mb-3">{workflowData.message}</p>
        )}

        {/* Interactive Question UI */}
        {workflowData.question && (
          <>
            {workflowData.message && <div className="mb-2" />}
            <AlexInteractiveQuestion
              question={workflowData.question}
              onSelect={(value) => {
                // Do nothing here, AlexInteractiveQuestion already dispatches the 'alexQuestionAnswer' event
              }}
              disabled={isLoading}
            />
          </>
        )}

        {/* Architecture Approval UI */}
        {workflowData.architectureProposal && (
          <AlexArchitectureApproval
            architecture={workflowData.architectureProposal}
            conversationId={conversationId}
            onApprove={() => {
              const event = new CustomEvent('alexArchitectureApprove', { detail: {} })
              window.dispatchEvent(event)
            }}
            onModify={() => {
              const event = new CustomEvent('alexArchitectureModify', { detail: {} })
              window.dispatchEvent(event)
            }}
            onImprove={() => {
              const event = new CustomEvent('alexArchitectureImprove', { detail: {} })
              window.dispatchEvent(event)
            }}
            disabled={isLoading}
          />
        )}

        {workflowData.questions && workflowData.questions.length > 0 && !workflowData.question && (
          <div className="mb-3">
            <p className="text-sm text-slate-400 mb-2">I need more information:</p>
            <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
              {workflowData.questions.map((q: string, i: number) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        )}

        {workflowData.specification && (
          <div className="mb-3">
            <p className="text-sm text-slate-400 mb-2">Specification:</p>
            <pre className="bg-[#404040]/50 rounded-lg p-3 text-xs text-white/90 overflow-x-auto">
              {JSON.stringify(workflowData.specification, null, 2)}
            </pre>
          </div>
        )}

        {workflowData.artifacts && workflowData.artifacts.length > 0 && (
          <div>
            <p className="text-sm text-slate-400 mb-2">Generated files:</p>
            <div className="space-y-2">
              {workflowData.artifacts.map((artifact: any) => (
                <div
                  key={artifact.id}
                  className="flex items-center justify-between bg-[#404040]/50 rounded-lg p-3 hover:bg-[#505050]/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm text-slate-300">{artifact.filename}</span>
                    <span className="text-xs text-brand-text/60">({artifact.file_type})</span>
                    {artifact.validation_status === 'valid' && (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    )}
                  </div>
                  <button
                    onClick={() => handleDownloadArtifact(artifact.id, artifact.filename, artifact.download_url)}
                    className="px-3 py-1.5 bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] rounded-lg text-sm flex items-center gap-1 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Custom markdown components
  const MarkdownComponents = {
    // Code blocks with syntax highlighting
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : 'text'
      const codeId = generateCodeId()
      const codeString = String(children).replace(/\n$/, '')

      if (!inline && match) {
        return (
          <div className="relative group my-4">
            <div className="flex items-center justify-between bg-[#404040] px-4 py-2 rounded-t-lg border-b border-[#505050]">
              <span className="text-xs font-medium text-white/60 capitalize">{language}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownloadCode(codeString, language)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#10b981] transition-colors"
                  title="Download as file"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => handleCopyCode(codeString, codeId)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  {copiedCode === codeId ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={language}
              PreTag="div"
              className="!bg-[#404040] !rounded-b-lg !rounded-t-none !m-0 !p-4 text-sm overflow-x-auto"
              {...props}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        )
      }

      // Inline code
      return (
        <code className="bg-[#404040] text-[#10b981] px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      )
    },

    // Headings
    h1: ({ children }: any) => (
      <h1 className="text-xl font-bold text-brand-text mt-6 mb-3">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-lg font-semibold text-brand-text mt-5 mb-2">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-base font-medium text-brand-text mt-4 mb-2">{children}</h3>
    ),

    // Paragraphs
    p: ({ children }: any) => (
      <p className="text-slate-300 leading-relaxed mb-4">{children}</p>
    ),

    // Lists
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside text-slate-300 mb-4 space-y-1">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside text-slate-300 mb-4 space-y-1">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="ml-2">{children}</li>
    ),

    // Blockquotes
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-[#10b981]/30 pl-4 py-2 my-4 bg-[#404040]/30 rounded-r-lg">
        <p className="text-white/70 italic">{children}</p>
      </blockquote>
    ),

    // Links
    a: ({ href, children }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-cyan-400 hover:text-cyan-300 underline"
      >
        {children}
      </a>
    ),

    // Tables
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4 max-w-full -mx-3 px-3 sm:-mx-4 sm:px-4">
        <table className="min-w-full divide-y divide-slate-700 border border-slate-700 rounded-lg text-xs">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-[#404040]">{children}</thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="bg-[#2d2d2d]/50 divide-y divide-[#404040]">{children}</tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-[#404040]/50">{children}</tr>
    ),
    th: ({ children }: any) => (
      <th className="px-3 py-2 text-left text-[10px] font-medium text-white/60 uppercase tracking-wider">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-3 py-2 text-[11px] text-slate-300">{children}</td>
    ),

    // Horizontal rule
    hr: () => (
      <hr className="border-slate-700 my-6" />
    ),
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 touch-auto"
      style={{ height: '100%' }}
    >
      <div className={`mx-auto space-y-6 ${isMobile ? 'max-w-full' : 'max-w-3xl'}`}>
        {/* Empty State */}
        {messages.length === 0 && !isLoading && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-[#10b981]/20 blur-3xl rounded-full"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-[#10b981]/20 to-[#059669]/20 rounded-2xl flex items-center justify-center border border-[#10b981]/30">
                <Sparkles className="h-8 w-8 text-[#10b981]" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-[#10b981] mb-2">Welcome to ALEX</h2>
            <p className="text-slate-400 mb-6">Your AutoLearn Intelligence & Execution Agent</p>
            
            {/* Example Prompts */}
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              <button
                onClick={() => {
                  const textarea = document.querySelector('textarea') as HTMLTextAreaElement
                  if (textarea) {
                    textarea.value = "Check my course progress"
                    textarea.dispatchEvent(new Event('input', { bubbles: true }))
                    textarea.focus()
                  }
                }}
                className="px-4 py-2 bg-[#404040]/50 rounded-full text-sm text-white/90 border border-[#505050] hover:bg-[#505050]/50 hover:text-white transition-all"
              >
                <BookOpen className="h-4 w-4 inline mr-2" />
                Check my progress
              </button>
              <button
                onClick={() => {
                  const textarea = document.querySelector('textarea') as HTMLTextAreaElement
                  if (textarea) {
                    textarea.value = "What should I study next?"
                    textarea.dispatchEvent(new Event('input', { bubbles: true }))
                    textarea.focus()
                  }
                }}
                className="px-4 py-2 bg-[#404040]/50 rounded-full text-sm text-white/90 border border-[#505050] hover:bg-[#505050]/50 hover:text-white transition-all"
              >
                <Lightbulb className="h-4 w-4 inline mr-2" />
                What should I study next?
              </button>
              <button
                onClick={() => {
                  const textarea = document.querySelector('textarea') as HTMLTextAreaElement
                  if (textarea) {
                    textarea.value = "Tell me about my scholarship"
                    textarea.dispatchEvent(new Event('input', { bubbles: true }))
                    textarea.focus()
                  }
                }}
                className="px-4 py-2 bg-[#404040]/50 rounded-full text-sm text-white/90 border border-[#505050] hover:bg-[#505050]/50 hover:text-white transition-all"
              >
                <Award className="h-4 w-4 inline mr-2" />
                My scholarship status
              </button>
              <button
                onClick={() => {
                  const textarea = document.querySelector('textarea') as HTMLTextAreaElement
                  if (textarea) {
                    textarea.value = "Help me build an automation"
                    textarea.dispatchEvent(new Event('input', { bubbles: true }))
                    textarea.focus()
                  }
                }}
                className="px-4 py-2 bg-[#404040]/50 rounded-full text-sm text-white/90 border border-[#505050] hover:bg-[#505050]/50 hover:text-white transition-all"
              >
                <Workflow className="h-4 w-4 inline mr-2" />
                Build automation
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex gap-3 w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`min-w-0 w-full overflow-x-auto ${
                message.role === 'user'
                  ? 'rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-br from-[#10b981] to-[#059669] text-white shadow-lg shadow-[#10b981]/20 max-w-[85%] sm:max-w-xl mx-2'
                  : isMobile
                  ? 'w-full px-0 py-4 text-white text-lg leading-relaxed'
                  : 'rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 bg-[#2d2d2d] backdrop-blur-sm border border-[#404040] text-white w-full max-w-full sm:max-w-2xl md:max-w-3xl mx-2'
              }`}
            >
              <div className="flex flex-col gap-3">
                {/* Display attachments for user messages */}
                {message.role === 'user' && message.attached_files && message.attached_files.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {message.attached_files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 bg-[#404040]/20 rounded-lg px-3 py-2"
                      >
                        {getFileIcon(file.original_filename)}
                        <span className="text-sm text-brand-text truncate max-w-[150px]">
                          {file.original_filename}
                        </span>
                        <span className="text-xs text-slate-700">
                          ({formatFileSize(file.file_size)})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {message.role === 'assistant' ? (
                    <>
                      {/* Phase 7: Check for artifact workflow response in workflowData */}
                      {(message as any).workflowData ? (
                        <>
                          {renderArtifactWorkflow((message as any).workflowData)}
                          {/* Also render any text content */}
                          {message.content && (
                            <div className={`prose prose-invert max-w-none ${
                            isMobile 
                              ? 'prose-lg prose-headings:text-white prose-p:text-white/90 prose-strong:text-white prose-code:text-[#10b981] prose-pre:bg-[#404040] text-lg' 
                              : 'prose-sm prose-headings:text-white prose-p:text-white/90 prose-strong:text-white prose-code:text-[#10b981] prose-pre:bg-[#404040]'
                          }`}>
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={MarkdownComponents}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className={`prose prose-invert max-w-none ${
                            isMobile 
                              ? 'prose-lg prose-headings:text-white prose-p:text-white/90 prose-strong:text-white prose-code:text-[#10b981] prose-pre:bg-[#404040] text-lg' 
                              : 'prose-sm prose-headings:text-white prose-p:text-white/90 prose-strong:text-white prose-code:text-[#10b981] prose-pre:bg-[#404040]'
                          }`}>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={MarkdownComponents}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                          
                          {/* Phase 7: Render artifacts if present */}
                          {message.artifacts && message.artifacts.length > 0 ? (
                            <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                              <p className="text-sm text-slate-400 mb-3 flex items-center gap-2">
                                <Package className="h-4 w-4 text-cyan-400" />
                                Generated files ready for download:
                              </p>
                              <div className="space-y-2">
                                {message.artifacts.map((artifact: any) => (
                                  <div
                                    key={artifact.id}
                                    className="flex items-center justify-between bg-[#404040]/50 rounded-lg p-3 hover:bg-[#505050]/50 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-[#10b981]" />
                                      <span className="text-sm text-white/90">{artifact.filename}</span>
                                      <span className="text-xs text-white/60">({artifact.file_type})</span>
                                    </div>
                                    <button
                                      onClick={() => handleDownloadArtifact(artifact.id, artifact.filename, artifact.download_url)}
                                      className="px-3 py-1.5 bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] rounded-lg text-sm flex items-center gap-1 transition-colors"
                                    >
                                      <Download className="h-4 w-4" />
                                      Download
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            (() => {
                              const extracted = getExtractedArtifacts(message.content || '')
                              if (extracted.length === 0) return null
                              return (
                                <div className="mt-4 p-4 bg-[#232323] rounded-xl border border-[#383838]">
                                  <p className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                                    <Package className="h-4 w-4 text-[#10b981]" />
                                    Downloadable Artifacts ({extracted.length}):
                                  </p>
                                  <div className="space-y-2">
                                    {extracted.map((art) => (
                                      <div
                                        key={art.id}
                                        className="flex items-center justify-between bg-[#2d2d2d] rounded-lg p-3 border border-[#404040] hover:border-[#10b981]/50 transition-colors"
                                      >
                                        <div className="flex items-center gap-2.5">
                                          <div className="p-2 bg-[#10b981]/10 rounded-lg">
                                            <FileText className="h-4 w-4 text-[#10b981]" />
                                          </div>
                                          <div>
                                            <div className="text-sm font-medium text-white">{art.filename}</div>
                                            <div className="text-xs text-white/50">{art.language.toUpperCase()} • {art.size}</div>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => handleDownloadCode(art.code, art.language)}
                                          className="px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md hover:shadow-[#10b981]/20 active:scale-95"
                                        >
                                          <Download className="h-3.5 w-3.5" />
                                          Download File
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })()
                          )}
                        </>
                      )}
                    </>
                  ) : editingMessageId === message.id ? (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-[#404040]/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 resize-none"
                      rows={3}
                      autoFocus
                    />
                  ) : (
                    <p className="text-white leading-relaxed">{message.content}</p>
                  )}
                </div>
                {message.role === 'assistant' && (
                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-[#404040]/50">
                    <button
                      onClick={() => handleCopyMessage(message.content, message.id)}
                      className="p-1.5 text-white/60 hover:text-[#10b981] transition-colors"
                      title="Copy response"
                    >
                      {copiedCode === message.id ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleFeedback(message.id, 'up')}
                      className={`p-1.5 transition-colors ${feedback[message.id] === 'up' ? 'text-green-400' : 'text-white/60 hover:text-green-400'}`}
                      title="Helpful"
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleFeedback(message.id, 'down')}
                      className={`p-1.5 transition-colors ${feedback[message.id] === 'down' ? 'text-red-400' : 'text-white/60 hover:text-red-400'}`}
                      title="Not helpful"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                    {onRegenerateResponse && index === messages.length - 1 && message.role === 'assistant' && (
                      <button
                        onClick={() => onRegenerateResponse(message.id)}
                        className="p-1.5 text-white/60 hover:text-[#10b981] transition-colors"
                        title="Regenerate response"
                      >
                        <Zap className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
                {message.role === 'user' && editingMessageId !== message.id && (
                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-[#404040]/30">
                    <button
                      onClick={() => handleCopyMessage(message.content, message.id)}
                      className="p-1.5 text-white/60 hover:text-[#10b981] transition-colors"
                      title="Copy message"
                    >
                      {copiedCode === message.id ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    {onEditMessage && (
                      <button
                        onClick={() => handleStartEdit(message.id, message.content)}
                        className="p-1.5 text-white/60 hover:text-[#10b981] transition-colors"
                        title="Edit message"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
                {message.role === 'user' && editingMessageId === message.id && (
                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-600/30">
                    <button
                      onClick={handleSaveEdit}
                      className="p-1.5 text-slate-700 hover:text-green-400 transition-colors"
                      title="Save"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1.5 text-slate-700 hover:text-red-400 transition-colors"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        ))}

        {/* Loading State */}
        {(isLoading || isGenerating) && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
                <Bot className="h-4 w-4 text-cyan-400" />
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                <span className="text-sm text-slate-400">
                  {isGenerating ? 'Thinking...' : 'Loading...'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {messages.some(m => m.content.startsWith('Error:')) && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/30">
                <AlertCircle className="h-4 w-4 text-red-400" />
              </div>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
              <p className="text-sm text-red-400">
                Something went wrong. Please try again.
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
