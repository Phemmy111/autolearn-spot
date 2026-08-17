'use client'

import { FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { AlexFile } from '@/lib/alex/types'

interface AlexFileListProps {
  files: AlexFile[]
  onRemoveFile: (fileId: string) => void
  isMobile: boolean
}

export function AlexFileList({ files, onRemoveFile, isMobile }: AlexFileListProps) {
  if (files.length === 0) return null

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return <FileText className="h-4 w-4" />
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="h-4 w-4" />
    if (['txt', 'md', 'js', 'jsx', 'ts', 'tsx', 'json', 'css', 'html', 'py', 'java', 'c', 'cpp', 'cs'].includes(ext || '')) return <FileText className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
      case 'processing':
        return <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />
      default:
        return null
    }
  }

  return (
    <div className="px-4 py-2 bg-slate-900/30 border-b border-slate-800">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap gap-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2"
            >
              {getFileIcon(file.original_filename)}
              <span className={`text-sm ${isMobile ? 'text-xs' : ''} text-slate-300 truncate max-w-[${isMobile ? '100px' : '150px'}']}`}>
                {file.original_filename}
              </span>
              <span className={`text-xs text-slate-500 ${isMobile ? 'hidden' : ''}`}>
                ({formatFileSize(file.file_size)})
              </span>
              {getStatusIcon(file.status)}
              <button
                type="button"
                onClick={() => onRemoveFile(file.id)}
                className="text-slate-400 hover:text-white transition-colors"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
