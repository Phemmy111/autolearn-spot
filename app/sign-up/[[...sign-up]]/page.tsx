import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#10b981]">Student Portal</p>
          <h1 className="mt-2 font-heading text-2xl font-bold uppercase text-neutral-900">Create Account</h1>
          <p className="mt-2 font-mono text-sm text-neutral-500">Join AutoLearn Spot to access your curriculum</p>
        </div>
        <SignUp
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
              card: 'bg-gray-100] border border-[#3b494b] shadow-none rounded-none',
              headerTitle: 'text-neutral-900 font-mono',
              headerSubtitle: 'text-neutral-500 font-mono text-xs',
              formButtonPrimary: 'bg-gray-100] text-black font-mono font-bold uppercase hover:bg-gray-100] rounded-none',
              formFieldInput: 'bg-gray-100] border border-[#3b494b] text-neutral-900 font-mono rounded-none focus:border-[#10b981]',
              formFieldLabel: 'text-neutral-500 font-mono text-xs uppercase',
              footerActionLink: 'text-[#10b981] font-mono hover:text-[#00d4e0]',
              identityPreviewText: 'text-[#e2e8e2]',
              dividerLine: 'bg-gray-100]',
              dividerText: 'text-[#5d5f63] font-mono text-xs',
              socialButtonsBlockButton: 'border border-[#3b494b] bg-gray-100] text-neutral-900 font-mono hover:bg-gray-100] rounded-none',
              socialButtonsBlockButtonText: 'text-[#e2e8e2] font-mono text-xs',
            },
          }}
        />
      </div>
    </main>
  )
}
