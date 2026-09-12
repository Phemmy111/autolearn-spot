"use client"

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Edit2, FileText, Calendar, Phone, Mail, MapPin,
  Linkedin, Link as LinkIcon, Users, UserCheck, UserPlus, Upload, Loader2, ShieldCheck, AlertTriangle
} from 'lucide-react';

// Sample data for demonstration – in a real app this would be fetched from the backend.
const sampleApplications = {
  app_1: {
    id: 'app_1',
    name: 'Daniel Williams',
    avatar: 'DW',
    email: 'daniel@example.com',
    phone: '+1 555‑123‑4567',
    location: 'New York, USA',
    linkedin: 'https://linkedin.com/in/daniel-williams',
    portfolio: 'https://danielw.dev',
    professionalTitle: 'Marketing Director',
    experience: '10+ years',
    skills: ['Digital Marketing', 'SEO', 'Content Strategy'],
    bio: "Passionate about helping brands grow through data‑driven strategies. Over a decade of experience leading marketing teams and driving ROI.",
    motivation: "I want to share my expertise with a community of eager learners and help them launch successful careers in marketing.",
    documents: {
      cv: '/documents/daniel_cv.pdf',
      portfolio: '/documents/daniel_portfolio.zip',
      id: '/documents/daniel_id.jpg',
    },
    status: 'Pending Review',
    submittedAt: '2023-10-12T10:45:00Z',
  },
  app_2: {
    id: 'app_2',
    name: 'Jessica Taylor',
    avatar: 'JT',
    email: 'jessica.t@example.com',
    phone: '+44 20 7946 0958',
    location: 'London, UK',
    linkedin: 'https://linkedin.com/in/jessica-taylor',
    portfolio: 'https://jessicadesign.co',
    professionalTitle: 'UI/UX Designer',
    experience: '4-5 years',
    skills: ['Figma', 'Prototyping', 'User Research'],
    bio: "Design‑first mind with a knack for turning complex problems into elegant user experiences.",
    motivation: "I love teaching design fundamentals and want to empower the next generation of creators.",
    documents: {
      cv: '/documents/jessica_cv.pdf',
      portfolio: '/documents/jessica_portfolio.zip',
      id: '/documents/jessica_id.png',
    },
    status: 'Approved',
    submittedAt: '2023-10-10T14:20:00Z',
  },
  // Additional mock entries can be added here.
};

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function fetchApplication() {
      try {
        const res = await fetch(`/api/admin/authors/applications/${id}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        if (data.application) {
          const appData = data.application;
          setApp({
            id: appData.id,
            name: appData.full_name,
            avatar: appData.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
            email: appData.email || 'Not provided',
            phone: appData.phone || 'Not provided', 
            location: appData.location || 'Not provided',
            linkedin: appData.linkedin_profile || '#',
            portfolio: appData.website_portfolio || appData.portfolio_url || '#',
            professionalTitle: appData.professional_title || 'Not specified',
            experience: appData.years_of_experience || 'Not specified',
            skills: appData.expertise && Array.isArray(appData.expertise) && appData.expertise.length > 0 
              ? appData.expertise 
              : ['Not specified'],
            bio: appData.bio || 'Not provided',
            motivation: appData.motivation || 'Not provided',
            documents: {
              cv: appData.cv_url || '#',
              portfolio: appData.portfolio_samples_url || '#',
              id: appData.id_document_url || '#' 
            },
            status: appData.status === 'SUBMITTED' || appData.status === 'UNDER_REVIEW' ? 'Pending Review' : 
                    appData.status === 'APPROVED' ? 'Approved' : 'Rejected',
            submittedAt: appData.submitted_at
          });
        }
      } catch(e) {
        console.error(e);
        // Fallback to sample data
        setApp(sampleApplications[id as keyof typeof sampleApplications] || null);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchApplication();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F4F5F7] text-gray-900 font-sans">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F4F5F7] text-gray-900 font-sans">
        <p className="text-lg text-gray-600">Application not found.</p>
      </div>
    );
  }

  const statusColors = {
    'Pending Review': 'bg-amber-50 text-amber-700 border-amber-100',
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Rejected: 'bg-red-50 text-red-700 border-red-100',
  };

  const handleAction = async (action: string) => {
    try {
      if (action === 'Approve') {
        const response = await fetch(`/api/admin/authors/applications/${id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ admin_review_note: 'Approved via admin portal' })
        });
        
        if (response.ok) {
          const data = await response.json();
          alert(`Application approved successfully! Author profile created.`);
          // Refresh the application data
          const res = await fetch(`/api/admin/authors/applications/${id}`);
          const newData = await res.json();
          if (newData.application) {
            const appData = newData.application;
            setApp(prev => ({
              ...prev,
              status: 'Approved',
            }));
          }
        } else {
          alert('Failed to approve application');
        }
      } else if (action === 'Reject') {
        const reason = prompt('Please provide a reason for rejection:');
        if (reason) {
          const response = await fetch(`/api/admin/authors/applications/${id}/decline`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_review_note: reason })
          });
          
          if (response.ok) {
            alert('Application declined successfully');
            // Refresh the application data
            const res = await fetch(`/api/admin/authors/applications/${id}`);
            const newData = await res.json();
            if (newData.application) {
              setApp(prev => ({
                ...prev,
                status: 'Rejected',
              }));
            }
          } else {
            alert('Failed to decline application');
          }
        }
      } else if (action === 'Request Changes') {
        const note = prompt('Please describe the changes needed:');
        if (note) {
          const response = await fetch(`/api/admin/authors/applications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              status: 'UNDER_REVIEW',
              admin_review_note: note 
            })
          });
          
          if (response.ok) {
            alert('Request for changes sent successfully');
            // Refresh the application data
            const res = await fetch(`/api/admin/authors/applications/${id}`);
            const newData = await res.json();
            if (newData.application) {
              setApp(prev => ({
                ...prev,
                status: 'Pending Review',
              }));
            }
          } else {
            alert('Failed to request changes');
          }
        }
      }
    } catch (error) {
      console.error('Error handling action:', error);
      alert('An error occurred while processing your request');
    }
  };

  return (
    <div className="min-h-screen pb-12 text-gray-900 font-sans bg-[#F4F5F7]">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-gray-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
          <Link href="/admin/authors" className="hover:text-gray-800 transition-colors">Admin</Link>
          <ArrowLeft className="h-4 w-4 text-gray-400" />
          <Link href="/admin/authors/applications" className="hover:text-gray-800 transition-colors">Applications</Link>
          <ArrowLeft className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900 font-semibold">{app.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
            <Edit2 className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors" onClick={() => router.back()} title="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 sm:px-8 pt-8">
        {/* Header */}
        <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-2xl font-bold text-indigo-700 shadow-sm border border-indigo-200">
              {app.avatar}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">{app.name}</h1>
              <p className="text-sm text-gray-500">{app.professionalTitle}</p>
            </div>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${statusColors[app.status as keyof typeof statusColors]}`}
          >
            {app.status === 'Pending Review' && <Clock className="h-4 w-4" />}
            {app.status === 'Approved' && <CheckCircle2 className="h-4 w-4" />}
            {app.status === 'Rejected' && <XCircle className="h-4 w-4" />}
            {app.status}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          {app.status === 'Pending Review' && (
            <>
              <button
                onClick={() => handleAction('Approve')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" /> Approve
              </button>
              <button
                onClick={() => handleAction('Reject')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                <XCircle className="h-4 w-4" /> Reject
              </button>
              <button
                onClick={() => handleAction('Request Changes')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
              >
                <AlertTriangle className="h-4 w-4" /> Request Changes
              </button>
            </>
          )}
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" /> Personal Information
            </h2>
            <dl className="grid grid-cols-1 gap-3">
              <div className="flex justify-between"><dt className="text-sm text-gray-600">Email</dt><dd className="text-sm font-medium text-gray-900">{app.email}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-gray-600">Phone</dt><dd className="text-sm font-medium text-gray-900">{app.phone}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-gray-600">Location</dt><dd className="text-sm font-medium text-gray-900">{app.location}</dd></div>
              <div className="flex justify-between items-center"><dt className="text-sm text-gray-600">LinkedIn</dt><dd className="text-sm font-medium text-blue-600 underline"><a href={app.linkedin} target="_blank" rel="noopener noreferrer">Profile</a></dd></div>
              <div className="flex justify-between items-center"><dt className="text-sm text-gray-600">Portfolio</dt><dd className="text-sm font-medium text-blue-600 underline"><a href={app.portfolio} target="_blank" rel="noopener noreferrer">Site</a></dd></div>
            </dl>
          </section>

          {/* Professional Information */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-gray-500" /> Professional Information
            </h2>
            <dl className="grid grid-cols-1 gap-3">
              <div className="flex justify-between"><dt className="text-sm text-gray-600">Title</dt><dd className="text-sm font-medium text-gray-900">{app.professionalTitle}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-gray-600">Experience</dt><dd className="text-sm font-medium text-gray-900">{app.experience}</dd></div>
              <div className="flex flex-col">
                <dt className="text-sm text-gray-600 mb-1">Skills</dt>
                <dd className="flex flex-wrap gap-2">
                  {app.skills.map((skill) => (
                    <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">{skill}</span>
                  ))}
                </dd>
              </div>
            </dl>
          </section>

          {/* About & Motivation */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500" /> About / Motivation
            </h2>
            <p className="text-sm text-gray-700 mb-4"><span className="font-medium">Bio:</span> {app.bio}</p>
            <p className="text-sm text-gray-700"><span className="font-medium">Motivation:</span> {app.motivation}</p>
          </section>

          {/* Documents */}
          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5 text-gray-500" /> Documents
            </h2>
            <ul className="space-y-3">
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">Curriculum Vitae (CV)</span>
                </div>
                <a href={app.documents.cv} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">View</a>
              </li>
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">Portfolio Samples</span>
                </div>
                <a href={app.documents.portfolio} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Download</a>
              </li>
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">ID Document</span>
                </div>
                <a href={app.documents.id} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">View</a>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}