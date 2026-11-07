'use client';

import { useState } from 'react';
import { Mail, Send, CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface TestItem {
  id: string;
  name: string;
  category: string;
  description: string;
}

const TEST_EVENTS: TestItem[] = [
  {
    id: 'course_purchase_confirmation',
    name: 'Course Purchase Confirmation',
    category: 'Marketplace',
    description: 'Sent to the student immediately after paying for a course via Paystack.',
  },
  {
    id: 'course_sale_notification',
    name: 'Author New Sale Alert',
    category: 'Marketplace',
    description: 'Sent to the course author with net earnings and student details.',
  },
  {
    id: 'partner_commission_earned',
    name: 'Affiliate Commission Earned',
    category: 'Growth Engine',
    description: 'Sent to an affiliate partner when their referral link generates a sale.',
  },
  {
    id: 'partner_approved',
    name: 'Partner Application Approved',
    category: 'Growth Engine',
    description: 'Sent to an affiliate applicant upon acceptance with temporary password & portal link.',
  },
  {
    id: 'scholarship_application_received',
    name: 'Scholarship Application Received',
    category: 'Scholarship',
    description: 'Sent to scholarship applicant confirming their reference number & review timeline.',
  },
  {
    id: 'scholarship_accepted',
    name: 'Scholarship Acceptance Notice',
    category: 'Scholarship',
    description: 'Sent to shortlisted student with cohort details and fee payment link.',
  },
  {
    id: 'scholarship_welcome',
    name: 'Scholarship Welcome & Verification',
    category: 'Scholarship',
    description: 'Sent after student pays commitment fee, granting access to student dashboard.',
  },
  {
    id: 'author_approved',
    name: 'Author Application Approved',
    category: 'Author',
    description: 'Sent to creator approving them to publish courses on the marketplace.',
  },
  {
    id: 'quiz_completed',
    name: 'Quiz Completion Receipt',
    category: 'Learning',
    description: 'Sent to student after finishing a graded quiz with their percentage score.',
  },
  {
    id: 'course_completed',
    name: 'Course Completion & Certificate',
    category: 'Learning',
    description: 'Sent upon 100% course completion with certificate verification link.',
  },
  {
    id: 'withdrawal_paid',
    name: 'Withdrawal Payout Confirmed',
    category: 'Finance',
    description: 'Sent to author or partner confirming their bank transfer has been paid.',
  },
];

export default function EmailTestPage() {
  const [email, setEmail] = useState('femiadeleke2020@gmail.com');
  const [loadingAll, setLoadingAll] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, { state: 'idle' | 'sending' | 'success' | 'error'; error?: string }>>({});

  const runTest = async (eventId?: string) => {
    if (!email) return;

    if (eventId) {
      setStatuses((prev) => ({ ...prev, [eventId]: { state: 'sending' } }));
    } else {
      setLoadingAll(true);
      const initial: Record<string, { state: 'sending' }> = {};
      TEST_EVENTS.forEach((e) => (initial[e.id] = { state: 'sending' }));
      setStatuses(initial);
    }

    try {
      const url = `/api/admin/test-all-emails?secret=autolearn_test_2026&email=${encodeURIComponent(email)}${eventId ? `&event=${eventId}` : ''}`;
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();

      if (data.results) {
        setStatuses((prev) => {
          const updated = { ...prev };
          Object.entries(data.results).forEach(([key, val]: [string, any]) => {
            updated[key] = {
              state: val.success ? 'success' : 'error',
              error: val.error,
            };
          });
          return updated;
        });
      } else if (!res.ok) {
        const errMsg = data.error || 'Request failed';
        if (eventId) {
          setStatuses((prev) => ({ ...prev, [eventId]: { state: 'error', error: errMsg } }));
        }
      }
    } catch (err: any) {
      if (eventId) {
        setStatuses((prev) => ({ ...prev, [eventId]: { state: 'error', error: err.message } }));
      }
    } finally {
      if (!eventId) setLoadingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0e12] text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f2229] pb-6">
          <div>
            <Link
              href="/admin/settings/email-notifications"
              className="inline-flex items-center gap-2 text-sm text-[#00f0ff] hover:underline mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Email Settings
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Mail className="w-8 h-8 text-[#00f0ff]" /> Email Automation Tester
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Trigger real-time production test emails across all AutoLearn Spot automation workflows.
            </p>
          </div>

          <button
            onClick={() => runTest()}
            disabled={loadingAll || !email}
            className="flex items-center justify-center gap-2 bg-[#00f0ff] hover:bg-[#00c8d7] text-black font-semibold px-6 py-3 rounded-lg transition-all disabled:opacity-50"
          >
            {loadingAll ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {loadingAll ? 'Sending All Tests...' : 'Test All 11 Events'}
          </button>
        </div>

        {/* Target Email Input Card */}
        <div className="bg-[#111317] border border-[#1f2229] rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-auto">
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
              Target Test Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. femiadeleke2020@gmail.com"
              className="w-full md:w-96 bg-[#1a1c22] border border-[#2b303a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#00f0ff]"
            />
          </div>
          <p className="text-xs text-gray-400 max-w-md">
            All test notifications will be sent directly to this inbox using the live Vercel SMTP server.
          </p>
        </div>

        {/* Event Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEST_EVENTS.map((evt) => {
            const status = statuses[evt.id]?.state || 'idle';
            const error = statuses[evt.id]?.error;

            return (
              <div
                key={evt.id}
                className="bg-[#111317] border border-[#1f2229] rounded-xl p-5 flex flex-col justify-between hover:border-[#2b303a] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#1a1c22] text-[#00f0ff] border border-[#00f0ff]/20">
                      {evt.category}
                    </span>

                    {status === 'sending' && (
                      <span className="text-xs text-yellow-400 flex items-center gap-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                      </span>
                    )}
                    {status === 'success' && (
                      <span className="text-xs text-green-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Sent to Inbox
                      </span>
                    )}
                    {status === 'error' && (
                      <span className="text-xs text-red-400 flex items-center gap-1 font-medium" title={error}>
                        <XCircle className="w-4 h-4" /> Failed
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-base text-gray-100">{evt.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{evt.description}</p>

                  {error && (
                    <p className="text-xs text-red-400 mt-2 bg-red-950/40 p-2 rounded border border-red-900/50">
                      {error}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#1f2229] flex justify-end">
                  <button
                    onClick={() => runTest(evt.id)}
                    disabled={status === 'sending' || !email}
                    className="text-xs bg-[#1a1c22] hover:bg-[#252830] text-gray-200 hover:text-white px-3.5 py-1.5 rounded-md border border-[#2b303a] flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {status === 'sending' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-[#00f0ff]" />
                    )}
                    Send Test
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
