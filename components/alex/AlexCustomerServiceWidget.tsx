'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Award,
  DollarSign,
  UserCheck,
  Clock,
  Loader2,
  CheckCircle2,
  Bot
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const FOUNDER_INFO = {
  name: 'Femi Adeleke',
  role: 'Founder & Lead AI Automation Instructor',
  phone: '08120934828',
  phoneInternational: '+2348120934828',
  whatsappUrl: 'https://wa.me/2348120934828?text=Hello%20Femi%2C%20I%20am%20inquiring%20about%20AutoLearn%20Spot%20courses',
  email: 'autolearnspot@gmail.com',
  responseSLA: '< 15 mins via WhatsApp',
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-1',
    role: 'assistant',
    content: `Hello! 👋 I'm **ALEX**, your AutoLearn Spot AI Concierge.\n\nI can help you explore our hands-on tech courses (including **AI Automation with n8n** at **₦3,000** promo), answer questions about our **Guaranteed Certificates**, explain how you can **earn up to 70% as an Affiliate Partner**, or connect you directly with founder **Femi Adeleke**.`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

const QUICK_PROMPTS = [
  { label: '💰 Course Fees & ₦3,000 Promo', prompt: 'Tell me about the courses available and the ₦3,000 promo' },
  { label: '🏆 Verified Certificates', prompt: 'How does the certificate of completion work and is it verified?' },
  { label: '💸 Affiliate Partner (70%)', prompt: 'How do I become an affiliate partner and earn commissions?' },
  { label: '💬 Talk to Founder on WhatsApp', prompt: 'I want to speak with founder Femi Adeleke on WhatsApp' }
];

export function AlexCustomerServiceWidget() {
  const pathname = usePathname();

  // Hide on full-screen AI chat page or admin studio to prevent clutter
  if (pathname === '/autolearn-ai' || pathname === '/dashboard/alex') {
    return null;
  }

  // Check if current page is product details with mobile floating bar
  const isProductPage = pathname?.includes('/learning_products/') || (pathname?.includes('/marketplace/') && pathname.split('/').filter(Boolean).length >= 2);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'contact' | 'lead'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Lead Form State
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadMessage, setLeadMessage] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore chat messages from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('alex_customer_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // Ignore parsing errors
    }
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 1) {
      try {
        localStorage.setItem('alex_customer_chat_history', JSON.stringify(messages.slice(-30)));
      } catch {
        // Ignore storage errors
      }
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/alex/customer-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: newMessages.slice(-6)
        })
      });

      if (!res.ok) throw new Error('Failed to get answer');

      const data = await res.json();
      const replyContent = data.reply || "I'm here to help! Feel free to chat with us on WhatsApp at 08120934828.";

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('[ALEX Widget] Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `bot-fallback-${Date.now()}`,
        role: 'assistant',
        content: `I'm currently connecting. You can chat directly with founder **Femi Adeleke** on WhatsApp at [08120934828](https://wa.me/2348120934828) or email autolearnspot@gmail.com for instant answers!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadEmail || !leadMessage || leadSubmitting) return;

    setLeadSubmitting(true);
    try {
      const res = await fetch('/api/alex/customer-support/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: leadName,
          email: leadEmail,
          phoneNumber: leadPhone,
          message: leadMessage,
          pageUrl: typeof window !== 'undefined' ? window.location.href : pathname
        })
      });

      if (!res.ok) throw new Error('Submission failed');

      setLeadSuccess(true);
      // Append a confirmation into the chat
      setMessages(prev => [
        ...prev,
        {
          id: `bot-lead-${Date.now()}`,
          role: 'assistant',
          content: `Thank you, **${leadName}**! Your message has been sent directly to founder **Femi Adeleke** and our admissions desk. We will respond promptly via WhatsApp or email.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setTimeout(() => {
        setLeadSuccess(false);
        setActiveTab('chat');
        setLeadName('');
        setLeadEmail('');
        setLeadPhone('');
        setLeadMessage('');
      }, 2500);
    } catch (err) {
      console.error('[ALEX Widget] Lead submit error:', err);
      alert('Could not submit inquiry right now. Please message us directly on WhatsApp at 08120934828.');
    } finally {
      setLeadSubmitting(false);
    }
  };

  return (
    <>
      {/* ─── FLOATING TRIGGER BUTTON ─── */}
      {!isOpen && (
        <div className={`fixed ${isProductPage ? 'bottom-20 sm:bottom-6' : 'bottom-6'} right-4 sm:right-6 z-50 flex items-center gap-3`}>
          {/* Pulsing Pill Trigger */}
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white pl-4 pr-5 py-3.5 rounded-full shadow-[0_10px_30px_rgba(16,185,129,0.45)] hover:shadow-[0_15px_35px_rgba(16,185,129,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 border border-emerald-400/40"
            aria-label="Open ALEX Customer Support"
          >
            {/* Online Indicator Badge */}
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white shadow" />
            </span>

            {/* Avatar & Brand Icon */}
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
              <Sparkles className="h-4 w-4 text-white animate-pulse" />
            </div>

            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold tracking-wide uppercase text-emerald-100 flex items-center gap-1">
                ALEX • 24/7 Support
              </div>
              <div className="text-sm font-extrabold text-white leading-tight">
                Chat with Us
              </div>
            </div>

            <span className="sm:hidden font-bold text-sm">
              Chat with ALEX
            </span>

            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-md">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ─── CHAT DRAWER / MODAL ─── */}
      {isOpen && (
        <div
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[410px] max-w-[440px] h-[85vh] max-h-[640px] bg-slate-900 border border-slate-800 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.65)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-900/40">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-white text-base">ALEX</h3>
                    <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Official Support
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    AutoLearn Spot Concierge • Online
                  </p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-1">
                <a
                  href={FOUNDER_INFO.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"
                  title="Direct WhatsApp"
                  aria-label="Open WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
                <a
                  href={`tel:${FOUNDER_INFO.phone}`}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                  title="Call Support"
                  aria-label="Call Support"
                >
                  <Phone className="h-4 w-4" />
                </a>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors ml-1"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 mt-3 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'chat'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                💬 AI Concierge
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'contact'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                👤 Founder Info
              </button>
              <button
                onClick={() => setActiveTab('lead')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'lead'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📝 Leave Note
              </button>
            </div>
          </div>

          {/* ─── TAB 1: AI CONCIERGE CHAT ─── */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/50">
              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                        msg.role === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-950/40'
                          : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60 shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-slate-400 bg-slate-800/80 border border-slate-700/60 rounded-2xl rounded-bl-none px-4 py-2.5 w-fit">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                    <span className="text-xs text-slate-300 font-medium">ALEX is thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Chips */}
              <div className="px-3 py-2 bg-slate-900/90 border-t border-slate-800 overflow-x-auto no-scrollbar flex items-center gap-1.5">
                {QUICK_PROMPTS.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(qp.prompt)}
                    className="shrink-0 text-[11px] font-medium bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-full transition-colors whitespace-nowrap"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-slate-900 border-t border-slate-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask ALEX anything about courses..."
                    className="flex-1 bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white p-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/50"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                  <a
                    href={FOUNDER_INFO.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#25D366] hover:bg-[#20ba59] text-white p-2.5 rounded-xl transition-all shadow-md"
                    title="Escalate to WhatsApp"
                    aria-label="Escalate to WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                </form>
              </div>
            </div>
          )}

          {/* ─── TAB 2: FOUNDER & DIRECT CONTACT INFO ─── */}
          {activeTab === 'contact' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/60">
              {/* Founder Profile Card */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 mx-auto flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-emerald-950/60 mb-2.5">
                  FA
                </div>
                <h4 className="text-white font-bold text-base">{FOUNDER_INFO.name}</h4>
                <p className="text-emerald-400 text-xs font-semibold">{FOUNDER_INFO.role}</p>
                <p className="text-slate-400 text-[11px] mt-1">
                  Guiding thousands of Nigerian & African professionals in high-income AI workflows and practical skills.
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  <Clock className="h-3 w-3" /> SLA: {FOUNDER_INFO.responseSLA}
                </div>
              </div>

              {/* Direct Channels */}
              <div className="space-y-2.5">
                {/* WhatsApp Direct */}
                <a
                  href={FOUNDER_INFO.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#25D366] text-white flex items-center justify-center shadow-md">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">Direct WhatsApp</div>
                      <div className="text-[11px] text-[#25D366] font-mono">{FOUNDER_INFO.phone}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#25D366] group-hover:translate-x-1 transition-transform" />
                </a>

                {/* Direct Telephone */}
                <a
                  href={`tel:${FOUNDER_INFO.phone}`}
                  className="flex items-center justify-between p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-md">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">Direct Phone Call</div>
                      <div className="text-[11px] text-slate-400 font-mono">{FOUNDER_INFO.phone}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </a>

                {/* Direct Email */}
                <a
                  href={`mailto:${FOUNDER_INFO.email}`}
                  className="flex items-center justify-between p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-md">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">Official Support Email</div>
                      <div className="text-[11px] text-slate-400">{FOUNDER_INFO.email}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>

              {/* Guarantees Box */}
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> 30-Day Money-Back Guarantee
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Award className="h-4 w-4 text-emerald-400" /> Tamper-Proof QR Verified Certificates
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <DollarSign className="h-4 w-4 text-emerald-400" /> Up to 70% Partner Commissions
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 3: LEAVE A NOTE / CALLBACK REQUEST ─── */}
          {activeTab === 'lead' && (
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950/60">
              {leadSuccess ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400 animate-bounce" />
                  <h4 className="text-white font-bold text-lg">Inquiry Sent Successfully!</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Founder Femi Adeleke and the AutoLearn Spot admissions desk have received your message. You will receive a direct reply via WhatsApp or email.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      placeholder="e.g. john@example.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Phone / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder="e.g. 08120934828"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Your Question or Inquiry *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={leadMessage}
                      onChange={(e) => setLeadMessage(e.target.value)}
                      placeholder="Ask about course curriculum, enrollment, partnership, or custom support..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={leadSubmitting}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60"
                  >
                    {leadSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Send Note to Founder
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-slate-500 text-center">
                    Instant alert sent to founder Femi Adeleke (autolearnspot@gmail.com).
                  </p>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
