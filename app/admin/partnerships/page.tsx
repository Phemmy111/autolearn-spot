"use client";

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminpartnershipsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/partnerships');
        if (res.ok) {
          const json = await res.json();
          setData(json.data || []);
        } else {
          // Mock data if API is missing
          setData([{ id: 1, name: 'Sample Item for partnerships' }]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setData([{ id: 1, name: 'Sample Item for partnerships' }]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 text-gray-900 bg-[#d1d5db]">
      <h1 className="text-3xl font-extrabold mb-6 capitalize">partnerships</h1>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        {data.length > 0 ? (
          <ul className="space-y-3">
            {data.map((item, idx) => (
              <li key={item.id || idx} className="p-4 border rounded-lg bg-gray-50">
                {JSON.stringify(item)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No data found.</p>
        )}
      </div>
    </div>
  );
}
