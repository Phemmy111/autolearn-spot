'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        fetch('/api/admin/partners'),
        fetch('/api/admin/partners/applications')
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        setPartners(pData.partners || []);
      }
      if (aRes.ok) {
        const aData = await aRes.json();
        setApplications(aData.applications || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleProcessApplication = async (applicationId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/partners/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, action })
      });
      if (res.ok) fetchAll();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="p-8 text-white">Loading Partners...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Partner Management</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-[#00f0ff] mb-4">Pending Applications (Community Partners)</h2>
        <div className="bg-[#111317] border border-[#1f2229] rounded-xl overflow-hidden">
          <table className="w-full text-left text-white">
            <thead className="bg-[#1a1d24]">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Motivation</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.filter(a => a.status === 'pending').length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-[#b9cacb]">No pending applications.</td>
                </tr>
              ) : (
                applications.filter(a => a.status === 'pending').map((app) => (
                  <tr key={app.id} className="border-t border-[#1f2229]">
                    <td className="p-4">{app.user_name}</td>
                    <td className="p-4">{app.user_email}</td>
                    <td className="p-4 truncate max-w-xs">{app.motivation}</td>
                    <td className="p-4 capitalize text-yellow-400">{app.status}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleProcessApplication(app.id, 'approve')} className="px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/40">Approve</button>
                      <button onClick={() => handleProcessApplication(app.id, 'reject')} className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40">Reject</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-[#00f0ff] mb-4">Active Partners</h2>
        <div className="bg-[#111317] border border-[#1f2229] rounded-xl overflow-hidden">
          <table className="w-full text-left text-white">
            <thead className="bg-[#1a1d24]">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Tier</th>
                <th className="p-4">Referrals</th>
                <th className="p-4">Commissions (₦)</th>
              </tr>
            </thead>
            <tbody>
              {partners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-[#b9cacb]">No active partners in DB. (Students are tracked separately if auto-enrolled)</td>
                </tr>
              ) : (
                partners.map((p) => (
                  <tr key={p.id} className="border-t border-[#1f2229]">
                    <td className="p-4">{p.user_name}</td>
                    <td className="p-4">{p.user_email}</td>
                    <td className="p-4 capitalize">{p.partner_type}</td>
                    <td className="p-4">{p.total_referrals}</td>
                    <td className="p-4">{p.total_earned}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
