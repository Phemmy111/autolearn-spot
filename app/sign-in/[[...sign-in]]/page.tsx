import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#111317] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#00f0ff]">Student Portal</p>
          <h1 className="mt-2 font-heading text-2xl font-bold uppercase text-white">Sign In</h1>
          <p className="mt-2 font-mono text-sm text-[#b9cacb]">Access your AutoLearn Spot curriculum</p>
        </div>
        <SignIn
          forceRedirectUrl="/dashboard"
          appearance={{
            variables: {
              colorPrimary: '#00f0ff',
              colorBackground: '#1a1d24',
              colorText: '#e2e8e2',
              colorInputBackground: '#111317',
              colorInputText: '#e2e8e2',
              borderRadius: '0px',
              fontFamily: 'monospace',
            },
            elements: {
              card: 'bg-[#1a1d24] border border-[#3b494b] shadow-none rounded-none',
              headerTitle: 'text-white font-mono',
              headerSubtitle: 'text-[#b9cacb] font-mono text-xs',
              formButtonPrimary: 'bg-[#00f0ff] text-black font-mono font-bold uppercase hover:bg-[#00d4e0] rounded-none',
              formFieldInput: 'bg-[#111317] border border-[#3b494b] text-white font-mono rounded-none focus:border-[#00f0ff]',
              formFieldLabel: 'text-[#b9cacb] font-mono text-xs uppercase',
              footerActionLink: 'text-[#00f0ff] font-mono hover:text-[#00d4e0]',
              identityPreviewText: 'text-[#e2e8e2]',
              dividerLine: 'bg-[#3b494b]',
              dividerText: 'text-[#5d5f63] font-mono text-xs',
              socialButtonsBlockButton: 'border border-[#3b494b] bg-[#111317] text-white font-mono hover:bg-[#1a1d24] rounded-none',
              socialButtonsBlockButtonText: 'text-[#e2e8e2] font-mono text-xs',
            },
          }}
        />
      </div>
    </main>
  )
}
