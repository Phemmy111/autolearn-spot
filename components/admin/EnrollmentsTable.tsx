"use client";

import { useState } from 'react';
import { Search, CheckCircle2 } from 'lucide-react';

export function EnrollmentsTable({ initialEnrollments, summary }: {
  initialEnrollments: any[],
  summary: {
    total: number;
    revenue: number;
  }
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = initialEnrollments.filter((en: any) => {
    const matchesSearch = en.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          en.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        <div className="bg-brand-bg border border-[#3b494b] p-4 rounded text-center">
          <div className="text-brand-text/70 font-mono text-xs uppercase">Total Purchasers</div>
          <div className="text-2xl font-bold text-[#10b981] mt-1">{summary.total}</div>
        </div>
        <div className="bg-brand-bg border border-[#3b494b] p-4 rounded text-center">
          <div className="text-brand-text/70 font-mono text-xs uppercase">Total Revenue</div>
          <div className="text-2xl font-bold text-[#10b981] mt-1">₦{summary.revenue.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text/60" />
          <input
            type="text"
            placeholder="Search email or name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-brand-bg border border-[#3b494b] pl-10 pr-4 py-2 font-mono text-sm text-brand-text focus:outline-none focus:border-[#10b981]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-[#3b494b] bg-brand-bg rounded">
        <table className="w-full text-left font-mono text-sm">
          <thead className="bg-brand-bg border-b border-[#3b494b] text-brand-text/70">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Purchases</th>
              <th className="px-4 py-3">Total Spent</th>
              <th className="px-4 py-3">Latest Purchase</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((en: any) => {
              const productsDisplay = Array.isArray(en.courses) ? en.courses.join(', ') : en.courses || 'N/A';
              const amount = en.totalAmount || en.amount_paid || 0;
              const date = en.latestPurchase || en.created_at;
              return (
                <tr key={en.id} className="border-b border-[#3b494b]/50 hover:bg-brand-bg/50">
                  <td className="px-4 py-3 text-brand-text">{en.name || 'N/A'}</td>
                  <td className="px-4 py-3 text-brand-text/70">{en.email}</td>
                  <td className="px-4 py-3 text-brand-text/60" title={productsDisplay}>
                    {productsDisplay.length > 50 ? productsDisplay.substring(0, 50) + '...' : productsDisplay}
                  </td>
                  <td className="px-4 py-3 text-brand-text/60">{en.purchases || 1}</td>
                  <td className="px-4 py-3 text-[#10b981]">₦{amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-brand-text/60">{date ? new Date(date).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] uppercase font-bold bg-brand-bg/10 text-[#10b981]`}>
                      <CheckCircle2 className="h-3 w-3" />
                      Paid
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-brand-text/60">
                  No purchasers found matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
