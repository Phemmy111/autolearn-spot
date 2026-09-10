"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Bell, HelpCircle, Plus, Users, UserCheck, 
  Clock, ShieldAlert, DollarSign, Filter, MoreVertical,
  ChevronRight, MoreHorizontal, CheckCircle2, XCircle
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

export default function AdminAuthorsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All Authors');

  const [authors, setAuthors] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<any>(null);

  React.useEffect(() => {
    async function fetchAuthors() {
      try {
        const res = await fetch('/api/admin/authors');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        if (data.authors) {
          const mappedAuthors = data.authors.map((author: any) => ({
            id: author.id,
            name: author.display_name || 'Unknown',
            avatar: (author.display_name || 'U').substring(0, 2).toUpperCase(),
            expertise: 'Not specified', // Placeholder as it might not be in the schema
            skills: [], // Placeholder
            products: 0, // Placeholder
            students: 0, // Placeholder
            sales: 0, // Placeholder
            revenue: `$${author.author_earnings?.[0]?.total_gross || 0}`,
            status: author.status === 'ACTIVE' ? 'Active' : author.status === 'SUSPENDED' ? 'Suspended' : 'Pending',
            joined: new Date(author.created_at).toLocaleDateString()
          }));
          setAuthors(mappedAuthors);
        }
        if (data.statistics) {
          setStats(data.statistics);
        }
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchAuthors();
  }, []);

  return (
    <div className="min-h-screen pb-12 text-gray-900 font-sans">
      
      {/* ─── Top Bar ─── */}
      <header className="h-16 bg-white border-b border-gray-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
          <span className="hover:text-gray-800 cursor-pointer transition-colors">Admin</span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900 font-semibold">Authors</span>
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
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
              <HelpCircle className="h-5 w-5" />
            </button>
            <div className="h-8 w-px bg-gray-200 mx-1"></div>
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200 shadow-sm cursor-pointer ml-1">
              <span className="text-sm font-bold text-blue-700">AD</span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 sm:px-8 pt-8 max-w-[1600px] mx-auto">
        
        {/* ─── Page Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Authors</h1>
            <p className="text-sm text-gray-500 mt-1.5 font-medium max-w-xl leading-relaxed">
              Manage creators, review applications, monitor performance, and manage author activity across the marketplace.
            </p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap">
            <Plus className="h-4 w-4" /> Add Author
          </button>
        </div>

        {/* ─── Statistics Row ─── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-8">
          {[
            { label: 'Total Authors', value: stats?.totalAuthors || '0', icon: Users, trend: 'All time', color: 'bg-blue-50 text-blue-600' },
            { label: 'Active Authors', value: stats?.activeAuthors || '0', icon: UserCheck, trend: 'Currently active', color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Pending Apps', value: stats?.pendingApplications || '0', icon: Clock, trend: 'Needs review', color: 'bg-amber-50 text-amber-600' },
            { label: 'Suspended', value: '-', icon: ShieldAlert, trend: 'N/A', color: 'bg-red-50 text-red-600' },
            { label: 'Total Revenue', value: '-', icon: DollarSign, trend: 'N/A', color: 'bg-indigo-50 text-indigo-600' }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</h3>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm font-semibold text-gray-500">{stat.label}</p>
              </div>
              <p className="text-xs font-medium text-gray-400 mt-3">{stat.trend}</p>
            </div>
          ))}
        </div>

        {/* ─── Author Management Area ─── */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Toolbar */}
          <div className="border-b border-gray-100">
            <div className="px-6 pt-4">
              <div className="flex space-x-6 overflow-x-auto scrollbar-hide">
                {['All Authors', 'Active', 'Pending', 'Suspended', 'Rejected'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-sm font-bold whitespace-nowrap transition-colors relative ${
                      activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 border-b border-gray-100">
            <div className="relative w-full sm:w-80">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search authors..." 
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
              />
            </div>
            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-50 shadow-sm transition-colors whitespace-nowrap">
              <Filter className="h-4 w-4 text-gray-500" /> Filters
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Skills</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Products</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Students</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Revenue</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {authors.map((author) => (
                  <tr key={author.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => router.push(`/admin/authors/applications/${author.id}`)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0 border border-blue-200 shadow-sm text-blue-700 font-bold text-sm">
                          {author.avatar}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{author.name}</div>
                          <div className="text-xs font-medium text-gray-500 mt-0.5">{author.expertise}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {author.skills.map(skill => (
                          <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-md text-[11px] font-bold tracking-wide">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="font-bold text-gray-700">{author.products}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="font-bold text-gray-700">{author.students.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="font-bold text-gray-900">{author.revenue}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {author.status === 'Active' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      )}
                      {author.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                          Pending
                        </span>
                      )}
                      {author.status === 'Suspended' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-500">{author.joined}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Showing <span className="font-bold text-gray-700">1</span> to <span className="font-bold text-gray-700">5</span> of <span className="font-bold text-gray-700">1,248</span> authors</span>
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
