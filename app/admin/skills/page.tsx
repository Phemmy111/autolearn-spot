import React from 'react';
import { Target } from 'lucide-react';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminSkillsPage() {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/');
  }

  const { data: skills } = await supabaseAdmin
    .from('skills')
    .select('*')
    .order('name', { ascending: true });

  const safeSkills = skills || [];

  return (
    <div className="min-h-screen p-8 text-brand-text bg-brand-bg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold capitalize">Skills</h1>
      </div>
      <div className="bg-[var(--card)] brightness-95 rounded-2xl p-6 shadow-sm border border-gray-100 overflow-x-auto">
        {safeSkills.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="p-4 font-medium">Skill Name</th>
                <th className="p-4 font-medium">Category ID</th>
              </tr>
            </thead>
            <tbody>
              {safeSkills.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Target className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="font-medium text-gray-900">{item.name}</div>
                    </div>
                  </td>
                  <td className="p-4 text-brand-text/70">
                    {item.category_id || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-brand-text/60">No skills found.</p>
        )}
      </div>
    </div>
  );
}
