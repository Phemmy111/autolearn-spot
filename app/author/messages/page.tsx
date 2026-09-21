"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Search, Plus, Clock, X } from "lucide-react";
import { ChatView } from "@/components/ChatView";
import { useUser } from "@clerk/nextjs";
import PushNotificationOptIn from "@/components/PushNotificationOptIn";

interface Conversation {
  id: string;
  student_id: string;
  author_id: string;
  learning_product_id: string;
  created_at: string;
  updated_at: string;
  unread_count: number;
  learning_products: { id: string; title: string; thumbnail: string | null };
}

interface Product { id: string; title: string }
interface Student { student_id: string; full_name: string; email: string; product_id: string; product_title: string }

function NewConversationModal({ products, students, onClose, onCreated }: {
  products: Product[]; students: Student[]; onClose: () => void; onCreated: (c: Conversation) => void;
}) {
  const [selProduct, setSelProduct] = useState("");
  const [selStudent, setSelStudent] = useState("");
  const [busy, setBusy] = useState(false);

  const filteredStudents = students.filter(s => !selProduct || s.product_id === selProduct);

  const go = async () => {
    if (!selProduct || !selStudent || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/author/messages/conversations", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ student_id: selStudent, learning_product_id: selProduct }),
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
          <h2 className="text-lg font-semibold text-gray-900">Message a Student</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Product</label>
            <select value={selProduct} onChange={e => { setSelProduct(e.target.value); setSelStudent(""); }} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
              <option value="">Choose a product...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Student</label>
            <select value={selStudent} onChange={e => setSelStudent(e.target.value)} disabled={!selProduct} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-50">
              <option value="">Choose a student...</option>
              {filteredStudents.map(s => <option key={s.student_id} value={s.student_id}>{s.full_name} ({s.email})</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={go} disabled={!selProduct || !selStudent || busy} className="flex-1 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 disabled:bg-gray-200 disabled:text-gray-400 font-medium text-sm">{busy ? "Starting..." : "Start Conversation"}</button>
            <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthorMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { user } = useUser();

  const loadConvs = useCallback(async () => {
    try {
      const r = await fetch("/api/author/messages/conversations", { credentials: "include" });
      const d = await r.json();
      if (d.success) setConversations(d.conversations || []);
    } catch {} finally { setLoading(false); }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const r = await fetch("/api/author/products", { credentials: "include" });
      const d = await r.json();
      if (d.success) setProducts(d.products || []);
    } catch {}
  }, []);

  const loadStudents = useCallback(async () => {
    try {
      const r = await fetch("/api/author/students", { credentials: "include" });
      const d = await r.json();
      if (d.success) setStudents(d.students || []);
    } catch {}
  }, []);

  useEffect(() => { loadConvs(); loadProducts(); loadStudents(); }, [loadConvs, loadProducts, loadStudents]);

  const filtered = conversations.filter(c =>
    c.learning_products?.title?.toLowerCase().includes(search.toLowerCase())
  );

  // Get student name from student_id
  const getStudentName = (conv: Conversation) => {
    const s = students.find(s => s.student_id === conv.student_id);
    let name = s ? s.full_name : `Student ${conv.student_id.slice(0, 8)}`;
    if (user && conv.student_id === user.id) {
      name += " (You testing)";
    }
    return name;
  };

  if (selected) {
    return (
      <ChatView
        conversationId={selected.id}
        myRole="AUTHOR"
        headerName={getStudentName(selected)}
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
            <p className="text-brand-text/60 text-sm">Communicate with your students</p>
          </div>
          <div className="flex items-center gap-3">
            <PushNotificationOptIn userType="author" />
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 text-sm font-medium shadow-sm">
              <Plus className="w-4 h-4" /> New Message
            </button>
          </div>
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
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(conv => (
              <button key={conv.id} onClick={() => setSelected(conv)} className="w-full p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-700 font-bold text-sm">{getStudentName(conv).charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate text-sm">{getStudentName(conv)}</p>
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
      {showModal && <NewConversationModal products={products} students={students} onClose={() => setShowModal(false)} onCreated={conv => { setShowModal(false); loadConvs(); setSelected(conv); }} />}
    </>
  );
}
