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
  author: {
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
      onSuccess()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-100] rounded-2xl p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold text-neutral-900 mb-4">
          {action === "approve" ? "Approve" : "Reject"} Withdrawal
        </h2>
        <p className="text-gray-200 mb-2">Author: {withdrawal.author.display_name}</p>
        <p className="text-gray-200 mb-2">Amount: {withdrawal.amount} ₦</p>
        <p className="text-gray-200 mb-4">Reference: {withdrawal.request_ref}</p>
        {action === "approve" && (
          <div className="mb-4">
            <label className="block text-gray-400 mb-1" htmlFor="providerRef">
              Provider Reference (optional)
            </label>
            <input
              id="providerRef"
              type="text"
              className="w-full px-3 py-2 rounded bg-gray-100] text-neutral-900 focus:outline-none"
              value={providerRef}
              onChange={(e) => setProviderRef(e.target.value)}
            />
          </div>
        )}
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 bg-gray-600 text-neutral-900 rounded hover:bg-gray-700"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-neutral-900 rounded hover:bg-blue-700"
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
