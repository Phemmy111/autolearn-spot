"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  MessageSquare, 
  Search, 
  Sparkles, 
  User, 
  RefreshCw, 
  Clock, 
  Copy, 
  Check, 
  FileJson,
  Layers,
  Send,
  Sliders,
  Play,
  Save,
  BookOpen,
  DollarSign,
  Award,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Info
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

interface LiveCourse {
  id: string;
  title: string;
  slug: string;
  price: number;
  description: string;
}

interface ActiveProvider {
  id: string;
  provider_name: string;
  display_name: string;
  provider_type: string;
  current_model: string;
  is_active: boolean;
  priority: number;
  health_status: string;
}

export default function AlexMonitorPage() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'training' | 'playground'>('monitor');

  // Monitor State
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

  // Training Hub State
  const [systemPrompt, setSystemPrompt] = useState('');
  const [customKnowledge, setCustomKnowledge] = useState('');
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([]);
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');
  const [liveCourses, setLiveCourses] = useState<LiveCourse[]>([]);
  const [activeProviders, setActiveProviders] = useState<ActiveProvider[]>([]);
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [trainingSaving, setTrainingSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Playground State
  const [testInput, setTestInput] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testConversation, setTestConversation] = useState<Array<{ role: 'user' | 'assistant'; content: string; metrics?: any }>>([
    {
      role: 'assistant',
      content: 'Hello! I am ALEX with live platform training. Ask me any question about our courses, pricing, affiliate perks, or how to become an author.',
    }
  ]);
  const playgroundEndRef = useRef<HTMLDivElement>(null);

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

  // Load Training Settings
  const fetchTraining = async () => {
    setTrainingLoading(true);
    try {
      const res = await fetch('/api/admin/alex/training');
      if (res.ok) {
        const data = await res.json();
        if (data.training) {
          setSystemPrompt(data.training.systemPrompt || '');
          setCustomKnowledge(data.training.customKnowledge || '');
          setFaqs(data.training.faqs || []);
        }
        if (data.liveCourses) setLiveCourses(data.liveCourses);
        if (data.activeProviders) setActiveProviders(data.activeProviders);
      }
    } catch (err) {
      console.error('Failed to load training info:', err);
    } finally {
      setTrainingLoading(false);
    }
  };

  useEffect(() => {
    fetchTraining();
  }, []);

  const handleSaveTraining = async () => {
    setTrainingSaving(true);
    setSaveSuccessMessage(null);
    try {
      const res = await fetch('/api/admin/alex/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          customKnowledge,
          faqs,
        }),
      });

      if (res.ok) {
        setSaveSuccessMessage('Alex training instructions and platform knowledge updated successfully!');
        setTimeout(() => setSaveSuccessMessage(null), 4000);
      } else {
        alert('Failed to save training configuration');
      }
    } catch (err) {
      console.error('Save training error:', err);
      alert('Error updating Alex training.');
    } finally {
      setTrainingSaving(false);
    }
  };

  const handleAddFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    setFaqs([...faqs, { question: newFaqQ.trim(), answer: newFaqA.trim() }]);
    setNewFaqQ('');
    setNewFaqA('');
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  // Playground Send
  const handlePlaygroundSend = async () => {
    if (!testInput.trim() || testLoading) return;
    const userText = testInput.trim();
    const updatedHistory = [...testConversation, { role: 'user' as const, content: userText }];
    setTestConversation(updatedHistory);
    setTestInput('');
    setTestLoading(true);

    try {
      const res = await fetch('/api/admin/alex/training', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testPrompt: systemPrompt,
          testKnowledge: customKnowledge,
          userMessage: userText,
          conversationHistory: updatedHistory.slice(-6),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTestConversation((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.reply || 'No response generated.',
            metrics: data.metrics,
          },
        ]);
      } else {
        setTestConversation((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Error: Failed to generate response from test endpoint.',
          },
        ]);
      }
    } catch (err) {
      console.error('Playground test error:', err);
    } finally {
      setTestLoading(false);
      setTimeout(() => playgroundEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

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
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Bot className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              ALEX AI Operations & Training Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Obey-Grade AI
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Audit live conversations in real-time, configure dynamic knowledge & prompts, and test Alex's conversational persuasion.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === 'monitor' && (
            <>
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
                {exporting ? 'Exporting...' : 'Export JSONL'}
              </button>
            </>
          )}

          {activeTab === 'training' && (
            <button
              onClick={handleSaveTraining}
              disabled={trainingSaving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <Save className="h-4 w-4" />
              {trainingSaving ? 'Saving...' : 'Save Training Rules'}
            </button>
          )}
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'monitor'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Live Chat Monitor
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700">
            {stats.totalConversations}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('training')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'training'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="h-4 w-4" />
          Train Alex & Knowledge Studio
        </button>

        <button
          onClick={() => setActiveTab('playground')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'playground'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Play className="h-4 w-4" />
          Testing Playground
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-100 text-cyan-800 font-bold">
            Live Test
          </span>
        </button>
      </div>

      {saveSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium">{saveSuccessMessage}</p>
        </div>
      )}

      {/* TAB 1: LIVE CHAT MONITOR */}
      {activeTab === 'monitor' && (
        <div className="space-y-6">
          {/* KPI Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Conversations</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats.totalConversations}</p>
                <p className="text-xs text-emerald-600 font-medium mt-1">Visitors & student sessions</p>
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
                <p className="text-xs text-slate-500 font-medium mt-1">Exportable for fine-tuning</p>
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
                    placeholder="Search messages, titles, visitor IDs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchConversations()}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {[
                    { key: 'all', label: 'All Modes' },
                    { key: 'customer_service', label: 'Customer Support' },
                    { key: 'tutor', label: 'Student Tutor' },
                    { key: 'auto', label: 'Auto' },
                  ].map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setSelectedMode(m.key)}
                      className={`px-2.5 py-1 rounded-md font-medium capitalize whitespace-nowrap transition-colors ${
                        selectedMode === m.key
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[580px]">
                {loading ? (
                  <div className="p-8 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Loading conversation logs...
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <MessageSquare className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No conversations found</p>
                    <p className="text-xs text-slate-400 mt-1">Try another search or mode filter.</p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const isSelected = conv.id === selectedConvId;
                    const isCustomerService = conv.mode === 'customer_service';
                    return (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConvId(conv.id)}
                        className={`p-3.5 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-50/70 border-l-4 border-emerald-600'
                            : 'hover:bg-slate-100/60'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span
                            className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase ${
                              isCustomerService
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isCustomerService ? 'Support / Concierge' : conv.mode || 'Tutor'}
                          </span>
                          <span className="text-slate-400 text-[11px] flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(conv.updated_at || conv.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="font-bold text-slate-900 text-sm truncate">
                          {conv.title || 'Conversation'}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {conv.preview || 'No messages yet.'}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
                          <span className="truncate max-w-[140px]">
                            {conv.user_id?.startsWith('visitor_') ? 'Visitor Lead' : conv.user_id || 'Anonymous'}
                          </span>
                          <span className="font-sans font-semibold text-slate-600">
                            {conv.messageCount || 0} msgs
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Side: Message Transcript Detail (7 cols) */}
            <div className="lg:col-span-7 flex flex-col bg-white">
              {selectedConvId ? (
                <>
                  {/* Active Header */}
                  <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {activeConversation?.title || 'Selected Thread'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 uppercase">
                          {activeConversation?.mode || 'General'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        ID: {selectedConvId}
                      </p>
                    </div>

                    <button
                      onClick={() => handleCopy(selectedConvId, selectedConvId)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
                      title="Copy Thread ID"
                    >
                      {copiedId === selectedConvId ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Messages Bubble Area */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[520px] bg-slate-50/20">
                    {messagesLoading ? (
                      <div className="py-12 text-center text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                        Loading conversation history...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        No messages recorded in this conversation.
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isUser = m.role === 'user';
                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400 font-medium">
                              {isUser ? (
                                <>
                                  <span>User / Learner</span>
                                  <User className="h-3 w-3" />
                                </>
                              ) : (
                                <>
                                  <Bot className="h-3.5 w-3.5 text-emerald-600" />
                                  <span className="text-emerald-700 font-semibold">Alex AI</span>
                                  {m.model_used && (
                                    <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] font-mono text-slate-600">
                                      {m.model_used}
                                    </span>
                                  )}
                                </>
                              )}
                              <span>•</span>
                              <span>
                                {new Date(m.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </span>
                            </div>

                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-2xs ${
                                isUser
                                  ? 'bg-emerald-600 text-white rounded-tr-none'
                                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{m.content}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
                  <Bot className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">Select a conversation thread</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Click any conversation on the left to inspect its multi-turn transcript and model details.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRAIN ALEX & KNOWLEDGE STUDIO */}
      {activeTab === 'training' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Persona & System Instructions (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    Alex Personality & Persuasive Guidelines
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define his tone, closing psychology, objection handling, and strict 2-3 sentence limit.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  System Prompt & Persona
                </label>
                <textarea
                  rows={8}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
                  placeholder="Define Alex's system prompt..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Custom Platform Knowledge & Objections
                </label>
                <textarea
                  rows={7}
                  value={customKnowledge}
                  onChange={(e) => setCustomKnowledge(e.target.value)}
                  className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
                  placeholder="Add custom facts, money-back guarantee, founder WhatsApp link, commission rates..."
                />
              </div>
            </div>

            {/* FAQs Builder */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Instant FAQ Quick-Packs</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Common questions and their exact golden answers.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="User Question (e.g. Is the certificate recognized?)"
                    value={newFaqQ}
                    onChange={(e) => setNewFaqQ(e.target.value)}
                    className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Concise 2-Sentence Answer"
                    value={newFaqA}
                    onChange={(e) => setNewFaqA(e.target.value)}
                    className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddFaq}
                  disabled={!newFaqQ.trim() || !newFaqA.trim()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white rounded-lg text-xs font-semibold"
                >
                  + Add FAQ Rule
                </button>

                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {faqs.map((faq, i) => (
                    <div key={i} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-slate-900">Q: {faq.question}</p>
                        <p className="text-slate-600 mt-0.5">A: {faq.answer}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveFaq(i)}
                        className="text-rose-500 hover:text-rose-700 font-bold px-1.5 py-0.5 rounded"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live Dynamic Catalog Sync Status (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                    Live Catalog Auto-Sync
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Alex dynamically pulls these live published courses from the database.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {liveCourses.length} Active
                </span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {liveCourses.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 truncate max-w-[200px]">
                        {c.title}
                      </p>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
                        ₦{c.price.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-500 line-clamp-2">{c.description}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      /marketplace/{c.slug}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Active AI Providers Health */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Active AI Engine Stack</h3>
                <span className="text-xs text-slate-400">Multi-Provider Chain</span>
              </div>

              <div className="space-y-2">
                {activeProviders.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{p.display_name || p.provider_name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{p.current_model}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        Priority {p.priority}
                      </span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TESTING PLAYGROUND */}
      {activeTab === 'playground' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col min-h-[600px]">
          {/* Playground Top Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Play className="h-4 w-4 text-emerald-600" />
                Live Conversational Playground
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Test prompts and verify that Alex replies dynamically in 2-3 sentences with high conversion power.
              </p>
            </div>

            <button
              onClick={() =>
                setTestConversation([
                  {
                    role: 'assistant',
                    content:
                      'Hello! I am ALEX with live platform training. Ask me any question about our courses, pricing, affiliate perks, or how to become an author.',
                  },
                ])
              }
              className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
            >
              Reset Chat
            </button>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[520px] bg-slate-50/20">
            {testConversation.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400 font-medium">
                    {isUser ? 'Admin Prompt' : 'Alex Response'}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {msg.metrics && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                        <span>Latency: {msg.metrics.latencyMs}ms</span>
                        <span>•</span>
                        <span>Model: {msg.metrics.modelUsed}</span>
                        <span>•</span>
                        <span>Sentences: {msg.metrics.sentenceCount}</span>
                        <span>•</span>
                        <span>Words: {msg.metrics.wordCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={playgroundEndRef} />
          </div>

          {/* Quick Test Prompt Suggestions */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-slate-400 font-medium shrink-0">Try test:</span>
            {[
              'Tell me about the courses available and the ₦3,000 promo',
              'Is the certificate verified and recognized?',
              'How much can I earn as an affiliate partner?',
              'Why should I buy this instead of YouTube?',
            ].map((promptText, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTestInput(promptText)}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:border-emerald-500 rounded-full text-slate-600 shrink-0 text-[11px] transition-colors"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Message Input Box */}
          <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask Alex a customer or sales question..."
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePlaygroundSend()}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handlePlaygroundSend}
              disabled={!testInput.trim() || testLoading}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Send className="h-4 w-4" />
              {testLoading ? 'Generating...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
