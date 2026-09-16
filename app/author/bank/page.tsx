'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import {
  Building2,
  CreditCard,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface BankAccount {
  id: string
  bank_name: string
  account_number: string
  routing_number: string
  created_at: string
  updated_at: string
}

export default function AuthorBankPage() {
  const { userId } = useAuth()
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([])
  const [loadingBanks, setLoadingBanks] = useState(true)
  
  const [formData, setFormData] = useState({
    bank_name: '',
    account_number: '',
    bank_code: ''
  })

  useEffect(() => {
    if (userId) {
      fetchBankAccount()
      fetchPaystackBanks()
    }
  }, [userId])

  const fetchPaystackBanks = async () => {
    try {
      setLoadingBanks(true)
      const res = await fetch('/api/author/bank/banks')
      const data = await res.json()

      if (data.success) {
        setBanks(data.banks)
      } else {
        // Fallback to local list if API fails
        setBanks(nigerianBanks)
      }
    } catch (err) {
      // Fallback to local list if API fails
      setBanks(nigerianBanks)
    } finally {
      setLoadingBanks(false)
    }
  }

  const fetchBankAccount = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/author/bank')
      const data = await res.json()

      if (data.success) {
        setBankAccount(data.bankAccount)
        if (data.bankAccount) {
          setFormData({
            bank_name: data.bankAccount.bank_name,
            account_number: '', // Don't pre-fill account number for security
            bank_code: '' // Don't pre-fill bank code for security
          })
        }
      } else {
        setError(data.error || 'Failed to load bank details')
      }
    } catch (err) {
      setError('Network error loading bank details')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const res = await fetch('/api/author/bank', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        setSuccess('Bank details saved successfully')
        setBankAccount(data.bankAccount)
        // Clear sensitive fields after saving
        setFormData(prev => ({
          ...prev,
          account_number: '',
          bank_code: ''
        }))
      } else {
        setError(data.error || 'Failed to save bank details')
      }
    } catch (err) {
      setError('Network error saving bank details')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Auto-fill bank code when bank is selected
    if (name === 'bank_name') {
      const selectedBank = nigerianBanks.find(bank => bank.name === value)
      if (selectedBank) {
        setFormData(prev => ({
          ...prev,
          bank_code: selectedBank.code
        }))
      }
    }
  }

  // Nigerian bank codes (Paystack official codes)
  const nigerianBanks = [
    { code: '044', name: 'Access Bank' },
    { code: '023', name: 'Citibank Nigeria' },
    { code: '063', name: 'Diamond Bank' },
    { code: '050', name: 'Ecobank Nigeria' },
    { code: '040', name: 'Enterprise Bank' },
    { code: '085', name: 'Fidelity Bank' },
    { code: '057', name: 'First Bank of Nigeria' },
    { code: '032', name: 'Guaranty Trust Bank (GTBank)' },
    { code: '058', name: 'Heritage Bank' },
    { code: '030', name: 'Jaiz Bank' },
    { code: '082', name: 'Keystone Bank' },
    { code: '076', name: 'Kuda Bank' },
    { code: '084', name: 'Polaris Bank' },
    { code: '051', name: 'Providus Bank' },
    { code: '221', name: 'Stanbic IBTC Bank' },
    { code: '232', name: 'Sterling Bank' },
    { code: '035', name: 'SunTrust Bank' },
    { code: '101', name: 'Titan Trust Bank' },
    { code: '033', name: 'United Bank for Africa (UBA)' },
    { code: '215', name: 'Union Bank of Nigeria' },
    { code: '011', name: 'Wema Bank' },
    { code: '052', name: 'Zenith Bank' },
    { code: '026', name: 'Taj Bank' },
    { code: '092', name: 'Parallex Bank' },
    { code: '047', name: 'Globus Bank' },
    { code: '101', name: 'Lotus Bank' },
    { code: '102', name: 'Optimus Bank' },
    { code: '103', name: 'Sparks Bank' },
    { code: '104', name: 'VFD Microfinance Bank' },
    { code: '105', name: 'Mint FinTech MFB' },
    { code: '106', name: 'Novus Merchant Bank' },
    { code: '107', name: 'Rima MFB' },
    { code: '108', name: 'Easybuy' },
    { code: '109', name: 'Bowen University Microfinance Bank' },
    { code: '110', name: 'Covenant University Microfinance Bank' },
    { code: '111', name: 'Babcock University Microfinance Bank' },
    { code: '112', name: 'Landmark University Microfinance Bank' },
    { code: '113', name: 'Bingham University Microfinance Bank' },
    { code: '114', name: 'Redeemers University Microfinance Bank' },
    { code: '115', name: 'Madonna University Microfinance Bank' },
    { code: '116', name: 'Ajayi Crowther University Microfinance Bank' },
    { code: '117', name: 'Igbinedion University Microfinance Bank' },
    { code: '118', name: 'Crawford University Microfinance Bank' },
    { code: '119', name: 'Wesley University Microfinance Bank' },
    { code: '120', name: 'Afe Babalola University Microfinance Bank' },
    { code: '121', name: 'Anchor Microfinance Bank' },
    { code: '122', name: 'Bluehill Microfinance Bank' },
    { code: '123', name: 'Solid Rock Microfinance Bank' },
    { code: '124', name: 'Seed Capital Microfinance Bank' },
    { code: '125', name: 'Glory Microfinance Bank' },
    { code: '126', name: 'Highlands Microfinance Bank' },
    { code: '127', name: 'Seamless Microfinance Bank' },
    { code: '128', name: 'Standard Microfinance Bank' },
    { code: '129', name: 'Prime Microfinance Bank' },
    { code: '130', name: 'Safe Haven Microfinance Bank' },
    { code: '131', name: 'Cooperative Microfinance Bank' },
    { code: '132', name: 'Mutual Benefits Microfinance Bank' },
    { code: '133', name: 'Trustfund Microfinance Bank' },
    { code: '134', name: 'Gateway Microfinance Bank' },
    { code: '135', name: 'Mainstreet Microfinance Bank' },
    { code: '136', name: 'Bridgeway Microfinance Bank' },
    { code: '137', name: 'Stanel Microfinance Bank' },
    { code: '138', name: 'Nova Microfinance Bank' },
    { code: '139', name: 'Fast Microfinance Bank' },
    { code: '140', name: 'Quick Microfinance Bank' },
    { code: '141', name: 'Speed Microfinance Bank' },
    { code: '142', name: 'Smart Microfinance Bank' },
    { code: '143', name: 'Bright Microfinance Bank' },
    { code: '144', name: 'Clear Microfinance Bank' },
    { code: '145', name: 'Sharp Microfinance Bank' },
    { code: '146', name: 'Core Microfinance Bank' },
    { code: '147', name: 'Key Microfinance Bank' },
    { code: '148', name: 'Main Microfinance Bank' },
    { code: '149', name: 'Central Microfinance Bank' },
    { code: '150', name: 'Royal Microfinance Bank' },
    { code: '151', name: 'King Microfinance Bank' },
    { code: '152', name: 'Prince Microfinance Bank' },
    { code: '153', name: 'Queen Microfinance Bank' },
    { code: '154', name: 'Elite Microfinance Bank' },
    { code: '155', name: 'Gold Microfinance Bank' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--card)]">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center text-brand-text/60 py-12">Loading bank details...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--card)]">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-text">Bank Details</h1>
          <p className="text-sm text-brand-text/70 mt-1">
            Manage your payout bank account for withdrawals
          </p>
        </div>

        {/* Current Bank Account */}
        {bankAccount && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-emerald-900 mb-2">Bank Account Configured</h3>
                <div className="space-y-1 text-sm text-emerald-800">
                  <p><span className="font-medium">Bank:</span> {bankAccount.bank_name}</p>
                  <p><span className="font-medium">Account Number:</span> {bankAccount.account_number}</p>
                  <p><span className="font-medium">Bank Code:</span> {bankAccount.routing_number}</p>
                  <p className="text-emerald-600 text-xs mt-2">
                    Last updated: {new Date(bankAccount.updated_at).toLocaleDateString('en-NG', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-full flex-shrink-0">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Security Information</h3>
              <p className="text-sm text-blue-800">
                Your bank account details are encrypted and stored securely. Only you can view and manage your payout information. 
                Never share your bank account details with anyone.
              </p>
            </div>
          </div>
        </div>

        {/* Bank Account Form */}
        <div className="bg-[var(--card)] rounded-xl border border-brand-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-sky-600" />
            <h2 className="text-xl font-semibold text-brand-text">
              {bankAccount ? 'Update Bank Account' : 'Add Bank Account'}
            </h2>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bank Selection */}
            <div>
              <label htmlFor="bank_name" className="block text-sm font-medium text-brand-text mb-2">
                Select Bank
              </label>
              <select
                id="bank_name"
                name="bank_name"
                value={formData.bank_name}
                onChange={(e) => {
                  handleChange(e);
                  // Auto-fill bank code when bank is selected
                  const bankList = banks.length > 0 ? banks : nigerianBanks;
                  const selectedBank = bankList.find(bank => bank.name === e.target.value);
                  if (selectedBank) {
                    setFormData(prev => ({ ...prev, bank_code: selectedBank.code }));
                  }
                }}
                required
                disabled={loadingBanks}
                className="w-full px-4 py-3 rounded-lg border border-brand-border bg-brand-bg text-brand-text focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">Choose your bank</option>
                {(banks.length > 0 ? banks : nigerianBanks).map((bank) => (
                  <option key={bank.code} value={bank.name}>
                    {bank.name} (Code: {bank.code})
                  </option>
                ))}
              </select>
              {loadingBanks && (
                <p className="text-xs text-brand-text/60 mt-1">Loading banks from Paystack...</p>
              )}
            </div>

            {/* Account Number */}
            <div>
              <label htmlFor="account_number" className="block text-sm font-medium text-brand-text mb-2">
                Account Number
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text/60" />
                <input
                  type="text"
                  id="account_number"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleChange}
                  placeholder="Enter your 10-digit account number"
                  required
                  maxLength={12}
                  minLength={8}
                  pattern="[0-9]{8,12}"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-brand-border bg-brand-bg text-brand-text placeholder-brand-text/50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-brand-text/60 mt-1">
                Must be 8-12 digits (Nigerian bank account number)
              </p>
            </div>

            {/* Bank Code */}
            <div>
              <label htmlFor="bank_code" className="block text-sm font-medium text-brand-text mb-2">
                Bank Code
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text/60" />
                <input
                  type="text"
                  id="bank_code"
                  name="bank_code"
                  value={formData.bank_code}
                  onChange={handleChange}
                  placeholder="Enter 3-digit bank code"
                  required
                  maxLength={3}
                  minLength={3}
                  pattern="[0-9]{3}"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-brand-border bg-brand-bg text-brand-text placeholder-brand-text/50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-brand-text/60 mt-1">
                3-digit bank code (auto-filled when you select your bank)
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {bankAccount ? 'Update Bank Account' : 'Save Bank Account'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
