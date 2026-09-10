"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Bell, HelpCircle, ChevronRight, 
  Filter, MoreHorizontal, FileText, CheckCircle2,
  XCircle, Clock, SearchIcon
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

export default function AdminApplicationsPage() {
  

  // State for applications data
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch applications from backend; fallback to sample data if fetch fails
  useEffect(() => {
    async function fetchApplications() {
      try {
        const res = await fetch('/api/admin/authors/applications');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setApplications(data);
      } catch (e) {
        console.error(e);
        // Use sample data as fallback
        setApplications(sampleApplications);
      } finally {
        setLoading(false);
      }
    }
    fetchApplications();
  }, []);
  const sampleApplications = [
    {
      id: 'app_1',
      name: 'Daniel Williams',
      avatar: 'DW',
      email: 'daniel@example.com',
      expertise: 'Marketing Director',
      status: 'Pending Review',
      date: 'Today, 10:45 AM',
      experience: '10+ years',
      documents: 3
    },
    {
      id: 'app_2',
      name: 'Jessica Taylor',
      avatar: 'JT',
      email: 'jessica.t@example.com',
      expertise: 'UI/UX Designer',
      status: 'Pending Review',
      date: 'Yesterday, 2:15 PM',
      experience: '4-5 years',
      documents: 2
    },
    {
      id: 'app_3',
      name: 'Oluwaseun Adeyemi',
      avatar: 'OA',
      email: 'seun.a@example.com',
      expertise: 'Mobile Developer',
      status: 'Pending Review',
      date: 'Oct 12, 2023',
      experience: '2-3 years',
      documents: 3
    },
    {
      id: 'app_4',
      name: 'Elena Rodriguez',
      avatar: 'ER',
      email: 'elena.r@example.com',
      expertise: 'Data Analyst',
      status: 'Approved',
      date: 'Oct 10, 2023',
      experience: '6-10 years',
      documents: 3
    },
    {
      id: 'app_5',
      name: 'Michael Chen',
      avatar: 'MC',
      email: 'm.chen@example.com',
      expertise: 'Cloud Architect',
      status: 'Rejected',
      date: 'Oct 09, 2023',
      experience: '0-1 years',
      documents: 1
    }
  ];

  return (
    <div className="min-h-screen pb-12 text-gray-900 font-sans">
      
      {/* ─── Top Bar ─── */}
      <header className="h-16 bg-white border-b border-gray-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
          <Link href="/admin/authors" className="hover:text-gray-800 transition-colors">Admin</Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <Link href="/admin/authors" className="hover:text-gray-800 transition-colors">Authors</Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900 font-semibold">Applications</span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="relative hidden md:block">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search everywhere..." 
              className="pl-9 pr-4 py-2 w-64 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors relative">
              <Bell className="h-5 w-5" />
            </button>
            <div className="h-8 w-px bg-gray-200 mx-1"></div>
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200 shadow-sm cursor-pointer ml-1">
              <span className="text-sm font-bold text-blue-700">AD</span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 sm:px-8 pt-8 max-w-[1400px] mx-auto">
        
        {/* ─── Page Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Author Applications</h1>
            <p className="text-sm text-gray-500 mt-1.5 font-medium max-w-xl leading-relaxed">
              Review and process new author applications. Verify credentials and approve qualified creators to join the marketplace.
            </p>
          </div>
        </div>

        {/* ─── Applications Management Area ─── */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          
          <div className="p-5 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white border-b border-gray-100">
            <div className="relative w-full sm:w-96">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by name, email, or expertise..." 
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
              />
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <select className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option>All Statuses</option>
                <option>Pending Review</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
              <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 shadow-sm transition-colors whitespace-nowrap">
                <Filter className="h-4 w-4 text-gray-500" /> Filters
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Applicant</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Expertise</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Docs</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => router.push(`/admin/authors/applications/${app.id}`)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 border border-indigo-200 shadow-sm text-indigo-700 font-bold text-sm">
                          {app.avatar}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{app.name}</div>
                          <div className="text-xs font-medium text-gray-500 mt-0.5">{app.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-700">{app.expertise}</div>
                      <div className="text-xs font-medium text-gray-500 mt-0.5">{app.experience}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-md border border-gray-200 text-xs font-bold text-gray-600">
                        <FileText className="h-3.5 w-3.5" />
                        {app.documents}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-700">{app.date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {app.status === 'Approved' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                        </span>
                      )}
                      {app.status === 'Pending Review' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                          <Clock className="h-3.5 w-3.5" /> Pending
                        </span>
                      )}
                      {app.status === 'Rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                          <XCircle className="h-3.5 w-3.5" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => router.push(`/admin/authors/applications/${app.id}`)}
                        className="px-4 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 font-bold text-xs rounded-lg transition-colors border border-blue-100"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Showing <span className="font-bold text-gray-700">1</span> to <span className="font-bold text-gray-700">5</span> of <span className="font-bold text-gray-700">45</span> pending applications</span>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-500 font-bold text-sm rounded-lg opacity-50 cursor-not-allowed">Previous</button>
              <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-50 shadow-sm transition-colors">Next</button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}