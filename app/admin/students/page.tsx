import React from 'react';
import { User, BookOpen, Calendar, CreditCard } from 'lucide-react';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminStudentsPage() {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/');
  }

  const { data: enrollments, error } = await supabaseAdmin
    .from('enrollments')
    .select(`
      id,
      full_name,
      email,
      payment_amount,
      amount_paid,
      status,
      activated_at,
      enrolled_at,
      learning_product:learning_products (
        title,
        access_duration_days
      )
    `)
    .order('created_at', { ascending: false });

  const safeEnrollments = enrollments || [];

  const formattedData = safeEnrollments.map(e => {
    const product = Array.isArray(e.learning_product) ? e.learning_product[0] : e.learning_product;
    
    let daysLeft = null;
    if (e.status === 'active' && e.activated_at && product?.access_duration_days) {
      const start = new Date(e.activated_at).getTime();
      const now = Date.now();
      const durationMs = product.access_duration_days * 24 * 60 * 60 * 1000;
      daysLeft = Math.max(0, Math.ceil((start + durationMs - now) / (1000 * 60 * 60 * 24)));
    }

    return {
      id: e.id,
      name: e.full_name || 'No name',
      email: e.email,
      course: product ? product.title : 'Unknown Course',
      amount: e.payment_amount || e.amount_paid || 0,
      status: e.status || 'inactive',
      date: e.activated_at || e.enrolled_at || 'N/A',
      days_left: daysLeft
    };
  });

  return (
    <div className="min-h-screen p-8 text-brand-text bg-brand-bg">
      <h1 className="text-3xl font-extrabold mb-6 capitalize">Students</h1>
      <div className="bg-[var(--card)] brightness-95 rounded-2xl p-6 shadow-sm border border-gray-100 overflow-x-auto">
        {formattedData.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="p-4 font-medium">Name &amp; Email</th>
                <th className="p-4 font-medium">Course</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Start Date</th>
                <th className="p-4 font-medium">Days Left</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {formattedData.map((item, idx) => (
                <tr key={item.id || idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <span>{item.course}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      <span>₦{item.amount.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{item.date !== 'N/A' ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium">
                    {item.days_left !== null ? (
                      <span className={item.days_left < 5 ? 'text-red-500' : 'text-teal-600'}>
                        {item.days_left} days
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${ 
                      item.status === 'active' || item.status === 'successful' 
                        ? 'bg-green-100 text-green-800' 
                        : item.status === 'not_started'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-brand-text/60">No students found.</p>
        )}
      </div>
    </div>
  );
}
