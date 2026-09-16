// app/admin/withdrawals/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import WithdrawalActionModal from "@/components/WithdrawalActionModal";
import { ChevronDown, ChevronUp, Building2 } from "lucide-react";

interface BankAccount {
  bank_name?: string;
  account_number_text?: string;
  routing_number_text?: string;
}

interface Withdrawal {
  id: string;
  request_ref: string;
  amount: number;
  requested_at: string;
  status: string;
  authors?: {
    display_name: string;
    email: string;
    clerk_user_id?: string;
    author_bank_accounts?: BankAccount | BankAccount[] | null;
  };
}

function getBankInfo(w: Withdrawal): BankAccount | null {
  const accounts = w.authors?.author_bank_accounts;
  if (!accounts) return null;
  if (Array.isArray(accounts)) return accounts[0] ?? null;
  return accounts;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to load withdrawals");
      setWithdrawals(data.withdrawals || []);
    } catch (e: any) {
      setError(e.message);
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWithdrawals(); }, []);

  const openModal = (withdrawal: Withdrawal, act: "approve" | "reject") => {
    setSelected(withdrawal);
    setAction(act);
  };

  const closeModal = () => { setSelected(null); setAction(null); };

  const handleActionSuccess = (msg?: string) => {
    closeModal();
    if (msg) {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
    fetchWithdrawals();
  };

  const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Pending Withdrawals</h1>

      {/* Success toast */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm font-medium">
          <span>✓</span> {successMsg}
        </div>
      )}

      {withdrawals.length === 0 ? (
        <p className="text-gray-600">No pending withdrawals.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="text-left bg-gray-50">
                <th className="px-4 py-3 text-gray-700 font-semibold">Author</th>
                <th className="px-4 py-3 text-gray-700 font-semibold">Reference ID</th>
                <th className="px-4 py-3 text-gray-700 font-semibold">Amount (₦)</th>
                <th className="px-4 py-3 text-gray-700 font-semibold">Requested At</th>
                <th className="px-4 py-3 text-gray-700 font-semibold">Bank Details</th>
                <th className="px-4 py-3 text-gray-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => {
                const bank = getBankInfo(w);
                const isExpanded = expandedId === w.id;
                return (
                  <React.Fragment key={w.id}>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{w.authors?.display_name || "Unknown"}</div>
                        <div className="text-xs text-gray-500">{w.authors?.email || ""}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-mono text-sm">{w.request_ref || w.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-gray-900 font-semibold">₦{w.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-700 text-sm">{new Date(w.requested_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {bank ? (
                          <button
                            onClick={() => toggleExpand(w.id)}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <Building2 size={14} />
                            {isExpanded ? "Hide" : "View"}
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No bank info</span>
                        )}
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        <button
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors text-sm font-medium"
                          onClick={() => openModal(w, "approve")}
                        >
                          Paid
                        </button>
                        <button
                          className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                          onClick={() => openModal(w, "reject")}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                    {/* Collapsible bank details row */}
                    {isExpanded && bank && (
                      <tr className="bg-blue-50 border-b border-blue-100">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="flex flex-wrap gap-6 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-0.5">Bank Name</p>
                              <p className="font-semibold text-gray-900">{bank.bank_name || "—"}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-0.5">Account Number</p>
                              <p className="font-semibold text-gray-900 font-mono">{bank.account_number_text || "—"}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-0.5">Bank Code</p>
                              <p className="font-semibold text-gray-900 font-mono">{bank.routing_number_text || "—"}</p>
                            </div>
                            <div className="ml-auto self-center">
                              <p className="text-xs text-blue-600 bg-blue-100 rounded px-2 py-1">
                                Transfer <strong>₦{w.amount.toLocaleString()}</strong> manually, then click <strong>Paid</strong>
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && action && (
        <WithdrawalActionModal
          withdrawal={selected}
          action={action}
          manual={true}
          onClose={closeModal}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
}
