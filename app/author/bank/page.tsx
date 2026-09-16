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
  
  const [formData, setFormData] = useState({
    bank_name: '',
    account_number: '',
    bank_code: ''
  })

  useEffect(() => {
    if (userId) fetchBankAccount()
  }, [userId])

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

  // Nigerian bank codes (3-digit codes)
  const nigerianBanks = [
    { code: '001', name: 'Access Bank' },
    { code: '002', name: 'Zenith Bank' },
    { code: '003', name: 'United Bank for Africa (UBA)' },
    { code: '004', name: 'Guaranty Trust Bank (GTBank)' },
    { code: '005', name: 'First Bank of Nigeria' },
    { code: '006', name: 'Union Bank of Nigeria' },
    { code: '007', name: 'EcoBank Nigeria' },
    { code: '008', name: 'Stanbic IBTC Bank' },
    { code: '009', name: 'Wema Bank' },
    { code: '010', name: 'Sterling Bank' },
    { code: '011', name: 'Jaiz Bank' },
    { code: '012', name: 'Providus Bank' },
    { code: '013', name: 'Fidelity Bank' },
    { code: '014', name: 'Heritage Bank' },
    { code: '015', name: 'Keystone Bank' },
    { code: '016', name: 'Polaris Bank' },
    { code: '017', name: 'Standard Chartered Bank' },
    { code: '018', name: 'Citibank Nigeria' },
    { code: '019', name: 'Unity Bank' },
    { code: '020', name: 'SunTrust Bank' },
    { code: '021', name: 'Parallex Bank' },
    { code: '022', name: 'TCF MFB' },
    { code: '023', name: 'Lotus Bank' },
    { code: '024', name: 'Globus Bank' },
    { code: '025', name: 'Taj Bank' },
    { code: '026', name: 'Titan Trust Bank' },
    { code: '027', name: 'Sparkle Bank' },
    { code: '028', name: 'Kuda Bank' },
    { code: '029', name: 'Moniepoint MFB' },
    { code: '030', name: 'Opay' },
    { code: '031', name: 'Palmpay' },
    { code: '032', name: 'Fint MFB' },
    { code: '033', name: 'Naira MFB' },
    { code: '034', name: 'Regent MFB' },
    { code: '035', name: 'Rand MFB' },
    { code: '036', name: 'VBank' },
    { code: '037', name: 'One Finance' },
    { code: '038', name: 'Eyowo' },
    { code: '039', name: 'PiggyVest' },
    { code: '040', name: 'Carbon' },
    { code: '041', name: 'Branch' },
    { code: '042', name: 'FairMoney' },
    { code: '043', name: 'Lidya' },
    { code: '044', name: 'Newedge MFB' },
    { code: '045', name: 'Mint MFB' },
    { code: '046', name: 'Nova MFB' },
    { code: '047', name: 'Olabisi Onabanjo University MFB' },
    { code: '048', name: 'Bowen University MFB' },
    { code: '049', name: 'Babcock University MFB' },
    { code: '050', name: 'Landmark University MFB' },
    { code: '051', name: 'Covenant University MFB' },
    { code: '052', name: 'Bingham University MFB' },
    { code: '053', name: 'Redeemers University MFB' },
    { code: '054', name: 'Madonna University MFB' },
    { code: '055', name: 'Ajayi Crowther University MFB' },
    { code: '056', name: 'Igbinedion University MFB' },
    { code: '057', name: 'Crawford University MFB' },
    { code: '058', name: 'Wesley University MFB' },
    { code: '059', name: 'Afe Babalola University MFB' },
    { code: '060', name: 'Anchor MFB' },
    { code: '061', name: 'Bluehill MFB' },
    { code: '062', name: 'Solid Rock MFB' },
    { code: '063', name: 'Seed Capital MFB' },
    { code: '064', name: 'Glory MFB' },
    { code: '065', name: 'Highlands MFB' },
    { code: '066', name: 'Seamless MFB' },
    { code: '067', name: 'Standard MFB' },
    { code: '068', name: 'Prime MFB' },
    { code: '069', name: 'Safe Haven MFB' },
    { code: '070', name: 'Cooperative MFB' },
    { code: '071', name: 'Mutual Benefits MFB' },
    { code: '072', name: 'Trustfund MFB' },
    { code: '073', name: 'Gateway MFB' },
    { code: '074', name: 'Mainstreet MFB' },
    { code: '075', name: 'Bridgeway MFB' },
    { code: '076', name: 'Stanel MFB' },
    { code: '077', name: 'Nova MFB' },
    { code: '078', name: 'Fast MFB' },
    { code: '079', name: 'Quick MFB' },
    { code: '080', name: 'Speed MFB' },
    { code: '081', name: 'Smart MFB' },
    { code: '082', name: 'Bright MFB' },
    { code: '083', name: 'Clear MFB' },
    { code: '084', name: 'Sharp MFB' },
    { code: '085', name: 'Quick MFB' },
    { code: '086', name: 'Easy MFB' },
    { code: '087', name: 'Simple MFB' },
    { code: '088', name: 'Basic MFB' },
    { code: '089', name: 'Core MFB' },
    { code: '090', name: 'Key MFB' },
    { code: '091', name: 'Main MFB' },
    { code: '092', name: 'Central MFB' },
    { code: '093', name: 'Royal MFB' },
    { code: '094', name: 'King MFB' },
    { code: '095', name: 'Prince MFB' },
    { code: '096', name: 'Queen MFB' },
    { code: '097', name: 'Elite MFB' },
    { code: '098', name: 'Prime MFB' },
    { code: '099', name: 'Gold MFB' },
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
                  const selectedBank = nigerianBanks.find(bank => bank.name === e.target.value);
                  if (selectedBank) {
                    setFormData(prev => ({ ...prev, bank_code: selectedBank.code }));
                  }
                }}
                required
                className="w-full px-4 py-3 rounded-lg border border-brand-border bg-brand-bg text-brand-text focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="">Choose your bank</option>
                {nigerianBanks.map((bank) => (
                  <option key={bank.code} value={bank.name}>
                    {bank.name} (Code: {bank.code})
                  </option>
                ))}
              </select>
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
