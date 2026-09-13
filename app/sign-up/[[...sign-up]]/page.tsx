import Image from 'next/image';
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-bg px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center flex flex-col items-center">
          <Image src="/logo.png" alt="AutoLearn Spot Logo" width={60} height={60} className="mb-4" />
          <p className="font-semibold text-xs uppercase tracking-wider text-[#10b981]">Student Portal</p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold text-brand-text">Create Account</h1>
          <p className="mt-2 text-sm text-brand-text/60">Join AutoLearn Spot to access your curriculum</p>
        </div>
        
        <div className="bg-[var(--card)] brightness-95 rounded-2xl shadow-sm border border-brand-border/60 overflow-hidden">
          <SignUp
            forceRedirectUrl="/dashboard"
            appearance={{
              layout: {
                socialButtonsPlacement: 'top',
                socialButtonsVariant: 'blockButton',
              },
              variables: {
                colorPrimary: '#10b981',
                colorBackground: 'transparent',
                colorInputBackground: '#ffffff',
                colorInputText: '#111827',
                colorText: '#111827',
                colorTextSecondary: '#6b7280',
                borderRadius: '0.75rem',
                fontFamily: 'inherit',
              },
              elements: {
                logoImage: 'hidden',
                logoBox: 'hidden',
                header: 'hidden', // Hide the internal Clerk header, we built our own above
                card: 'shadow-none bg-transparent m-0 p-8 w-full',
                formButtonPrimary: 'bg-[#10b981] hover:bg-[#0ea5e9] text-white font-bold transition-all',
                formFieldInput: 'bg-white border-gray-200 text-gray-900 focus:border-[#10b981] focus:ring-[#10b981]',
                formFieldLabel: 'text-gray-700 font-medium',
                footerActionLink: 'text-[#10b981] hover:text-[#0ea5e9] font-medium',
                identityPreviewText: 'text-gray-900',
                dividerLine: 'bg-gray-200',
                dividerText: 'text-gray-500',
                socialButtonsBlockButton: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors',
                socialButtonsBlockButtonText: 'text-gray-700 font-medium',
                footer: 'bg-transparent border-t border-gray-100',
              },
            }}
          />
        </div>
      </div>
    </main>
  )
}
