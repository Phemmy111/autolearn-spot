"use client";
/**
 * Shared Chat Component for AutoLearn Spot
 * Used by both author/messages and student/messages pages
 */
import {
  useState, useEffect, useRef, useCallback, ChangeEvent, KeyboardEvent
} from "react";
import {
  ArrowLeft, Send, Paperclip, Mic, Play, Pause,
  StopCircle, Download, X, FileText, Check, CheckCheck
} from "lucide-react";

interface Message {
  id: string;
  sender_role: "STUDENT" | "AUTHOR";
  message_type: "TEXT" | "IMAGE" | "VOICE";
  body: string | null;
  created_at: string;
  delivery_status: "PENDING" | "DELIVERED" | "FAILED";
  read_status: "UNREAD" | "READ";
  delivered_at: string | null;
  read_at: string | null;
  author_message_attachments: {
    id: string; storage_path: string; file_name: string;
    mime_type: string; file_size: number; duration_seconds?: number | null;
  }[];
}

interface PendingAttachment {
  file: File;
  previewUrl: string;
  uploading: boolean;
  uploaded?: { publicUrl: string };
  error?: string;
}

async function uploadAttachment(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload/message-attachment", { method: "POST", body: form });
  if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Upload failed"); }
  const d = await res.json();
  return d.publicUrl as string;
}

// Voice Player
function VoicePlayer({ url, isMe }: { url: string; isMe: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(url);
    audio.onloadedmetadata = () => setDuration(audio.duration || 0);
    audio.ontimeupdate = () => setProgress((audio.currentTime / (audio.duration || 1)) * 100);
    audio.onended = () => { setPlaying(false); setProgress(0); };
    audioRef.current = audio;
    return () => { audio.pause(); audio.src = ""; };
  }, [url]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className={`flex items-center gap-2 min-w-[180px] ${isMe ? "text-white" : "text-gray-700"}`}>
      <button onClick={toggle} className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isMe ? "bg-white/20 hover:bg-white/30" : "bg-sky-100 hover:bg-sky-200"}`}>
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      <div className="flex-1">
        <div className={`h-1 rounded-full ${isMe ? "bg-white/20" : "bg-gray-200"}`}>
          <div className={`h-1 rounded-full transition-all ${isMe ? "bg-white" : "bg-sky-500"}`} style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[10px] mt-0.5 block opacity-70">{fmt(duration)}</span>
      </div>
    </div>
  );
}

// Message Bubble
function MessageBubble({ message, isMe, partnerName }: { message: Message; isMe: boolean; partnerName?: string }) {
  const atts = message.author_message_attachments || [];
  const displayName = isMe ? "You" : (partnerName || "");

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}>
      <div className="flex flex-col max-w-[70%]">
        <p className={`text-xs mb-0.5 ${isMe ? "text-right text-gray-500" : "text-gray-500"}`}>{displayName}</p>
        <div className={`rounded-2xl px-3 py-2 shadow-sm ${isMe ? "bg-sky-600 text-white rounded-tr-sm" : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"}`}>
          {atts.map((att) => {
            const isImage = att.mime_type?.startsWith("image/");
            const isAudio = att.mime_type?.startsWith("audio/");
            if (isImage) return (
              <a key={att.id} href={att.storage_path} target="_blank" rel="noopener noreferrer" className="block mb-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={att.storage_path} alt={att.file_name} className="rounded-xl max-h-52 max-w-full object-cover" />
              </a>
            );
            if (isAudio) return <div key={att.id} className="mb-1"><VoicePlayer url={att.storage_path} isMe={isMe} /></div>;
            return (
              <a key={att.id} href={att.storage_path} target="_blank" rel="noopener noreferrer"
                 className={`flex items-center gap-2 mb-1 p-2 rounded-lg text-xs ${isMe ? "bg-white/10 hover:bg-white/20" : "bg-gray-50 hover:bg-gray-100"}`}>
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{att.file_name}</span>
                <Download className="w-3 h-3 flex-shrink-0 opacity-60" />
              </a>
            );
          })}
          {message.body && <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>}
          <div className={`flex items-center gap-1 mt-0.5 ${isMe ? "justify-end" : ""}`}>
            <p className={`text-[10px] ${isMe ? "text-white/60" : "text-gray-400"}`}>
              {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
            {isMe && (
              <div className="flex items-center">
                {message.read_status === 'READ' ? (
                  <CheckCheck className="w-3 h-3 text-white/80" />
                ) : message.delivery_status === 'DELIVERED' ? (
                  <Check className="w-3 h-3 text-white/60" />
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Pending Attachment Preview
function PendingPreview({ att, onRemove }: { att: PendingAttachment; onRemove: () => void }) {
  const isImage = att.file.type.startsWith("image/");
  const isAudio = att.file.type.startsWith("audio/");
  return (
    <div className="relative inline-flex items-center gap-2 bg-gray-100 rounded-lg p-2 max-w-[200px]">
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={att.previewUrl} alt={att.file.name} className="h-14 w-14 object-cover rounded-lg flex-shrink-0" />
      ) : isAudio ? (
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Mic className="w-5 h-5 text-sky-500" />
          <span>Voice note</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <FileText className="w-5 h-5 text-sky-500 flex-shrink-0" />
          <span className="truncate max-w-[120px]">{att.file.name}</span>
        </div>
      )}
      {att.uploading && <span className="absolute inset-0 bg-white/60 flex items-center justify-center text-xs rounded-lg">Uploading...</span>}
      {att.error && <span className="absolute inset-0 bg-red-50/80 flex items-center justify-center text-xs text-red-600 rounded-lg">Failed</span>}
      <button onClick={onRemove} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-500 text-white rounded-full flex items-center justify-center">
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

// Message Input
function MessageInput({ conversationId, onSent, myRole }: { conversationId: string; onSent: () => void; myRole: string }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = (text.trim().length > 0 || pendingAttachments.length > 0) && !sending && !recording;

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newAtts: PendingAttachment[] = Array.from(files).map(f => ({
      file: f, previewUrl: URL.createObjectURL(f), uploading: true
    }));
    setPendingAttachments(prev => [...prev, ...newAtts]);
    for (let i = 0; i < newAtts.length; i++) {
      const att = newAtts[i];
      try {
        const publicUrl = await uploadAttachment(att.file);
        setPendingAttachments(prev => prev.map(a => a.previewUrl === att.previewUrl ? { ...a, uploading: false, uploaded: { publicUrl } } : a));
      } catch {
        setPendingAttachments(prev => prev.map(a => a.previewUrl === att.previewUrl ? { ...a, uploading: false, error: "Failed" } : a));
      }
    }
  };

  const removeAttachment = (previewUrl: string) => {
    setPendingAttachments(prev => {
      const a = prev.find(a => a.previewUrl === previewUrl);
      if (a) URL.revokeObjectURL(a.previewUrl);
      return prev.filter(a => a.previewUrl !== previewUrl);
    });
  };

  const doSend = async () => {
    if (!canSend) return;
    const failedAtts = pendingAttachments.filter(a => a.error);
    if (failedAtts.length > 0) { alert("Some attachments failed to upload. Remove them before sending."); return; }
    const stillUploading = pendingAttachments.filter(a => a.uploading);
    if (stillUploading.length > 0) { alert("Please wait for uploads to finish."); return; }
    const readyAtts = pendingAttachments.filter(a => a.uploaded);
    setSending(true);
    try {
      const attachments = readyAtts.map(a => ({
        storage_path: a.uploaded!.publicUrl,
        file_name: a.file.name,
        mime_type: a.file.type,
        file_size: a.file.size,
      }));
      let msgType = "TEXT";
      if (attachments.length > 0) {
        const firstMime = readyAtts[0].file.type;
        if (firstMime.startsWith("image/")) msgType = "IMAGE";
        else if (firstMime.startsWith("audio/")) msgType = "VOICE";
        else msgType = "IMAGE";
      }
      const res = await fetch(`/api/author/messages/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_type: msgType, body: text.trim() || null, attachments, sender_role: myRole }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || "Failed to send");
      setText("");
      pendingAttachments.forEach(a => URL.revokeObjectURL(a.previewUrl));
      setPendingAttachments([]);
      onSent();
    } catch (e) { alert((e as Error).message); }
    finally { setSending(false); }
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 120) + "px"; }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (window.innerWidth >= 768) {
        e.preventDefault();
        doSend();
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr; chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start();
      setRecording(true); setPaused(false); setRecTime(0);
      timerRef.current = setInterval(() => setRecTime(t => t + 1), 1000);
    } catch (err: any) { alert("Microphone access denied or error: " + err.message); }
  };

  const pauseRecording = () => {
    if (!mediaRef.current) return;
    if (mediaRef.current.state === "recording") {
      mediaRef.current.pause(); setPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    } else if (mediaRef.current.state === "paused") {
      mediaRef.current.resume(); setPaused(false);
      timerRef.current = setInterval(() => setRecTime(t => t + 1), 1000);
    }
  };

  const stopRecording = () => {
    if (!mediaRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const mr = mediaRef.current;
    mr.onstop = async () => {
      const mime = mr.mimeType || "audio/webm";
      const ext = mime.includes("mp4") ? "mp4" : mime.includes("ogg") ? "ogg" : "webm";
      const blob = new Blob(chunksRef.current, { type: mime });
      const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: mime });
      const previewUrl = URL.createObjectURL(blob);
      const att: PendingAttachment = { file, previewUrl, uploading: true };
      setPendingAttachments(prev => [...prev, att]);
      try {
        const publicUrl = await uploadAttachment(file);
        setPendingAttachments(prev => prev.map(a => a.previewUrl === previewUrl ? { ...a, uploading: false, uploaded: { publicUrl } } : a));
      } catch {
        setPendingAttachments(prev => prev.map(a => a.previewUrl === previewUrl ? { ...a, uploading: false, error: "Failed" } : a));
      }
    };
    mr.stop();
    mr.stream.getTracks().forEach(t => t.stop());
    setRecording(false); setPaused(false); setRecTime(0);
  };

  const cancelRecording = () => {
    if (!mediaRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRef.current.stop();
    mediaRef.current.stream.getTracks().forEach(t => t.stop());
    chunksRef.current = [];
    setRecording(false); setPaused(false); setRecTime(0);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="border-t border-gray-200 bg-white">
      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3">
          {pendingAttachments.map(att => (
            <PendingPreview key={att.previewUrl} att={att} onRemove={() => removeAttachment(att.previewUrl)} />
          ))}
        </div>
      )}
      {recording && (
        <div className="flex items-center gap-3 px-4 pt-3">
          <span className={`w-2 h-2 rounded-full ${paused ? "bg-yellow-400" : "bg-red-500 animate-pulse"}`} />
          <span className="text-sm font-medium text-gray-700">{paused ? "Paused" : "Recording"} &mdash; {fmt(recTime)}</span>
          <button onClick={pauseRecording} className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1 font-medium">
            {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {paused ? "Resume" : "Pause"}
          </button>
          <button onClick={stopRecording} className="text-xs px-2 py-1 bg-sky-600 text-white hover:bg-sky-700 rounded-lg flex items-center gap-1 font-medium">
            <StopCircle className="w-3 h-3" /> Stop &amp; Add
          </button>
          <button onClick={cancelRecording} className="text-xs px-2 py-1 text-red-500 hover:text-red-700 rounded-lg flex items-center gap-1">
            <X className="w-3 h-3" /> Cancel
          </button>
        </div>
      )}
      <div className="flex items-end gap-2 px-4 py-3">
        <input ref={fileRef} type="file" multiple
               accept="image/*,application/pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
               className="hidden" onChange={e => addFiles(e.target.files)} />
        <button onClick={() => fileRef.current?.click()} disabled={sending}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-sky-600 transition-colors disabled:opacity-40 rounded-full hover:bg-sky-50">
          <Paperclip className="w-5 h-5" />
        </button>
        <button onClick={recording ? undefined : startRecording} disabled={sending}
                className={`flex-shrink-0 p-2 transition-colors disabled:opacity-40 rounded-full ${recording ? "text-red-500 bg-red-50" : "text-gray-400 hover:text-sky-600 hover:bg-sky-50"}`}>
          <Mic className="w-5 h-5" />
        </button>
        <textarea ref={textareaRef} rows={1} placeholder="Type a message..."
                  value={text} onChange={handleTextChange} onKeyDown={handleKeyDown}
                  disabled={sending}
                  className="flex-1 px-4 py-2 bg-gray-100 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm text-gray-800 placeholder:text-gray-400 leading-relaxed"
                  style={{ minHeight: "40px", maxHeight: "120px" }} />
        <button onClick={doSend} disabled={!canSend}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-sky-600 text-white rounded-full hover:bg-sky-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors shadow-sm">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Chat View
export function ChatView({
  conversationId, myRole, headerName, headerSub, onBack
}: {
  conversationId: string;
  myRole: "STUDENT" | "AUTHOR";
  headerName: string;
  headerSub: string;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const apiUrl = myRole === 'AUTHOR'
        ? `/api/author/messages/conversations/${conversationId}/messages`
        : `/api/author/messages/conversations/${conversationId}/messages`; // Students use same endpoint for now
      const res = await fetch(apiUrl);
      const d = await res.json();
      if (d.success) setMessages(d.messages || []);

      // Mark unread messages as read
      const unreadMessages = (d.messages || []).filter((m: Message) =>
        m.sender_role !== myRole && m.read_status === 'UNREAD'
      );

      for (const msg of unreadMessages) {
        const readApiUrl = myRole === 'AUTHOR'
          ? `/api/author/messages/conversations/${conversationId}/messages/${msg.id}/read`
          : `/api/student/messages/conversations/${conversationId}/messages/${msg.id}/read`;
        await fetch(readApiUrl, {
          method: 'POST',
        });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [conversationId, myRole]);

  useEffect(() => {
    fetchMessages();
    const iv = setInterval(fetchMessages, 4000);
    return () => clearInterval(iv);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 z-10 md:left-64">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-sky-600 hover:text-sky-700 font-medium text-sm flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sky-700 font-bold text-sm">{headerName.charAt(0).toUpperCase()}</span>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate text-sm">{headerName}</p>
          <p className="text-xs text-gray-500 truncate">{headerSub}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3">&#x1F4AC;</div>
            <p className="text-gray-500 text-sm">No messages yet.</p>
            <p className="text-gray-400 text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map(m => <MessageBubble key={m.id} message={m} isMe={m.sender_role === myRole} partnerName={headerName} />)}
            <div ref={bottomRef} />
          </>
        )}
      </div>
      <div className="flex-shrink-0">
        <MessageInput conversationId={conversationId} onSent={fetchMessages} myRole={myRole} />
      </div>
    </div>
  );
}
