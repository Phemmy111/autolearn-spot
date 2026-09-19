"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare, Search, Plus, ArrowLeft, Clock, X,
  Send, Paperclip, Mic, Play, Pause, StopCircle, Download
} from "lucide-react";

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

interface EnrolledCourse {
  id: string;
  title: string;
  author_id: string;
  author_name: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: "STUDENT" | "AUTHOR";
  message_type: "TEXT" | "IMAGE" | "FILE" | "VOICE";
  body: string | null;
  created_at: string;
  author_message_attachments: Attachment[];
}

interface Attachment {
  id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  duration_seconds?: number | null;
}

async function uploadAttachment(file: File): Promise<{ publicUrl: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload/message-attachment", { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

function ConversationCard({ conversation, onClick }: { conversation: Conversation; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-[var(--card)] border border-brand-border rounded-lg hover:shadow-md transition-shadow text-left"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-brand-text truncate">{conversation.authors.display_name}</h3>
            {conversation.unread_count > 0 && (
              <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-medium rounded-full">
                {conversation.unread_count}
              </span>
            )}
          </div>
          <p className="text-sm text-brand-text/70 truncate">{conversation.learning_products.title}</p>
          <div className="flex items-center gap-1 text-xs text-brand-text/50 mt-1">
            <Clock className="w-3 h-3" />
            <span>Last updated {new Date(conversation.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isStudent = message.sender_role === "STUDENT";
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleAudio = (url: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  return (
    <div className={`flex ${isStudent ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-xs sm:max-w-md px-4 py-2 rounded-2xl ${isStudent ? "bg-sky-600 text-white rounded-br-sm" : "bg-gray-100 text-brand-text rounded-bl-sm"}`}>
        {message.body && <p className="text-sm whitespace-pre-wrap">{message.body}</p>}
        {message.author_message_attachments?.map((att) => {
          const isImage = att.mime_type?.startsWith("image/");
          const isVoice = att.mime_type?.startsWith("audio/");
          if (isImage) return (
            <a key={att.id} href={att.storage_path} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={att.storage_path} alt={att.file_name} className="mt-2 rounded-lg max-w-full max-h-64 object-cover" />
            </a>
          );
          if (isVoice) return (
            <div key={att.id} className="flex items-center gap-2 mt-2">
              <button onClick={() => toggleAudio(att.storage_path)} className={`p-2 rounded-full ${isStudent ? "bg-white/20" : "bg-sky-100"}`}>
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <div className="flex-1 h-1 bg-white/30 rounded-full" />
              {att.duration_seconds && <span className="text-xs opacity-70">{Math.round(att.duration_seconds)}s</span>}
            </div>
          );
          return (
            <a key={att.id} href={att.storage_path} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-2 text-xs underline opacity-80">
              <Download className="w-3 h-3" />{att.file_name}
            </a>
          );
        })}
        <p className="text-xs mt-1 opacity-60 text-right">
          {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

function MessageInput({ conversationId, onSent }: { conversationId: string; onSent: () => void }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const send = useCallback(async (
    type: string, body: string | null,
    attachments?: { storage_path: string; file_name: string; mime_type: string; file_size: number; duration_seconds?: number }[]
  ) => {
    setSending(true);
    try {
      const res = await fetch(`/api/author/messages/conversations/${conversationId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_type: type, body, attachments }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || "Failed to send");
      onSent();
    } catch (e) { alert((e as Error).message); }
    finally { setSending(false); }
  }, [conversationId, onSent]);

  const handleText = async () => {
    if (!text.trim() || sending) return;
    const t = text.trim(); setText(""); await send("TEXT", t);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setSending(true);
    try {
      const { publicUrl } = await uploadAttachment(file);
      await send(file.type.startsWith("image/") ? "IMAGE" : "FILE", null, [{ storage_path: publicUrl, file_name: file.name, mime_type: file.type, file_size: file.size }]);
    } catch { alert("Upload failed"); setSending(false); }
    e.target.value = "";
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr; chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.start(); setRecording(true); setRecTime(0);
      timerRef.current = setInterval(() => setRecTime(t => t + 1), 1000);
    } catch { alert("Microphone access denied"); }
  };

  const stopRec = async () => {
    if (!mediaRef.current) return;
    const dur = recTime; setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
      setSending(true);
      try {
        const { publicUrl } = await uploadAttachment(file);
        await send("VOICE", null, [{ storage_path: publicUrl, file_name: file.name, mime_type: "audio/webm", file_size: blob.size, duration_seconds: dur }]);
      } catch { alert("Upload failed"); setSending(false); }
    };
    mediaRef.current.stop();
    mediaRef.current.stream.getTracks().forEach(t => t.stop());
  };

  return (
    <div className="border-t border-brand-border pt-3">
      {recording && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-red-50 rounded-lg text-red-600 text-sm">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Recording... {recTime}s
          <button onClick={stopRec} className="ml-auto flex items-center gap-1 font-medium">
            <StopCircle className="w-4 h-4" /> Stop & Send
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <input ref={fileRef} type="file" accept="image/*,application/pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx" className="hidden" onChange={handleFile} />
        <button onClick={() => fileRef.current?.click()} disabled={sending || recording} className="p-2 text-brand-text/50 hover:text-sky-600 transition-colors disabled:opacity-40" title="Attach file">
          <Paperclip className="w-5 h-5" />
        </button>
        <button onClick={recording ? stopRec : startRec} disabled={sending} className={`p-2 transition-colors disabled:opacity-40 ${recording ? "text-red-500" : "text-brand-text/50 hover:text-sky-600"}`} title={recording ? "Stop" : "Voice note"}>
          <Mic className="w-5 h-5" />
        </button>
        <textarea
          rows={1} placeholder="Type your message..." value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleText(); } }}
          disabled={recording}
          className="flex-1 px-4 py-2 border border-brand-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none text-sm"
          style={{ maxHeight: "120px" }}
        />
        <button onClick={handleText} disabled={!text.trim() || sending || recording} className="p-2 bg-sky-600 text-white rounded-full hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function MessageView({ conversation, onBack }: { conversation: Conversation; onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/author/messages/conversations/${conversation.id}/messages`);
      const d = await res.json();
      if (d.success) setMessages(d.messages || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [conversation.id]);

  useEffect(() => {
    fetchMessages();
    const iv = setInterval(fetchMessages, 5000);
    return () => clearInterval(iv);
  }, [fetchMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 160px)", minHeight: "400px" }}>
      <div className="flex items-center gap-3 pb-3 border-b border-brand-border">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sky-600 hover:text-sky-700 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-brand-text truncate">{conversation.authors.display_name}</p>
          <p className="text-xs text-brand-text/60 truncate">{conversation.learning_products.title}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {loading ? (
          <div className="text-center text-brand-text/50 py-8">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-brand-text/50 py-8">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
        <div ref={bottomRef} />
      </div>
      <MessageInput conversationId={conversation.id} onSent={fetchMessages} />
    </div>
  );
}

function NewMessageModal({ enrolledCourses, onClose, onCreated }: { enrolledCourses: EnrolledCourse[]; onClose: () => void; onCreated: (c: Conversation) => void }) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!selectedCourse || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/student/messages/conversations", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ learning_product_id: selectedCourse }),
      });
      const d = await res.json();
      if (d.success) onCreated(d.conversation);
      else alert(d.error || "Failed to create conversation");
    } catch { alert("Network error. Please try again."); }
    finally { setCreating(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[var(--card)] border border-brand-border rounded-xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-brand-text">Start New Conversation</h2>
          <button onClick={onClose} className="text-brand-text/60 hover:text-brand-text"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-text mb-2">Select Course</label>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="w-full px-3 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-[var(--card)] text-brand-text">
              <option value="">Choose a course...</option>
              {enrolledCourses.length === 0 ? <option disabled>No enrolled courses found</option> : enrolledCourses.map((c) => <option key={c.id} value={c.id}>{c.title} — {c.author_name}</option>)}
            </select>
            {enrolledCourses.length === 0 && <p className="text-xs text-brand-text/50 mt-1">You need to be enrolled in a course first.</p>}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleCreate} disabled={!selectedCourse || creating} className="flex-1 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-sm">
              {creating ? "Starting..." : "Start Conversation"}
            </button>
            <button onClick={onClose} className="px-4 py-2 border border-brand-border rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/student/messages/conversations", { credentials: "include" });
      const d = await res.json();
      if (d.success) setConversations(d.conversations || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchEnrolledCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/student/enrolled-courses", { credentials: "include" });
      const d = await res.json();
      if (d.success) setEnrolledCourses(d.courses || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchConversations(); fetchEnrolledCourses(); }, [fetchConversations, fetchEnrolledCourses]);

  const filtered = conversations.filter((c) =>
    c.learning_products?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.authors?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConvCreated = (conv: Conversation) => {
    setShowNewMessageModal(false);
    fetchConversations();
    setSelectedConversation(conv);
  };

  if (selectedConversation) {
    return (
      <>
        <MessageView conversation={selectedConversation} onBack={() => setSelectedConversation(null)} />
        {showNewMessageModal && <NewMessageModal enrolledCourses={enrolledCourses} onClose={() => setShowNewMessageModal(false)} onCreated={handleConvCreated} />}
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-text mb-1">Messages</h1>
            <p className="text-brand-text/70 text-sm">Communicate with your course instructors</p>
          </div>
          <button type="button" onClick={() => setShowNewMessageModal(true)} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> New Message
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/50" />
          <input type="text" placeholder="Search conversations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="text-brand-text/50">Loading conversations...</div></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="w-12 h-12 text-neutral-300 mb-3" />
            <p className="text-brand-text/70 text-sm">{searchQuery ? "No conversations match your search" : "No conversations yet"}</p>
            <p className="text-brand-text/50 text-xs mt-1">Start a conversation with your course instructor</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((conv) => <ConversationCard key={conv.id} conversation={conv} onClick={() => setSelectedConversation(conv)} />)}
          </div>
        )}
      </div>
      {showNewMessageModal && <NewMessageModal enrolledCourses={enrolledCourses} onClose={() => setShowNewMessageModal(false)} onCreated={handleConvCreated} />}
    </>
  );
}
