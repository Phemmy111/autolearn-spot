'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import {
  Wallet,
  ArrowUpRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  CreditCard,
  Info
} from 'lucide-react'

interface Withdrawal {
  id: string
  amount: number
  currency: string
  status: string
  provider: string
  provider_reference: string | null
  requested_at: string
  processed_at: string | null
  failure_reason: string | null
  admin_note: string | null
}

export default function AuthorWithdrawalsPage() {
  const { userId } = useAuth()
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [requestAmount, setRequestAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      fetchData()
    }
  }, [userId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch available balance
      const balanceRes = await fetch('/api/author/financial-summary')
      const balanceData = await balanceRes.json()
      if (balanceData.success) {
        setAvailableBalance(balanceData.available_balance || 0)
      }

      // Fetch withdrawals
      const res = await fetch('/api/author/withdrawals')
      const data = await res.json()

      if (data.success) {
        setWithdrawals(data.withdrawals)
      } else {
        setError(data.error || 'Failed to load withdrawals')
      }
    } catch (err) {
      setError('Network error loading withdrawals')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(null)
    setIsSubmitting(true)

    try {
      const amount = parseFloat(requestAmount)
      
      const res = await fetch('/api/author/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      })

      const data = await res.json()

      if (data.success) {
        setSubmitSuccess('Withdrawal request submitted successfully')
        setRequestAmount('')
        fetchData() // Refresh data
      } else {
        setSubmitError(data.error || 'Failed to submit withdrawal request')
      }
    } catch (err) {
      setSubmitError('Network error submitting withdrawal request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'PENDING': return <Clock className="w-4 h-4 text-amber-500" />
      case 'APPROVED': return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'PROCESSING': return <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
      case 'PAID': return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'FAILED': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'REJECTED': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-neutral-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-amber-50 text-amber-700'
      case 'APPROVED': return 'bg-blue-50 text-blue-700'
      case 'PROCESSING': return 'bg-purple-50 text-purple-700'
      case 'PAID': return 'bg-emerald-50 text-emerald-700'
      case 'FAILED': return 'bg-red-50 text-red-700'
      case 'REJECTED': return 'bg-red-50 text-red-700'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--card)]">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center text-brand-text/60 py-12">Loading withdrawals...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--card)]">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-text">Withdrawals</h1>
          <p className="text-sm text-brand-text/70 mt-1">
            Request and track your withdrawal requests
          </p>
        </div>

        {/* Available Balance Card */}
        <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-900/50 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-100">Available Balance</span>
              </div>
              <p className="text-4xl font-bold text-emerald-50">
                {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(availableBalance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-200 mb-1">Minimum withdrawal</p>
              <p className="text-lg font-semibold text-emerald-100">₦1,000</p>
            </div>
          </div>
        </div>

        {/* Withdrawal Request Form */}
        <div className="bg-[var(--card)] brightness-95 border border-brand-border rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <ArrowUpRight className="w-6 h-6 text-sky-600" />
            <h2 className="text-xl font-semibold text-brand-text">Request Withdrawal</h2>
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {submitError}
            </div>
          )}

          {submitSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              {submitSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-brand-text mb-2">
                Amount (₦)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/60 font-medium">₦</span>
                <input
                  type="number"
                  id="amount"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1000"
                  step="100"
                  required
                  className="w-full pl-8 pr-4 py-3 rounded-lg border border-brand-border bg-brand-bg text-brand-text placeholder-brand-text/50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-brand-text/60 mt-1">
                Available: {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(availableBalance)}
              </p>
            </div>

            <div className="flex items-start gap-3 p-4 bg-sky-50 border border-sky-200 rounded-lg">
              <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-sky-800">
                <p className="font-medium mb-1">Withdrawal Information</p>
                <ul className="space-y-1 text-sky-700">
                  <li>• Minimum withdrawal: ₦1,000</li>
                  <li>• Processing time: 1-3 business days</li>
                  <li>• Funds will be transferred to your registered bank account</li>
                  <li>• You'll receive email notifications for status updates</li>
                </ul>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !requestAmount || parseFloat(requestAmount) > availableBalance}
              className="flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Request Withdrawal
                </>
              )}
            </button>
          </form>
        </div>

        {/* Withdrawal History */}
        <div className="bg-[var(--card)] brightness-95 border border-brand-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-brand-text mb-6">Withdrawal History</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brand-text mb-2">No withdrawals yet</h3>
              <p className="text-brand-text/60">
                Your withdrawal history will appear here once you request a withdrawal
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-brand-border text-sm text-brand-text/60">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border text-sm">
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="hover:bg-brand-bg/50 transition-colors">
                      <td className="py-4 text-brand-text">
                        {new Date(withdrawal.requested_at).toLocaleDateString('en-NG', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 font-medium text-brand-text">
                        {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(withdrawal.amount)}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(withdrawal.status)}
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(withdrawal.status)}`}>
                            {withdrawal.status.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-brand-text/60 font-mono text-xs text-right">
                        {withdrawal.provider_reference || withdrawal.id.split('-')[0]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
