import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminMarketplacePage() {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/');
  }

  const { data: products, error } = await supabaseAdmin
    .from('learning_products')
    .select('*, authors(display_name)')
    .order('created_at', { ascending: false });

  const safeProducts = products || [];

  return (
    <div className="min-h-screen p-8 text-brand-text bg-brand-bg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold capitalize">Marketplace Products</h1>
      </div>
      <div className="bg-[var(--card)] brightness-95 rounded-2xl p-6 shadow-sm border border-gray-100 overflow-x-auto">
        {safeProducts.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="p-4 font-medium">Product Name</th>
                <th className="p-4 font-medium">Author</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {safeProducts.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="font-medium text-gray-900">{item.title}</div>
                    </div>
                  </td>
                  <td className="p-4 text-brand-text/70">
                    {item.authors?.display_name || '-'}
                  </td>
                  <td className="p-4 font-medium">
                    ₦{item.price?.toLocaleString() || 0}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {item.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-brand-text/60">No products found.</p>
        )}
      </div>
    </div>
  );
}
