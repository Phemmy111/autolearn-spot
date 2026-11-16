"use client";

import { useState, useEffect } from 'react';
import { 
  Bot, 
  MessageSquare, 
  Search, 
  Download, 
  Sparkles, 
  User, 
  RefreshCw, 
  Filter, 
  Clock, 
  ChevronRight, 
  Copy, 
  Check, 
  FileJson,
  Layers,
  Send
} from 'lucide-react';

interface ConversationItem {
  id: string;
  user_id: string;
  title: string;
  mode: string;
  created_at: string;
  updated_at: string;
  messageCount: number;
  preview: string;
  lastRole: string;
}

interface MessageItem {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?: number;
  model_used?: string;
  created_at: string;
}

export default function AlexMonitorPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    trainingPairsReady: 0
  });
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Load conversations
  const fetchConversations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedMode !== 'all') params.set('mode', selectedMode);

      const res = await fetch(`/api/admin/alex/chats?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (data.stats) setStats(data.stats);
        if (data.conversations?.length > 0 && !selectedConvId) {
          setSelectedConvId(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load Alex chats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [selectedMode]);

  // Load messages when selected conversation changes
  useEffect(() => {
    if (!selectedConvId) return;

    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const res = await fetch(`/api/admin/alex/chats/${selectedConvId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
          setActiveConversation(data.conversation || null);
        }
      } catch (err) {
        console.error('Failed to load conversation details:', err);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [selectedConvId]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJsonl = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/alex/chats?export=jsonl');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alex_training_dataset_${new Date().toISOString().split('T')[0]}.jsonl`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        alert('Failed to generate export file.');
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Error downloading dataset.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Bot className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              ALEX AI Chat Monitor & Training Hub
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Audit student queries, review tutor responses in real-time, and export structured datasets for LLM fine-tuning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchConversations}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportJsonl}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
          >
            <FileJson className="h-4 w-4" />
            {exporting ? 'Generating JSONL...' : 'Export Training (JSONL)'}
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Conversations</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats.totalConversations}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">Learner sessions logged</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <MessageSquare className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Messages Logged</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats.totalMessages}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Prompts & responses</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Training Pairs Ready</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">{stats.trainingPairsReady}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Ready for fine-tune export</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Master-Detail Explorer */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        {/* Left Side: Conversation Threads (5 cols) */}
        <div className="lg:col-span-5 border-r border-slate-200 flex flex-col bg-slate-50/50">
          {/* Search & Filters */}
          <div className="p-3.5 border-b border-slate-200 bg-white space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search messages, titles, user IDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchConversations()}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {['all', 'auto', 'tutor', 'course'].map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMode(m)}
                  className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                    selectedMode === m
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {m === 'all' ? 'All Modes' : m}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[650px]">
            {loading ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                <p className="text-sm">Loading conversations...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">No chats found</p>
                <p className="text-xs text-slate-400 mt-1">No student interactions match this filter.</p>
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = selectedConvId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedConvId(c.id)}
                    className={`p-3.5 cursor-pointer transition-all border-l-4 ${
                      isSelected
                        ? 'bg-emerald-50/60 border-l-emerald-600 shadow-xs'
                        : 'border-l-transparent hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-900 truncate flex-1">
                        {c.title}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400 shrink-0">
                        {new Date(c.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {c.preview || 'No messages yet...'}
                    </p>

                    <div className="flex items-center gap-2 mt-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                        {c.mode}
                      </span>
                      <span className="text-slate-400">
                        {c.messageCount} {c.messageCount === 1 ? 'msg' : 'msgs'}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400 font-mono text-[10px] truncate max-w-[120px]">
                        {c.user_id?.startsWith('user_') ? c.user_id.slice(0, 12) + '...' : c.user_id}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Message Transcript (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-white">
          {selectedConvId ? (
            <>
              {/* Transcript Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/40">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {activeConversation?.title || 'Conversation Transcript'}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span className="font-mono text-[11px]">ID: {selectedConvId}</span>
                    <span>•</span>
                    <span className="capitalize font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Mode: {activeConversation?.mode || 'auto'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(JSON.stringify(messages, null, 2), selectedConvId)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                    title="Copy full transcript JSON"
                  >
                    {copiedId === selectedConvId ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Message Transcript Stream */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[600px]">
                {messagesLoading ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                    <p className="text-sm">Loading message transcript...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">No messages recorded for this session.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isUser = m.role === 'user';
                    return (
                      <div
                        key={m.id}
                        className={`flex gap-3 ${isUser ? 'flex-row' : 'flex-row'}`}
                      >
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                            isUser
                              ? 'bg-blue-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                              {isUser ? 'Learner / User' : 'ALEX AI Tutor'}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              {m.model_used && (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600">
                                  {m.model_used}
                                </span>
                              )}
                              <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>

                          <div
                            className={`p-3.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                              isUser
                                ? 'bg-blue-50/70 border border-blue-100 text-slate-900 font-medium'
                                : 'bg-slate-50 border border-slate-200/80 text-slate-800'
                            }`}
                          >
                            {m.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
              <Bot className="h-12 w-12 text-slate-300 mb-3" />
              <h4 className="text-base font-semibold text-slate-700">No Chat Selected</h4>
              <p className="text-xs text-slate-500 max-w-sm text-center mt-1">
                Select a conversation from the left column to view its student queries and model responses.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
