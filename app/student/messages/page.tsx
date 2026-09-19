"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Search, Plus, Clock, X } from "lucide-react";
import { ChatView } from "@/components/ChatView";

interface Conversation {
  id: string;
  student_id: string;
  author_id: string;
  learning_product_id: string;
  created_at: string;
  updated_at: string;
  unread_count: number;
  learning_products: { id: string; title: string; thumbnail: string | null };
  authors: { id: string; display_name: string; profile_image: string | null };
}

interface EnrolledCourse { id: string; title: string; author_id: string; author_name: string }

function NewMessageModal({ courses, onClose, onCreated }: {
  courses: EnrolledCourse[]; onClose: () => void; onCreated: (c: Conversation) => void;
}) {
  const [sel, setSel] = useState("");
  const [busy, setBusy] = useState(false);
  const go = async () => {
    if (!sel || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/student/messages/conversations", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ learning_product_id: sel }),
      });
      const d = await res.json();
      if (d.success) onCreated(d.conversation);
      else alert(d.error || "Failed");
    } catch { alert("Network error"); }
    finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Start New Conversation</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
        <select value={sel} onChange={e => setSel(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 mb-4">
          <option value="">Choose a course...</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title} — {c.author_name}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={go} disabled={!sel || busy} className="flex-1 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 disabled:bg-gray-200 disabled:text-gray-400 font-medium text-sm">{busy ? "Starting..." : "Start Conversation"}</button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function StudentMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [showModal, setShowModal] = useState(false);

  const loadConvs = useCallback(async () => {
    try {
      const r = await fetch("/api/student/messages/conversations", { credentials: "include" });
      const d = await r.json();
      if (d.success) setConversations(d.conversations || []);
    } catch {} finally { setLoading(false); }
  }, []);

  const loadCourses = useCallback(async () => {
    try {
      const r = await fetch("/api/student/enrolled-courses", { credentials: "include" });
      const d = await r.json();
      if (d.success) setCourses(d.courses || []);
    } catch {}
  }, []);

  useEffect(() => { loadConvs(); loadCourses(); }, [loadConvs, loadCourses]);

  const filtered = conversations.filter(c =>
    c.learning_products?.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.authors?.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (selected) {
    return (
      <ChatView
        conversationId={selected.id}
        myRole="STUDENT"
        headerName={selected.authors?.display_name || "Instructor"}
        headerSub={selected.learning_products?.title || ""}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-text mb-0.5">Messages</h1>
            <p className="text-brand-text/60 text-sm">Communicate with your course instructors</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 text-sm font-medium shadow-sm">
            <Plus className="w-4 h-4" /> New Message
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm" />
        </div>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <MessageSquare className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-500 text-sm">{search ? "No results" : "No conversations yet"}</p>
            <p className="text-gray-400 text-xs mt-1">Start a conversation with your instructor</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(conv => (
              <button key={conv.id} onClick={() => setSelected(conv)} className="w-full p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all text-left group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sky-700 font-bold text-sm">{conv.authors?.display_name?.charAt(0) || "?"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate text-sm">{conv.authors?.display_name}</p>
                      {conv.unread_count > 0 && <span className="px-1.5 py-0.5 bg-sky-500 text-white text-[10px] font-bold rounded-full">{conv.unread_count}</span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{conv.learning_products?.title}</p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />{new Date(conv.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {showModal && <NewMessageModal courses={courses} onClose={() => setShowModal(false)} onCreated={conv => { setShowModal(false); loadConvs(); setSelected(conv); }} />}
    </>
  );
}
