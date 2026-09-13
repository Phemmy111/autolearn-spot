import Image from 'next/image';
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--card)] brightness-95] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center flex flex-col items-center">
          <Image src="/logo.png" alt="AutoLearn Spot Logo" width={60} height={60} className="mb-4" />
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#10b981]">Student Portal</p>
          <h1 className="mt-2 font-heading text-2xl font-bold uppercase text-brand-text">Sign In</h1>
          <p className="mt-2 font-mono text-sm text-brand-text/60">Access your AutoLearn Spot curriculum</p>
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
              logoImage: 'hidden',
              logoBox: 'hidden',
              footerAction: 'hidden',
              watermark: 'hidden',
              card: 'bg-[var(--card)] brightness-95] border border-[#3b494b] shadow-none rounded-none',
              headerTitle: 'text-brand-text font-mono',
              headerSubtitle: 'text-brand-text/60 font-mono text-xs',
              formButtonPrimary: 'bg-[var(--card)] brightness-95] text-black font-mono font-bold uppercase hover:bg-[var(--card)] brightness-95] rounded-none',
              formFieldInput: 'bg-[var(--card)] brightness-95] border border-[#3b494b] text-brand-text font-mono rounded-none focus:border-[#10b981]',
              formFieldLabel: 'text-brand-text/60 font-mono text-xs uppercase',
              footerActionLink: 'text-[#10b981] font-mono hover:text-[#00d4e0]',
              identityPreviewText: 'text-[#e2e8f2]',
              dividerLine: 'bg-[var(--card)] brightness-95]',
              dividerText: 'text-[#5d5f63] font-mono text-xs',
              socialButtonsBlockButton: 'border border-[#3b494b] bg-[var(--card)] brightness-95] text-brand-text font-mono hover:bg-[var(--card)] brightness-95] rounded-none',
              socialButtonsBlockButtonText: 'text-[#e2e8f2] font-mono text-xs',
            },
          }}
        />
      </div>
    </main>
  )
}
