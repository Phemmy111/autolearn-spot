// app/admin/withdrawals/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import WithdrawalActionModal from "@/components/WithdrawalActionModal";

interface Withdrawal {
  id: string;
  request_ref: string;
  amount: number;
  created_at: string;
  status: string;
  authors?: {
    display_name: string;
    email: string;
  };
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to load withdrawals");
      }
      setWithdrawals(data.withdrawals || []);
    } catch (e: any) {
      setError(e.message);
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const openModal = (withdrawal: Withdrawal, act: "approve" | "reject") => {
    setSelected(withdrawal);
    setAction(act);
  };

  const closeModal = () => {
    setSelected(null);
    setAction(null);
  };

  const handleActionSuccess = () => {
    closeModal();
    fetchWithdrawals();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Pending Withdrawals</h1>
      {withdrawals.length === 0 ? (
        <p className="text-gray-600">No pending withdrawals.</p>
      ) : (
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
          <thead>
            <tr className="text-left bg-gray-50">
              <th className="px-4 py-3 text-gray-700 font-semibold">Author</th>
              <th className="px-4 py-3 text-gray-700 font-semibold">Reference ID</th>
              <th className="px-4 py-3 text-gray-700 font-semibold">Amount (₦)</th>
              <th className="px-4 py-3 text-gray-700 font-semibold">Requested At</th>
              <th className="px-4 py-3 text-gray-700 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((w) => (
              <tr key={w.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900 font-medium">{w.authors?.display_name || 'Unknown'}</td>
                <td className="px-4 py-3 text-gray-700">{w.request_ref || w.id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-gray-900 font-semibold">{w.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-700">
                  {new Date(w.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                    onClick={() => openModal(w, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    onClick={() => openModal(w, "reject")}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {selected && action && (
        <WithdrawalActionModal
          withdrawal={selected}
          action={action}
          onClose={closeModal}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
}
