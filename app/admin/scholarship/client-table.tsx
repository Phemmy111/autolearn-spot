"use client";

import { useState, useEffect } from 'react';
import { ScholarshipApplication, ScholarshipStatus } from '@/types/scholarship';
import { updateScholarshipStatus, updateAdminNotes, updatePaymentStatus, getApplicationTimeline } from './actions';
import { Search, Edit, Eye, X, Loader2, CreditCard, Clock, User } from 'lucide-react';

export function ScholarshipClientTable({ initialData, isSuperAdmin }: { initialData: ScholarshipApplication[], isSuperAdmin: boolean }) {
  const [data, setData] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  const [selectedApp, setSelectedApp] = useState<ScholarshipApplication | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [newStatus, setNewStatus] = useState<ScholarshipStatus>('Submitted');
  const [paymentStatus, setPaymentStatus] = useState('Waiting');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

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
      case 'Submitted': return 'text-[text-[var(--text-muted)]] bg-[text-[var(--text-muted)]]/10 border-[border-[var(--border-default)]]';
      case 'Under Review': return 'text-[text-[var(--primary)]] bg-[text-[var(--primary)]]/10 border-[text-[var(--primary)]]/30';
      case 'Shortlisted': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'Accepted': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'Waitlisted': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'Not Selected': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-[text-[var(--text-muted)]]';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Waiting': return 'text-[text-[var(--text-muted)]] bg-[text-[var(--text-muted)]]/10 border-[border-[var(--border-default)]]';
      case 'Pending Verification': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'Verified': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'Rejected': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-[text-[var(--text-muted)]]';
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
      if (paymentStatus !== (selectedApp.payment_status || 'Waiting') || paymentNotes !== (selectedApp.payment_notes || '')) {
        await updatePaymentStatus(selectedApp.id, paymentStatus, paymentNotes || undefined);
      }
      
      // Update local state
      setData(prev => prev.map(a => 
        a.id === selectedApp.id 
          ? { ...a, status: newStatus, admin_notes: notes, payment_status: paymentStatus, payment_notes: paymentNotes } 
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

  const openModal = async (app: ScholarshipApplication) => {
    setSelectedApp(app);
    setNewStatus(app.status);
    setNotes(app.admin_notes || '');
    setPaymentStatus(app.payment_status || 'Waiting');
    setPaymentNotes(app.payment_notes || '');
    
    // Load timeline
    setLoadingTimeline(true);
    try {
      const timelineData = await getApplicationTimeline(app.id);
      setTimeline(timelineData);
    } catch (error) {
      console.error('Failed to load timeline:', error);
      setTimeline([]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-center bg-[bg-[var(--card)]] border border-[border-[var(--border-default)]] p-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[text-[var(--text-muted)]]" />
          <input
            type="text"
            placeholder="Search by name, email, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[bg-[var(--card)]] border border-[border-[var(--border-default)]] pl-10 pr-4 py-2 text-[var(--text-primary)] focus:border-[text-[var(--primary)]] focus:outline-none transition-colors font-mono text-sm"
          />
        </div>
        
        <div className="w-full md:w-auto flex items-center gap-2">
          <label className="text-sm font-mono text-[text-[var(--text-muted)]] whitespace-nowrap">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto bg-[bg-[var(--card)]] border border-[border-[var(--border-default)]] px-4 py-2 text-[var(--text-primary)] focus:border-[text-[var(--primary)]] focus:outline-none transition-colors font-mono text-sm appearance-none"
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

      <div className="bg-[bg-[var(--card)]] border border-[border-[var(--border-default)]] overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[border-[var(--border-default)]] bg-[bg-[var(--card)]]">
              <th className="p-4 font-mono text-xs font-bold uppercase text-[text-[var(--text-muted)]]">Reference</th>
              <th className="p-4 font-mono text-xs font-bold uppercase text-[text-[var(--text-muted)]]">Applicant</th>
              <th className="p-4 font-mono text-xs font-bold uppercase text-[text-[var(--text-muted)]]">Experience</th>
              <th className="p-4 font-mono text-xs font-bold uppercase text-[text-[var(--text-muted)]]">Status</th>
              <th className="p-4 font-mono text-xs font-bold uppercase text-[text-[var(--text-muted)]]">Payment</th>
              <th className="p-4 font-mono text-xs font-bold uppercase text-[text-[var(--text-muted)]]">Applied Date</th>
              <th className="p-4 font-mono text-xs font-bold uppercase text-[text-[var(--text-muted)]] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[text-[var(--text-muted)]] font-mono text-sm">
                  No applications found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredData.map((app) => (
                <tr key={app.id} className="border-b border-[border-[var(--border-default)]] hover:bg-[bg-[var(--card)]] transition-colors">
                  <td className="p-4 font-mono text-sm text-[text-[var(--primary)]] font-bold">{app.reference_number}</td>
                  <td className="p-4">
                    <div className="font-bold text-[var(--text-primary)]">{app.full_name}</div>
                    <div className="text-xs text-[text-[var(--text-muted)]]">{app.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs text-[text-[var(--text-muted)]]">AI: <span className="text-[var(--text-primary)]">{app.ai_experience}</span></div>
                    <div className="text-xs text-[text-[var(--text-muted)]]">Auto: <span className="text-[var(--text-primary)]">{app.automation_experience}</span></div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 text-xs font-bold border rounded-full ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 text-xs font-bold border rounded-full ${getPaymentStatusColor(app.payment_status || 'Waiting')}`}>
                      {app.payment_status || 'Waiting'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-[text-[var(--text-muted)]]">
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => openModal(app)}
                      className="inline-flex items-center justify-center p-2 border border-[border-[var(--border-default)]] text-[text-[var(--text-muted)]] hover:text-[text-[var(--primary)]] hover:border-[text-[var(--primary)]] transition-colors"
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
          <div className="bg-[bg-[var(--card)]] border border-[border-[var(--border-default)]] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-[bg-[var(--card)]] border-b border-[border-[var(--border-default)]] p-4 flex justify-between items-center z-10">
              <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                Application <span className="text-[text-[var(--primary)]]">{selectedApp.reference_number}</span>
              </h2>
              <button 
                onClick={() => setSelectedApp(null)}
                className="p-2 text-[text-[var(--text-muted)]] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="font-mono text-sm uppercase text-[text-[var(--text-muted)]] border-b border-[border-[var(--border-default)]] pb-2 mb-4">Personal Info</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-[text-[var(--text-muted)]]">Name:</span> {selectedApp.full_name}</p>
                    <p><span className="text-[text-[var(--text-muted)]]">Email:</span> {selectedApp.email}</p>
                    <p><span className="text-[text-[var(--text-muted)]]">Phone:</span> {selectedApp.phone}</p>
                    <p><span className="text-[text-[var(--text-muted)]]">WhatsApp:</span> {selectedApp.whatsapp}</p>
                    <p><span className="text-[text-[var(--text-muted)]]">Location:</span> {selectedApp.state}, {selectedApp.country}</p>
                    <p><span className="text-[text-[var(--text-muted)]]">Occupation:</span> {selectedApp.occupation}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-mono text-sm uppercase text-[text-[var(--text-muted)]] border-b border-[border-[var(--border-default)]] pb-2 mb-4">Tech Background</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-[text-[var(--text-muted)]]">AI Exp:</span> {selectedApp.ai_experience}</p>
                    <p><span className="text-[text-[var(--text-muted)]]">Automation Exp:</span> {selectedApp.automation_experience}</p>
                    <p><span className="text-[text-[var(--text-muted)]]">Has Laptop:</span> {selectedApp.has_laptop ? 'Yes' : 'No'}</p>
                    <p><span className="text-[text-[var(--text-muted)]]">Has Internet:</span> {selectedApp.has_internet ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-mono text-sm uppercase text-[text-[var(--text-muted)]] border-b border-[border-[var(--border-default)]] pb-2 mb-4">Admin Actions</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono text-[text-[var(--text-muted)]] mb-1">Update Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as ScholarshipStatus)}
                        className="w-full bg-[bg-[var(--card)]] border border-[border-[var(--border-default)]] px-3 py-2 text-[var(--text-primary)] focus:border-[text-[var(--primary)]] focus:outline-none transition-colors text-sm appearance-none"
                      >
                        <option value="Submitted">Submitted</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Waitlisted">Waitlisted</option>
                        <option value="Not Selected">Not Selected</option>
                      </select>
                    </div>

                    {selectedApp.status === 'Accepted' && (
                      <div className="space-y-4 border-t border-[border-[var(--border-default)]] pt-4">
                        <div className="flex items-center gap-2 text-[text-[var(--primary)]]">
                          <CreditCard className="w-4 h-4" />
                          <h4 className="font-mono text-xs uppercase">Payment Management</h4>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-mono text-[text-[var(--text-muted)]] mb-1">Payment Status</label>
                          <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                            className="w-full bg-[bg-[var(--card)]] border border-[border-[var(--border-default)]] px-3 py-2 text-[var(--text-primary)] focus:border-[text-[var(--primary)]] focus:outline-none transition-colors text-sm appearance-none"
                          >
                            <option value="Waiting">Waiting</option>
                            <option value="Pending Verification">Pending Verification</option>
                            <option value="Verified">Verified</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-mono text-[text-[var(--text-muted)]] mb-1">Payment Notes</label>
                          <textarea
                            value={paymentNotes}
                            onChange={(e) => setPaymentNotes(e.target.value)}
                            rows={2}
                            placeholder="Add payment verification notes..."
                            className="w-full bg-[bg-[var(--card)]] border border-[border-[var(--border-default)]] p-3 text-[var(--text-primary)] focus:border-[text-[var(--primary)]] focus:outline-none transition-colors text-sm resize-none"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-mono text-[text-[var(--text-muted)]] mb-1">Admin Notes (Internal only)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        placeholder="Add internal notes about this applicant..."
                        className="w-full bg-[bg-[var(--card)]] border border-[border-[var(--border-default)]] p-3 text-[var(--text-primary)] focus:border-[text-[var(--primary)]] focus:outline-none transition-colors text-sm resize-none"
                      />
                    </div>

                    <button
                      onClick={handleUpdate}
                      disabled={isUpdating}
                      className="w-full flex items-center justify-center gap-2 border border-[text-[var(--primary)]] bg-[text-[var(--primary)]] px-4 py-2 font-mono text-sm font-bold uppercase text-black transition-all hover:bg-transparent hover:text-[text-[var(--primary)]] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Timeline Section */}
                <div>
                  <h3 className="font-mono text-sm uppercase text-[text-[var(--text-muted)]] border-b border-[border-[var(--border-default)]] pb-2 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Application Timeline
                  </h3>
                  
                  {loadingTimeline ? (
                    <div className="text-sm text-[text-[var(--text-muted)]]">Loading timeline...</div>
                  ) : timeline.length === 0 ? (
                    <div className="text-sm text-[text-[var(--text-muted)]]">No timeline events recorded</div>
                  ) : (
                    <div className="space-y-3">
                      {timeline.map((event, index) => (
                        <div key={event.id} className="relative pl-6 border-l-2 border-[border-[var(--border-default)]]">
                          <div className="absolute left-0 top-0 w-4 h-4 -translate-x-1/2 bg-[text-[var(--primary)]] rounded-full"></div>
                          <div className="bg-[bg-[var(--card)]] p-3 border border-[border-[var(--border-default)]]">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-bold text-[text-[var(--primary)]]">
                                {event.to_status}
                              </span>
                              <span className="text-xs text-[text-[var(--text-muted)]]">
                                {new Date(event.created_at).toLocaleString()}
                              </span>
                            </div>
                            {event.from_status && (
                              <div className="text-xs text-[text-[var(--text-muted)]] mb-1">
                                From: {event.from_status}
                              </div>
                            )}
                            {event.reason && (
                              <div className="text-xs text-[var(--text-primary)] mb-1">
                                Reason: {event.reason}
                              </div>
                            )}
                            {event.admin_email && (
                              <div className="text-xs text-[text-[var(--text-muted)]] flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {event.admin_email}
                              </div>
                            )}
                            {event.notes && (
                              <div className="text-xs text-gray-400 mt-2 italic">
                                {event.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-mono text-sm uppercase text-[text-[var(--text-muted)]] border-b border-[border-[var(--border-default)]] pb-2 mb-4">Motivation</h3>
                  <p className="text-sm bg-[bg-[var(--card)]] p-4 border border-[border-[var(--border-default)]] whitespace-pre-wrap">{selectedApp.motivation}</p>
                </div>
                
                <div>
                  <h3 className="font-mono text-sm uppercase text-[text-[var(--text-muted)]] border-b border-[border-[var(--border-default)]] pb-2 mb-4">Goals</h3>
                  <p className="text-sm bg-[bg-[var(--card)]] p-4 border border-[border-[var(--border-default)]] whitespace-pre-wrap">{selectedApp.goals}</p>
                </div>
                
                <div>
                  <h3 className="font-mono text-sm uppercase text-[text-[var(--text-muted)]] border-b border-[border-[var(--border-default)]] pb-2 mb-4">Impact</h3>
                  <p className="text-sm bg-[bg-[var(--card)]] p-4 border border-[border-[var(--border-default)]] whitespace-pre-wrap">{selectedApp.impact}</p>
                </div>
                
                <div>
                  <h3 className="font-mono text-sm uppercase text-[text-[var(--text-muted)]] border-b border-[border-[var(--border-default)]] pb-2 mb-4">Why Select You</h3>
                  <p className="text-sm bg-[bg-[var(--card)]] p-4 border border-[border-[var(--border-default)]] whitespace-pre-wrap">{selectedApp.why_you}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
