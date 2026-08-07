import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--primary)]">Student Portal</p>
          <h1 className="mt-2 font-heading text-2xl font-bold uppercase text-[var(--text-primary)]">Create Account</h1>
          <p className="mt-2 font-mono text-sm text-[var(--text-muted)]">Join AutoLearn Spot to access your curriculum</p>
        </div>
        <SignUp
          forceRedirectUrl="/dashboard"
          appearance={{
            variables: {
              colorPrimary: '#1877F2',
              colorBackground: '#FFFFFF',
              colorText: '#000000',
              colorInputBackground: '#F8FAFC',
              colorInputText: '#000000',
              borderRadius: '8px',
              fontFamily: 'monospace',
            },
            elements: {
              card: 'bg-[var(--card)] border border-[var(--border-default)] shadow-sm rounded-xl',
              headerTitle: 'text-[var(--text-primary)] font-mono',
              headerSubtitle: 'text-[var(--text-muted)] font-mono text-xs',
              formButtonPrimary: 'bg-[var(--primary)] text-white font-mono font-bold uppercase hover:bg-[var(--primary-hover)] rounded-lg',
              formFieldInput: 'bg-[var(--background)] border border-[var(--border-input)] text-[var(--text-primary)] font-mono rounded-lg focus:border-[var(--primary)]',
              formFieldLabel: 'text-[var(--text-muted)] font-mono text-xs uppercase',
              footerActionLink: 'text-[var(--primary)] font-mono hover:text-[var(--primary-hover)]',
              identityPreviewText: 'text-[var(--text-primary)]',
              dividerLine: 'bg-[var(--border-default)]',
              dividerText: 'text-[var(--text-muted)] font-mono text-xs',
              socialButtonsBlockButton: 'border border-[var(--border-default)] bg-[var(--background)] text-[var(--text-primary)] font-mono hover:bg-[var(--surface-hover)] rounded-lg',
              socialButtonsBlockButtonText: 'text-[var(--text-primary)] font-mono text-xs',
            },
          }}
        />
      </div>
    </main>
  )
}
