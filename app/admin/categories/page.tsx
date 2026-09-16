import React from 'react';
import { Layers } from 'lucide-react';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminCategoriesPage() {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/');
  }

  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  const safeCategories = categories || [];

  return (
    <div className="min-h-screen p-8 text-brand-text bg-brand-bg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold capitalize">Categories</h1>
      </div>
      <div className="bg-[var(--card)] brightness-95 rounded-2xl p-6 shadow-sm border border-gray-100 overflow-x-auto">
        {safeCategories.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="p-4 font-medium">Category Name</th>
                <th className="p-4 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {safeCategories.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Layers className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="font-medium text-gray-900">{item.name}</div>
                    </div>
                  </td>
                  <td className="p-4 text-brand-text/70">
                    {item.description || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-brand-text/60">No categories found.</p>
        )}
      </div>
    </div>
  );
}
