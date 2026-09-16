// components/WithdrawalActionModal.tsx
"use client"

import React, { useState } from "react"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

interface Withdrawal {
  id: string
  request_ref: string
  amount: number
  requested_at: string
  status: string
  authors?: {
    display_name: string
    email: string
  }
}

interface Props {
  withdrawal: Withdrawal
  action: "approve" | "reject"
  manual?: boolean
  onClose: () => void
  onSuccess: (msg?: string) => void
}

export default function WithdrawalActionModal({
  withdrawal,
  action,
  manual = true,
  onClose,
  onSuccess,
}: Props) {
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
          manual,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || data.message || "Action failed")
      }

      if (data.newStatus === "PAID") {
        onSuccess(`Payment marked as paid. ₦${withdrawal.amount.toLocaleString()} — author has been notified.`)
      } else if (data.newStatus === "REJECTED") {
        onSuccess("Withdrawal has been rejected and author notified.")
      } else if (data.warning) {
        // Legacy Paystack flow warnings
        setError(data.warning)
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

  const isApprove = action === "approve"

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {isApprove ? "Mark as Paid" : "Reject"} Withdrawal
        </h2>

        <div className="space-y-3 mb-6">
          <p className="text-gray-700">
            <span className="font-semibold">Author:</span>{" "}
            {withdrawal.authors?.display_name || "Unknown"}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Amount:</span>{" "}
            <span className="text-lg font-bold text-emerald-700">
              ₦{withdrawal.amount.toLocaleString()}
            </span>
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Reference:</span>{" "}
            <span className="font-mono text-sm">{withdrawal.request_ref || withdrawal.id.slice(0, 8)}</span>
          </p>
        </div>

        {isApprove && (
          <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            <p className="font-semibold mb-1">Manual Transfer Instructions</p>
            <p>
              Please complete the bank transfer of{" "}
              <strong>₦{withdrawal.amount.toLocaleString()}</strong> using the bank details shown in the
              table, then click <strong>Confirm Paid</strong> below. The author will receive an
              in-app notification automatically.
            </p>
          </div>
        )}

        {!isApprove && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            <p>
              This will reject the withdrawal request and notify the author. This action cannot be
              undone.
            </p>
          </div>
        )}

        {error && (
          <p className="text-red-600 mb-4 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
            {error}
          </p>
        )}

        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 text-white rounded-lg transition-colors font-medium ${
              isApprove
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner />
            ) : isApprove ? (
              "Confirm Paid"
            ) : (
              "Confirm Reject"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
