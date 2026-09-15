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
  XCircle
} from 'lucide-react'

interface Transaction {
  id: string
  type: string
  amount: number
  currency: string
  description: string | null
  created_at: string
  related_id: string | null
}

export default function AuthorTransactionsPage() {
  const { userId } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [total, setTotal] = useState(0)

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
      t.type.toLowerCase().includes(q)
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
      case 'SALE_CREDIT':
        return 'Sale'
      case 'REFUND_DEBIT':
        return 'Refund'
      case 'WITHDRAWAL_DEBIT':
        return 'Withdrawal'
      case 'WITHDRAWAL_REVERSAL':
        return 'Reversal'
      case 'ADMIN_CREDIT':
        return 'Admin Credit'
      case 'ADMIN_DEBIT':
        return 'Admin Debit'
      default:
        return type
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
              {total} transaction{total !== 1 ? 's' : ''}
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
                <div
                  key={transaction.id}
                  className="sm:grid sm:grid-cols-[200px_1fr_140px_100px] gap-4 px-6 py-4 items-center hover:bg-brand-bg/50 transition-colors"
                >
                  {/* Type */}
                  <div className="flex items-center gap-2 mb-2 sm:mb-0">
                    {getTransactionIcon(transaction.type)}
                    <span className="text-sm font-medium text-brand-text">
                      {getTransactionTypeLabel(transaction.type)}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="text-sm text-brand-text/70 mb-2 sm:mb-0 truncate">
                    {transaction.description || 'No description'}
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
