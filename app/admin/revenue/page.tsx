import React from 'react';
import { DollarSign } from 'lucide-react';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminRevenuePage() {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/');
  }

  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select('id, email, amount_paid, payment_ref, created_at, status')
    .order('created_at', { ascending: false });

  const safeEnrollments = enrollments || [];
  const totalRevenue = safeEnrollments.reduce((sum, item) => sum + (Number(item.amount_paid) || 0), 0);

  return (
    <div className="min-h-screen p-8 text-brand-text bg-brand-bg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold capitalize">Revenue</h1>
        <div className="bg-[#10b981] text-white px-4 py-2 rounded-lg font-bold">
          Total: ,{totalRevenue.toLocaleString()}
        </div>
      </div>
      <div className="bg-[var(--card)] brightness-95 rounded-2xl p-6 shadow-sm border border-gray-100 overflow-x-auto">
        {safeEnrollments.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="p-4 font-medium">Payment Ref</th>
                <th className="p-4 font-medium">Student Email</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {safeEnrollments.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="font-medium text-gray-900">{item.payment_ref || 'Manual'}</div>
                    </div>
                  </td>
                  <td className="p-4 text-brand-text/70">
                    {item.email}
                  </td>
                  <td className="p-4 font-medium">
                    ,{Number(item.amount_paid || 0).toLocaleString()}
                  </td>
                  <td className="p-4 text-brand-text/70">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-brand-text/60">No revenue data found.</p>
        )}
      </div>
    </div>
  );
}
