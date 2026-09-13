"use client";

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminproductsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/products');
        if (res.ok) {
          const json = await res.json();
          setData(json.data || []);
        } else {
          // Mock data if API is missing
          setData([{ id: 1, name: 'Sample Item for products' }]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setData([{ id: 1, name: 'Sample Item for products' }]);
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
    <div className="min-h-screen p-8 text-brand-text bg-brand-bg">
      <h1 className="text-3xl font-extrabold mb-6 capitalize">products</h1>
      <div className="bg-[var(--card)] brightness-95 rounded-2xl p-6 shadow-sm border border-gray-100">
        {data.length > 0 ? (
          <ul className="space-y-3">
            {data.map((item, idx) => (
              <li key={item.id || idx} className="p-4 border rounded-lg bg-brand-bg">
                {JSON.stringify(item)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-brand-text/60">No data found.</p>
        )}
      </div>
    </div>
  );
}
