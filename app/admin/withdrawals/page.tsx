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
  author: {
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
      setWithdrawals(data.withdrawals);
    } catch (e: any) {
      setError(e.message);
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
      <h1 className="text-2xl font-bold text-neutral-900">Pending Withdrawals</h1>
      {withdrawals.length === 0 ? (
        <p className="text-gray-300">No pending withdrawals.</p>
      ) : (
        <table className="min-w-full bg-gray-100] rounded-2xl shadow-lg">
          <thead>
            <tr className="text-left">
              <th className="px-4 py-2 text-gray-400">Author</th>
              <th className="px-4 py-2 text-gray-400">Reference ID</th>
              <th className="px-4 py-2 text-gray-400">Amount (₦)</th>
              <th className="px-4 py-2 text-gray-400">Requested At</th>
              <th className="px-4 py-2 text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((w) => (
              <tr key={w.id} className="border-b border-gray-700">
                <td className="px-4 py-2 text-gray-200">{w.author.display_name}</td>
                <td className="px-4 py-2 text-gray-200">{w.request_ref}</td>
                <td className="px-4 py-2 text-gray-200">{w.amount}</td>
                <td className="px-4 py-2 text-gray-200">
                  {new Date(w.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 space-x-2">
                  <button
                    className="px-3 py-1 bg-green-600 text-neutral-900 rounded hover:bg-green-700"
                    onClick={() => openModal(w, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    className="px-3 py-1 bg-red-600 text-neutral-900 rounded hover:bg-red-700"
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
