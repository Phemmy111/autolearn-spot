// components/WithdrawalActionModal.tsx
"use client"

import React, { useState } from "react"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

interface Withdrawal {
  id: string
  request_ref: string
  amount: number
  created_at: string
  status: string
  authors?: {
    display_name: string
    email: string
  }
}

interface Props {
  withdrawal: Withdrawal
  action: "approve" | "reject"
  onClose: () => void
  onSuccess: () => void
}

export default function WithdrawalActionModal({
  withdrawal,
  action,
  onClose,
  onSuccess,
}: Props) {
  const [providerRef, setProviderRef] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          withdrawal_id: withdrawal.id,
          action,
          provider_reference: providerRef,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        throw new Error(data.message || "Action failed")
      }
      
      // Handle transfer-specific responses
      if (data.warning) {
        setError(data.warning)
        // Still close modal since withdrawal was approved
        setTimeout(() => onSuccess(), 2000)
      } else {
        onSuccess()
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {action === "approve" ? "Approve" : "Reject"} Withdrawal
        </h2>
        <div className="space-y-3 mb-4">
          <p className="text-gray-700"><span className="font-semibold">Author:</span> {withdrawal.authors?.display_name || 'Unknown'}</p>
          <p className="text-gray-700"><span className="font-semibold">Amount:</span> ₦{withdrawal.amount.toLocaleString()}</p>
          <p className="text-gray-700"><span className="font-semibold">Reference:</span> {withdrawal.request_ref || withdrawal.id.slice(0, 8)}</p>
        </div>
        {action === "approve" && (
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="providerRef">
              Provider Reference (optional)
            </label>
            <input
              id="providerRef"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Enter Paystack reference"
              value={providerRef}
              onChange={(e) => setProviderRef(e.target.value)}
            />
          </div>
        )}
        {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 text-white rounded-lg transition-colors ${
              action === "approve" 
                ? "bg-emerald-600 hover:bg-emerald-700" 
                : "bg-red-600 hover:bg-red-700"
            }`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? <LoadingSpinner /> : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  )
}
