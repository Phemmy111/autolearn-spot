'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, User, BookOpen, Calendar, CreditCard } from 'lucide-react';

export default function AdminstudentsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/students');
        if (res.ok) {
          const json = await res.json();
          setData(json.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 text-brand-text bg-brand-bg">
      <h1 className="text-3xl font-extrabold mb-6 capitalize">Students</h1>
      <div className="bg-[var(--card)] brightness-95 rounded-2xl p-6 shadow-sm border border-gray-100 overflow-x-auto">
        {data.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="q-4 font-medium">Name &amp; Email</th>
                <th className="p-4 font-medium">Course</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Start Date</th>
                <th className="p-4 font-medium">Days Left</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
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
                      <span>₦{item.amount}</span>
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
