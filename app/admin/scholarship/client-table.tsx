"use client";

import { useState } from 'react';
import { ScholarshipApplication, ScholarshipStatus } from '@/types/scholarship';
import { updateScholarshipStatus, updateAdminNotes } from './actions';
import { Search, Edit, Eye, X, Loader2 } from 'lucide-react';

export function ScholarshipClientTable({ initialData, isSuperAdmin }: { initialData: ScholarshipApplication[], isSuperAdmin: boolean }) {
  const [data, setData] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  const [selectedApp, setSelectedApp] = useState<ScholarshipApplication | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [newStatus, setNewStatus] = useState<ScholarshipStatus>('Submitted');

  const filteredData = data.filter(app => {
    const matchesSearch = 
      app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.reference_number.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted': return 'text-[#b9cacb] bg-[#b9cacb]/10 border-[#3b494b]';
      case 'Under Review': return 'text-[#00f0ff] bg-[#00f0ff]/10 border-[#00f0ff]/30';
      case 'Shortlisted': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'Accepted': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'Waitlisted': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'Not Selected': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-[#b9cacb]';
    }
  };

  const handleUpdate = async () => {
    if (!selectedApp) return;
    setIsUpdating(true);
    
    try {
      if (newStatus !== selectedApp.status) {
        await updateScholarshipStatus(selectedApp.id, newStatus);
      }
      if (notes !== (selectedApp.admin_notes || '')) {
        await updateAdminNotes(selectedApp.id, notes);
      }
      
      // Update local state
      setData(prev => prev.map(a => 
        a.id === selectedApp.id 
          ? { ...a, status: newStatus, admin_notes: notes } 
          : a
      ));
      
      setSelectedApp(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update application');
    } finally {
      setIsUpdating(false);
    }
  };

  const openModal = (app: ScholarshipApplication) => {
    setSelectedApp(app);
    setNewStatus(app.status);
    setNotes(app.admin_notes || '');
  };

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-center bg-[#0c0e12] border border-[#1f2229] p-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b9cacb]" />
          <input
            type="text"
            placeholder="Search by name, email, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1c20] border border-[#3b494b] pl-10 pr-4 py-2 text-white focus:border-[#00f0ff] focus:outline-none transition-colors font-mono text-sm"
          />
        </div>
        
        <div className="w-full md:w-auto flex items-center gap-2">
          <label className="text-sm font-mono text-[#b9cacb] whitespace-nowrap">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto bg-[#1a1c20] border border-[#3b494b] px-4 py-2 text-white focus:border-[#00f0ff] focus:outline-none transition-colors font-mono text-sm appearance-none"
          >
            <option value="All">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Accepted">Accepted</option>
            <option value="Waitlisted">Waitlisted</option>
            <option value="Not Selected">Not Selected</option>
          </select>
        </div>
      </div>

      <div className="bg-[#0c0e12] border border-[#1f2229] overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1f2229] bg-[#1a1c20]">
              <th className="p-4 font-mono text-xs font-bold uppercase text-[#b9cacb]">Reference</th>
              <th className="p-4 font-mono text-xs font-bold uppercase text-[#b9cacb]">Applicant</th>
              <th className="p-4 font-mono text-xs font-bold uppercase text-[#b9cacb]">Experience</th>
              <th className="p-4 font-mono text-xs font-bold uppercase text-[#b9cacb]">Status</th>
              <th className="p-4 font-mono text-xs font-bold uppercase text-[#b9cacb]">Applied Date</th>
              <th className="p-4 font-mono text-xs font-bold uppercase text-[#b9cacb] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#b9cacb] font-mono text-sm">
                  No applications found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredData.map((app) => (
                <tr key={app.id} className="border-b border-[#1f2229] hover:bg-[#1a1c20] transition-colors">
                  <td className="p-4 font-mono text-sm text-[#00f0ff] font-bold">{app.reference_number}</td>
                  <td className="p-4">
                    <div className="font-bold text-white">{app.full_name}</div>
                    <div className="text-xs text-[#b9cacb]">{app.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs text-[#b9cacb]">AI: <span className="text-white">{app.ai_experience}</span></div>
                    <div className="text-xs text-[#b9cacb]">Auto: <span className="text-white">{app.automation_experience}</span></div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 text-xs font-bold border rounded-full ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-[#b9cacb]">
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => openModal(app)}
                      className="inline-flex items-center justify-center p-2 border border-[#3b494b] text-[#b9cacb] hover:text-[#00f0ff] hover:border-[#00f0ff] transition-colors"
                      title="View & Edit"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Application Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0c0e12] border border-[#1f2229] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-[#1a1c20] border-b border-[#1f2229] p-4 flex justify-between items-center z-10">
              <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                Application <span className="text-[#00f0ff]">{selectedApp.reference_number}</span>
              </h2>
              <button 
                onClick={() => setSelectedApp(null)}
                className="p-2 text-[#b9cacb] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="font-mono text-sm uppercase text-[#b9cacb] border-b border-[#1f2229] pb-2 mb-4">Personal Info</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-[#b9cacb]">Name:</span> {selectedApp.full_name}</p>
                    <p><span className="text-[#b9cacb]">Email:</span> {selectedApp.email}</p>
                    <p><span className="text-[#b9cacb]">Phone:</span> {selectedApp.phone}</p>
                    <p><span className="text-[#b9cacb]">WhatsApp:</span> {selectedApp.whatsapp}</p>
                    <p><span className="text-[#b9cacb]">Location:</span> {selectedApp.state}, {selectedApp.country}</p>
                    <p><span className="text-[#b9cacb]">Occupation:</span> {selectedApp.occupation}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-mono text-sm uppercase text-[#b9cacb] border-b border-[#1f2229] pb-2 mb-4">Tech Background</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-[#b9cacb]">AI Exp:</span> {selectedApp.ai_experience}</p>
                    <p><span className="text-[#b9cacb]">Automation Exp:</span> {selectedApp.automation_experience}</p>
                    <p><span className="text-[#b9cacb]">Has Laptop:</span> {selectedApp.has_laptop ? 'Yes' : 'No'}</p>
                    <p><span className="text-[#b9cacb]">Has Internet:</span> {selectedApp.has_internet ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-mono text-sm uppercase text-[#b9cacb] border-b border-[#1f2229] pb-2 mb-4">Admin Actions</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono text-[#b9cacb] mb-1">Update Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as ScholarshipStatus)}
                        className="w-full bg-[#1a1c20] border border-[#3b494b] px-3 py-2 text-white focus:border-[#00f0ff] focus:outline-none transition-colors text-sm appearance-none"
                      >
                        <option value="Submitted">Submitted</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Waitlisted">Waitlisted</option>
                        <option value="Not Selected">Not Selected</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-[#b9cacb] mb-1">Admin Notes (Internal only)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        placeholder="Add internal notes about this applicant..."
                        className="w-full bg-[#1a1c20] border border-[#3b494b] p-3 text-white focus:border-[#00f0ff] focus:outline-none transition-colors text-sm resize-none"
                      />
                    </div>

                    <button
                      onClick={handleUpdate}
                      disabled={isUpdating}
                      className="w-full flex items-center justify-center gap-2 border border-[#00f0ff] bg-[#00f0ff] px-4 py-2 font-mono text-sm font-bold uppercase text-black transition-all hover:bg-transparent hover:text-[#00f0ff] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-mono text-sm uppercase text-[#b9cacb] border-b border-[#1f2229] pb-2 mb-4">Motivation</h3>
                  <p className="text-sm bg-[#1a1c20] p-4 border border-[#1f2229] whitespace-pre-wrap">{selectedApp.motivation}</p>
                </div>
                
                <div>
                  <h3 className="font-mono text-sm uppercase text-[#b9cacb] border-b border-[#1f2229] pb-2 mb-4">Goals</h3>
                  <p className="text-sm bg-[#1a1c20] p-4 border border-[#1f2229] whitespace-pre-wrap">{selectedApp.goals}</p>
                </div>
                
                <div>
                  <h3 className="font-mono text-sm uppercase text-[#b9cacb] border-b border-[#1f2229] pb-2 mb-4">Impact</h3>
                  <p className="text-sm bg-[#1a1c20] p-4 border border-[#1f2229] whitespace-pre-wrap">{selectedApp.impact}</p>
                </div>
                
                <div>
                  <h3 className="font-mono text-sm uppercase text-[#b9cacb] border-b border-[#1f2229] pb-2 mb-4">Why Select You</h3>
                  <p className="text-sm bg-[#1a1c20] p-4 border border-[#1f2229] whitespace-pre-wrap">{selectedApp.why_you}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
