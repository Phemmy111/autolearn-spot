import { Loader2 } from 'lucide-react'

export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-[#00f0ff]" />
      <p className="font-mono text-xs uppercase tracking-widest text-[#b9cacb]">
        {message}
      </p>
    </div>
  )
}
