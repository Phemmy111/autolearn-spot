'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, AlertCircle, UserPlus } from 'lucide-react'

export function ManualEnrollmentForm({ cohorts }: { cohorts: any[] }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    clerkUserId: '',
    firstName: '',
    lastName: '',
    fullName: '',
    cohortId: cohorts.find(c => c.is_current)?.id || cohorts[0]?.id || '',
    status: 'active',
    reason: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/admin/enrollments/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create enrollment')
      }

      setSuccess(true)
      // Reset form but keep the cohort
      setFormData(prev => ({
        ...prev,
        email: '',
        clerkUserId: '',
        firstName: '',
        lastName: '',
        fullName: '',
        reason: '',
      }))
      
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }
      // Auto-generate fullName when firstName or lastName changes
      if (name === 'firstName' || name === 'lastName') {
        updated.fullName = `${updated.firstName} ${updated.lastName}`.trim()
      }
      return updated
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 bg-red-400/10 border border-red-400/20 p-4 rounded text-red-400">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p className="font-mono text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 bg-emerald-400/10 border border-emerald-400/20 p-4 rounded text-emerald-400">
          <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p className="font-mono text-sm">Successfully enrolled student.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="email" className="block font-mono text-sm text-[#b9cacb]">
            Student Email <span className="text-red-400">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="student@example.com"
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-[var(--surface-hover)] border border-[var(--border-input)] px-4 py-2 font-mono text-sm text-white focus:outline-none focus:border-[var(--primary)] rounded"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="cohortId" className="block font-mono text-sm text-[#b9cacb]">
            Cohort <span className="text-red-400">*</span>
          </label>
          <select
            id="cohortId"
            name="cohortId"
            required
            value={formData.cohortId}
            onChange={handleChange}
            className="w-full bg-[var(--surface-hover)] border border-[var(--border-input)] px-4 py-2 font-mono text-sm text-white focus:outline-none focus:border-[var(--primary)] rounded"
          >
            <option value="">Select a cohort</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.is_current ? '(Current)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="firstName" className="block font-mono text-sm text-[#b9cacb]">
            First Name <span className="text-red-400">*</span>
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            placeholder="John"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full bg-[var(--surface-hover)] border border-[var(--border-input)] px-4 py-2 font-mono text-sm text-white focus:outline-none focus:border-[var(--primary)] rounded"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="lastName" className="block font-mono text-sm text-[#b9cacb]">
            Last Name <span className="text-red-400">*</span>
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            placeholder="Doe"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full bg-[var(--surface-hover)] border border-[var(--border-input)] px-4 py-2 font-mono text-sm text-white focus:outline-none focus:border-[var(--primary)] rounded"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="fullName" className="block font-mono text-sm text-[#b9cacb]">
            Full Name (Auto-generated)
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="John Doe"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full bg-[var(--surface-hover)] border border-[var(--border-input)] px-4 py-2 font-mono text-sm text-white focus:outline-none focus:border-[var(--primary)] rounded"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="clerkUserId" className="block font-mono text-sm text-[#b9cacb]">
            Clerk User ID (Optional)
          </label>
          <input
            id="clerkUserId"
            name="clerkUserId"
            type="text"
            placeholder="user_2..."
            value={formData.clerkUserId}
            onChange={handleChange}
            className="w-full bg-[var(--surface-hover)] border border-[var(--border-input)] px-4 py-2 font-mono text-sm text-white focus:outline-none focus:border-[var(--primary)] rounded"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="block font-mono text-sm text-[#b9cacb]">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full bg-[var(--surface-hover)] border border-[var(--border-input)] px-4 py-2 font-mono text-sm text-white focus:outline-none focus:border-[var(--primary)] rounded"
          >
            <option value="active">Active (Access Granted)</option>
            <option value="inactive">Inactive (Access Denied)</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="reason" className="block font-mono text-sm text-[#b9cacb]">
          Reason / Notes (Optional)
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          placeholder="e.g. Scholarship Student, Staff Account"
          value={formData.reason}
          onChange={handleChange}
          className="w-full bg-[var(--surface-hover)] border border-[var(--border-input)] px-4 py-2 font-mono text-sm text-white focus:outline-none focus:border-[var(--primary)] rounded resize-none"
        />
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-[var(--primary)] text-black font-bold uppercase tracking-wider font-mono px-8 py-3 rounded hover:bg-white transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <UserPlus className="h-5 w-5" />
              Create Enrollment
            </>
          )}
        </button>
      </div>
    </form>
  )
}
