import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#c0c4c9] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#10b981]">Student Portal</p>
          <h1 className="mt-2 font-heading text-2xl font-bold uppercase text-neutral-900">Sign In</h1>
          <p className="mt-2 font-mono text-sm text-[#b9cacb]">Access your AutoLearn Spot curriculum</p>
        </div>
        <SignIn
          appearance={{
            variables: {
              colorPrimary: '#00f0ff',
              colorBackground: '#1a1d24',
              colorInputBackground: '#111317',
              colorInputText: '#e2e8f2',
              borderRadius: '0px',
              fontFamily: 'monospace',
            },
            elements: {
              card: 'bg-[#c0c4c9] border border-[#3b494b] shadow-none rounded-none',
              headerTitle: 'text-neutral-900 font-mono',
              headerSubtitle: 'text-[#b9cacb] font-mono text-xs',
              formButtonPrimary: 'bg-[#10b981] text-black font-mono font-bold uppercase hover:bg-[#00d4e0] rounded-none',
              formFieldInput: 'bg-[#c0c4c9] border border-[#3b494b] text-neutral-900 font-mono rounded-none focus:border-[#10b981]',
              formFieldLabel: 'text-[#b9cacb] font-mono text-xs uppercase',
              footerActionLink: 'text-[#10b981] font-mono hover:text-[#00d4e0]',
              identityPreviewText: 'text-[#e2e8f2]',
              dividerLine: 'bg-[#3b494b]',
              dividerText: 'text-[#5d5f63] font-mono text-xs',
              socialButtonsBlockButton: 'border border-[#3b494b] bg-[#c0c4c9] text-neutral-900 font-mono hover:bg-[#c0c4c9] rounded-none',
              socialButtonsBlockButtonText: 'text-[#e2e8f2] font-mono text-xs',
            },
          }}
        />
      </div>
    </main>
  )
}
