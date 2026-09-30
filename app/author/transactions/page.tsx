'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  X,
  Info,
  User,
  BookOpen,
  Receipt,
  Banknote,
  Share2
} from 'lucide-react'

interface Transaction {
  id: string
  type: string
  amount: number
  currency: string
  description: string | null
  created_at: string
  related_id: string | null
  // enriched fields from API
  course_title?: string | null
  student_name?: string | null
  student_email?: string | null
  gross_amount?: number | null
  platform_commission?: number | null
  platform_commission_rate?: number | null
  affiliate_commission?: number | null
  affiliate_commission_rate?: number | null
  affiliate_name?: string | null
  net_amount?: number | null
  withdrawal_reference?: string | null
  bank_name?: string | null
}

function DetailRow({ icon, label, value, valueClass = '' }: { icon: React.ReactNode; label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-brand-border last:border-0">
      <div className="flex items-center gap-2 text-sm text-brand-text/60 min-w-0">
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className={`text-sm font-semibold text-right max-w-[55%] break-words ${valueClass || 'text-brand-text'}`}>
        {value}
      </div>
    </div>
  )
}

function TransactionDetailModal({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
  const isCredit = transaction.type === 'SALE_CREDIT' || transaction.type === 'ADMIN_CREDIT' || transaction.type === 'WITHDRAWAL_REVERSAL'

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'SALE_CREDIT': return 'Course Sale'
      case 'REFUND_DEBIT': return 'Refund Deducted'
      case 'WITHDRAWAL_DEBIT': return 'Withdrawal Processed'
      case 'WITHDRAWAL_REVERSAL': return 'Withdrawal Reversed'
      case 'ADMIN_CREDIT': return 'Admin Credit'
      case 'ADMIN_DEBIT': return 'Admin Debit'
      default: return type
    }
  }

  const getTypeDescription = (t: Transaction) => {
    switch (t.type) {
      case 'SALE_CREDIT':
        return `A student purchased your course and your earnings were credited after platform and affiliate commissions.`
      case 'REFUND_DEBIT':
        return `A refund was issued for one of your course purchases. The amount was deducted from your balance.`
      case 'WITHDRAWAL_DEBIT':
        return `You requested a withdrawal. The amount was deducted from your available balance and is being processed.`
      case 'WITHDRAWAL_REVERSAL':
        return `A withdrawal request was reversed. The amount was returned to your available balance.`
      case 'ADMIN_CREDIT':
        return `An administrator manually credited your account.`
      case 'ADMIN_DEBIT':
        return `An administrator manually deducted from your account.`
      default:
        return t.description || 'Transaction recorded.'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--card)] border border-brand-border rounded-2xl max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isCredit ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              {isCredit
                ? <ArrowUpRight className={`w-5 h-5 ${transaction.type === 'WITHDRAWAL_REVERSAL' ? 'text-blue-500' : 'text-emerald-500'}`} />
                : <ArrowDownLeft className="w-5 h-5 text-red-500" />
              }
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-text">{getTypeLabel(transaction.type)}</h3>
              <p className="text-xs text-brand-text/50">
                {new Date(transaction.created_at).toLocaleDateString('en-NG', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-brand-text/40 hover:text-brand-text hover:bg-brand-bg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Banner */}
        <div className={`mx-6 mt-5 mb-4 rounded-2xl px-5 py-4 ${isCredit ? 'bg-emerald-500/8 border border-emerald-500/20' : 'bg-red-500/8 border border-red-500/20'}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-text/50 mb-1">
            {isCredit ? 'Amount Credited' : 'Amount Deducted'}
          </p>
          <p className={`text-3xl font-black ${isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
            {isCredit ? '+' : '-'}₦{transaction.amount.toLocaleString()}
          </p>
        </div>

        {/* Detail Rows */}
        <div className="px-6 pb-2">
          {/* What happened summary */}
          <div className="flex items-start gap-2 bg-brand-bg/60 border border-brand-border rounded-xl p-3 mb-4">
            <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
            <p className="text-xs text-brand-text/70 leading-relaxed">{getTypeDescription(transaction)}</p>
          </div>

          {/* Course info — SALE_CREDIT */}
          {transaction.type === 'SALE_CREDIT' && (
            <>
              {transaction.course_title && (
                <DetailRow
                  icon={<BookOpen className="w-4 h-4" />}
                  label="Course"
                  value={transaction.course_title}
                />
              )}
              {transaction.student_name && (
                <DetailRow
                  icon={<User className="w-4 h-4" />}
                  label="Student"
                  value={<span>{transaction.student_name}<span className="text-brand-text/40 font-normal ml-1 text-xs">({transaction.student_email})</span></span>}
                />
              )}

              {/* Visual breakdown */}
              {transaction.gross_amount != null && (
                <div className="mt-3 mb-1 rounded-xl border border-brand-border overflow-hidden">
                  {/* Course price */}
                  <div className="flex items-center justify-between px-4 py-3 bg-brand-bg/40">
                    <div className="flex items-center gap-2 text-sm text-brand-text/70">
                      <DollarSign className="w-4 h-4 text-brand-text/40" />
                      <span>Course Price</span>
                    </div>
                    <span className="text-sm font-bold text-brand-text">
                      ₦{transaction.gross_amount.toLocaleString()}
                    </span>
                  </div>

                  {/* Platform commission */}
                  {transaction.platform_commission != null && transaction.platform_commission > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border bg-red-500/4">
                      <div className="flex items-center gap-2 text-sm text-brand-text/70">
                        <Receipt className="w-4 h-4 text-red-400" />
                        <span>Platform{transaction.platform_commission_rate != null ? ` (${transaction.platform_commission_rate}%)` : ''}</span>
                      </div>
                      <span className="text-sm font-semibold text-red-500">
                        − ₦{transaction.platform_commission.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Affiliate commission */}
                  {transaction.affiliate_commission != null && transaction.affiliate_commission > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border bg-orange-500/4">
                      <div className="flex items-center gap-2 text-sm text-brand-text/70">
                        <Share2 className="w-4 h-4 text-orange-400" />
                        <span>
                          Affiliate{transaction.affiliate_commission_rate != null ? ` (${transaction.affiliate_commission_rate}%)` : ''}
                          {transaction.affiliate_name && (
                            <span className="ml-1 text-xs text-brand-text/40">· {transaction.affiliate_name}</span>
                          )}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-orange-500">
                        − ₦{transaction.affiliate_commission.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Net earnings — highlighted */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-emerald-500/30 bg-emerald-500/8">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                      <Banknote className="w-4 h-4" />
                      <span>Your Earnings</span>
                    </div>
                    <span className="text-base font-black text-emerald-600">
                      ₦{transaction.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Fallback if no gross_amount enriched */}
              {transaction.gross_amount == null && (
                <DetailRow
                  icon={<Banknote className="w-4 h-4" />}
                  label="Your Net Earnings"
                  value={`₦${transaction.amount.toLocaleString()}`}
                  valueClass="text-emerald-600"
                />
              )}
            </>
          )}

          {/* Withdrawal info */}
          {(transaction.type === 'WITHDRAWAL_DEBIT' || transaction.type === 'WITHDRAWAL_REVERSAL') && (
            <>
              {transaction.bank_name && (
                <DetailRow
                  icon={<Banknote className="w-4 h-4" />}
                  label="Bank"
                  value={transaction.bank_name}
                />
              )}
              {transaction.withdrawal_reference && (
                <DetailRow
                  icon={<Receipt className="w-4 h-4" />}
                  label="Reference"
                  value={<span className="font-mono text-xs">{transaction.withdrawal_reference}</span>}
                />
              )}
            </>
          )}

          {/* Transaction ID */}
          <DetailRow
            icon={<Info className="w-4 h-4" />}
            label="Transaction ID"
            value={<span className="font-mono text-xs text-brand-text/50">{transaction.id}</span>}
          />

          {/* Full description if present and not already explained */}
          {transaction.description && transaction.type !== 'SALE_CREDIT' && (
            <DetailRow
              icon={<Info className="w-4 h-4" />}
              label="Details"
              value={transaction.description}
              valueClass="text-brand-text/70 font-normal text-xs"
            />
          )}
        </div>

        <div className="px-6 pb-5 pt-3">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-brand-border text-sm font-semibold text-brand-text/70 hover:bg-brand-bg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AuthorTransactionsPage() {
  const { userId } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [total, setTotal] = useState(0)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  useEffect(() => {
    if (userId) fetchTransactions()
  }, [userId, typeFilter])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const url = typeFilter === 'all'
        ? '/api/author/transactions'
        : `/api/author/transactions?type=${typeFilter}`

      const res = await fetch(url)
      const data = await res.json()

      if (data.success) {
        setTransactions(data.transactions)
        setTotal(data.total)
      } else {
        setError(data.error || 'Failed to load transactions')
      }
    } catch (err) {
      setError('Network error loading transactions')
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    const q = searchQuery.toLowerCase()
    return (
      t.description?.toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q) ||
      t.course_title?.toLowerCase().includes(q)
    )
  })

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'SALE_CREDIT':
        return <ArrowUpRight className="w-4 h-4 text-emerald-500" />
      case 'REFUND_DEBIT':
        return <ArrowDownLeft className="w-4 h-4 text-red-500" />
      case 'WITHDRAWAL_DEBIT':
        return <ArrowDownLeft className="w-4 h-4 text-orange-500" />
      case 'WITHDRAWAL_REVERSAL':
        return <RefreshCw className="w-4 h-4 text-blue-500" />
      case 'ADMIN_CREDIT':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'ADMIN_DEBIT':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <DollarSign className="w-4 h-4 text-neutral-500" />
    }
  }

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'SALE_CREDIT': return 'Sale'
      case 'REFUND_DEBIT': return 'Refund'
      case 'WITHDRAWAL_DEBIT': return 'Withdrawal'
      case 'WITHDRAWAL_REVERSAL': return 'Reversal'
      case 'ADMIN_CREDIT': return 'Admin Credit'
      case 'ADMIN_DEBIT': return 'Admin Debit'
      default: return type
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'SALE_CREDIT':
      case 'ADMIN_CREDIT':
        return 'text-emerald-600'
      case 'REFUND_DEBIT':
      case 'WITHDRAWAL_DEBIT':
      case 'ADMIN_DEBIT':
        return 'text-red-600'
      case 'WITHDRAWAL_REVERSAL':
        return 'text-blue-600'
      default:
        return 'text-neutral-600'
    }
  }

  const formatAmount = (amount: number, type: string) => {
    const isCredit = type === 'SALE_CREDIT' || type === 'ADMIN_CREDIT' || type === 'WITHDRAWAL_REVERSAL'
    const sign = isCredit ? '+' : '-'
    return `${sign}₦${amount.toLocaleString()}`
  }

  const getDescriptionSummary = (t: Transaction) => {
    if (t.course_title) return `Sale of "${t.course_title}"`
    if (t.description) return t.description
    return '—'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--card)]">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center text-brand-text/60 py-12">Loading transactions...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--card)]">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-text">Transactions</h1>
            <p className="text-sm text-brand-text/70 mt-1">
              {total} transaction{total !== 1 ? 's' : ''} · Click any row to see the full breakdown
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text/60" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-brand-border bg-brand-bg text-brand-text placeholder-brand-text/50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text/60" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-10 pr-8 py-3 rounded-lg border border-brand-border bg-brand-bg text-brand-text focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="SALE_CREDIT">Sales</option>
              <option value="REFUND_DEBIT">Refunds</option>
              <option value="WITHDRAWAL_DEBIT">Withdrawals</option>
              <option value="WITHDRAWAL_REVERSAL">Reversals</option>
              <option value="ADMIN_CREDIT">Admin Credits</option>
              <option value="ADMIN_DEBIT">Admin Debits</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <div className="bg-[var(--card)] rounded-xl border border-brand-border p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-brand-bg rounded-full">
                <DollarSign className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-brand-text">
                {searchQuery || typeFilter !== 'all' ? 'No transactions match your search' : 'No transactions yet'}
              </h3>
              <p className="text-brand-text/60">
                {searchQuery || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Your transaction history will appear here once you start making sales'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-[var(--card)] rounded-xl border border-brand-border overflow-hidden">
            {/* Table Header */}
            <div className="hidden sm:grid sm:grid-cols-[200px_1fr_140px_100px] gap-4 px-6 py-3 bg-brand-bg border-b border-brand-border text-xs font-semibold text-brand-text/60 uppercase tracking-wider">
              <span>Type</span>
              <span>Description</span>
              <span>Amount</span>
              <span>Date</span>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-brand-border">
              {filteredTransactions.map((transaction) => (
                <button
                  key={transaction.id}
                  onClick={() => setSelectedTransaction(transaction)}
                  className="w-full text-left sm:grid sm:grid-cols-[200px_1fr_140px_100px] gap-4 px-6 py-4 items-center hover:bg-brand-bg/50 transition-colors cursor-pointer group"
                >
                  {/* Type */}
                  <div className="flex items-center gap-2 mb-2 sm:mb-0">
                    {getTransactionIcon(transaction.type)}
                    <span className="text-sm font-medium text-brand-text group-hover:text-sky-600 transition-colors">
                      {getTransactionTypeLabel(transaction.type)}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="text-sm text-brand-text/70 mb-2 sm:mb-0 truncate">
                    {getDescriptionSummary(transaction)}
                  </div>

                  {/* Amount */}
                  <div className={`text-sm font-semibold mb-2 sm:mb-0 ${getTransactionTypeColor(transaction.type)}`}>
                    {formatAmount(transaction.amount, transaction.type)}
                  </div>

                  {/* Date */}
                  <div className="text-sm text-brand-text/60">
                    {new Date(transaction.created_at).toLocaleDateString('en-NG', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  )
}
