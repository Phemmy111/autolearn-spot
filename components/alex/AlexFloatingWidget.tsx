"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Bot, 
  X, 
  Minimize2, 
  Maximize2, 
  Send, 
  Sparkles, 
  Loader2, 
  ExternalLink,
  Paperclip,
  RotateCcw,
  FileText,
  Image as ImageIcon,
  Check
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploading: boolean;
  error?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date | string;
  files?: { id: string; name: string; type: string }[];
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hi! I'm Alex, your AutoLearn AI tutor and personal learning companion. How can I help you with your courses, progress, assignments, or automation workflows today?",
  createdAt: new Date().toISOString(),
};

export function AlexFloatingWidget() {
  const pathname = usePathname();
  
  // Do not render floating widget if user is already on the dedicated Alex page
  if (pathname === "/dashboard/alex") {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chat history & conversation ID from localStorage on mount
  useEffect(() => {
    try {
      const savedConvId = localStorage.getItem("alex_floating_conv_id");
      if (savedConvId) {
        setConversationId(savedConvId);
      }

      const savedHistory = localStorage.getItem("alex_floating_chat_history");
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }

      // If we have a saved conversationId, sync latest messages from the DB
      if (savedConvId) {
        fetch(`/api/alex/conversations/${savedConvId}/messages`)
          .then((res) => {
            if (res.ok) return res.json();
            return null;
          })
          .then((data) => {
            if (data?.messages && Array.isArray(data.messages) && data.messages.length > 0) {
              const formatted: Message[] = data.messages.map((m: any) => ({
                id: m.id || Math.random().toString(),
                role: m.role,
                content: m.content,
                createdAt: m.created_at || new Date().toISOString(),
              }));
              setMessages(formatted);
              localStorage.setItem("alex_floating_chat_history", JSON.stringify(formatted));
            }
          })
          .catch((err) => {
            console.warn("Could not sync conversation messages:", err);
          });
      }
    } catch (e) {
      console.warn("Failed to load chat history from localStorage", e);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      if (messages.length > 1 || (messages.length === 1 && messages[0].id !== "welcome")) {
        localStorage.setItem("alex_floating_chat_history", JSON.stringify(messages));
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, [messages]);

  // Save conversationId to localStorage whenever it changes
  useEffect(() => {
    try {
      if (conversationId) {
        localStorage.setItem("alex_floating_conv_id", conversationId);
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, [conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, attachedFiles]);

  const handleStartNewChat = () => {
    setConversationId(null);
    setMessages([WELCOME_MESSAGE]);
    setAttachedFiles([]);
    setInput("");
    try {
      localStorage.removeItem("alex_floating_conv_id");
      localStorage.removeItem("alex_floating_chat_history");
    } catch (e) {
      // Ignore
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      const tempId = Math.random().toString(36).substring(7);
      const newAttachment: AttachedFile = {
        id: tempId,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        uploading: true,
      };

      setAttachedFiles((prev) => [...prev, newAttachment]);

      try {
        const formData = new FormData();
        formData.append("file", file);
        if (conversationId) {
          formData.append("conversationId", conversationId);
        }

        const res = await fetch("/api/alex/files", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || "Upload failed");
        }

        const data = await res.json();
        const serverFile = data.file;

        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }

        setAttachedFiles((prev) =>
          prev.map((f) =>
            f.id === tempId
              ? {
                  ...f,
                  id: serverFile.id,
                  uploading: false,
                }
              : f
          )
        );
      } catch (err: any) {
        setAttachedFiles((prev) =>
          prev.map((f) =>
            f.id === tempId
              ? {
                  ...f,
                  uploading: false,
                  error: err.message || "Failed to upload",
                }
              : f
          )
        );
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSend = async (userTextOverride?: string) => {
    const textToSend = (userTextOverride || input).trim();
    const readyFiles = attachedFiles.filter((f) => !f.uploading && !f.error);

    if ((!textToSend && readyFiles.length === 0) || isLoading) return;

    if (!userTextOverride) setInput("");

    const fileIdsToSend = readyFiles.map((f) => f.id);
    const filesPayload = readyFiles.map((f) => ({ id: f.id, name: f.name, type: f.type }));
    setAttachedFiles([]);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend || (readyFiles.length > 0 ? `Attached file: ${readyFiles.map((f) => f.name).join(", ")}` : ""),
      createdAt: new Date().toISOString(),
      files: filesPayload.length > 0 ? filesPayload : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const assistantMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      },
    ]);

    // Read personal provider if configured
    let personalConfig: any = {};
    try {
      const saved = localStorage.getItem("alex_personal_provider");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.provider && parsed.apiKey) {
          personalConfig = {
            personalProvider: parsed.provider,
            personalApiKey: parsed.apiKey,
            personalModel: parsed.model || undefined,
          };
        }
      }
    } catch (e) {
      // Ignore
    }

    try {
      const response = await fetch("/api/alex/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationId || undefined,
          content: userMessage.content,
          fileIds: fileIdsToSend.length > 0 ? fileIdsToSend : undefined,
          mode: "tutor",
          ...personalConfig,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.error || "Unable to reach Alex.");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No readable stream response from Alex.");
      }

      const decoder = new TextDecoder();
      let streamedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") continue;

            try {
              const event = JSON.parse(dataStr);
              if (event.type === "init" && event.conversationId) {
                setConversationId(event.conversationId);
              } else if (event.type === "finish" && event.conversationId) {
                setConversationId(event.conversationId);
              } else if (event.type === "delta" && event.content) {
                streamedContent += event.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: streamedContent }
                      : m
                  )
                );
              } else if (event.type === "error") {
                const errMsg = event.error || event.data?.error || "AI provider error.";
                if (!streamedContent) {
                  streamedContent = `⚠️ ${errMsg}\n\nTip: You can configure your AI key in the Settings of the full Alex Tutor page.`;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, content: streamedContent }
                        : m
                    )
                  );
                }
              }
            } catch (err) {
              // Ignore partial JSON chunks
            }
          }
        }
      }

      if (!streamedContent.trim()) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content:
                    "I am ready to help! If you have any questions regarding your courses, assignments, or workflows, please let me know.",
                }
              : m
          )
        );
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: `⚠️ ${err.message || "Connection issue"}. Please verify your provider or visit the full Alex AI Tutor page.`,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Hidden file input for all documents and images */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="*/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
          aria-label="Open Alex AI Tutor"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-300"></span>
            </span>
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold leading-tight flex items-center gap-1">
              Alex AI Tutor
              <Sparkles className="w-3 h-3 text-cyan-300" />
            </div>
            <div className="text-[10px] text-cyan-100 font-medium">Smart AI Assistant</div>
          </div>
        </button>
      )}

      {/* Floating Window */}
      {isOpen && (
        <div
          className={`bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col transition-all duration-300 ${
            isMinimized ? "w-80 h-14" : "w-[92vw] sm:w-[440px] h-[580px] max-h-[85vh]"
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 px-4 py-3 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold flex items-center gap-1.5 truncate">
                  Alex AI Tutor
                  <span className="text-[10px] bg-cyan-400/30 text-white border border-white/30 px-1.5 py-0.2 rounded-full font-semibold">
                    Smart
                  </span>
                </div>
                <div className="text-[10px] text-cyan-100/90 truncate">Autonomous Learning Companion</div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/80 shrink-0">
              <button
                onClick={handleStartNewChat}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Start New Chat"
                aria-label="Start New Chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <Link
                href="/dashboard/alex"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Open Fullscreen Page"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          {!isMinimized && (
            <>
              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-50/50 text-xs sm:text-sm">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {m.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center text-xs shrink-0 shadow-sm mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                        m.role === "user"
                          ? "bg-blue-600 text-white rounded-tr-none shadow-sm"
                          : "bg-white text-neutral-800 border border-neutral-200/80 rounded-tl-none shadow-sm"
                      }`}
                    >
                      {/* Attached files preview */}
                      {m.files && m.files.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          {m.files.map((f) => (
                            <div
                              key={f.id}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                                m.role === "user" ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-700"
                              }`}
                            >
                              {f.type.startsWith("image/") ? (
                                <ImageIcon className="w-3 h-3 shrink-0" />
                              ) : (
                                <FileText className="w-3 h-3 shrink-0" />
                              )}
                              <span className="truncate max-w-[150px]">{f.name}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {m.role === "assistant" ? (
                        m.content ? (
                          <div className="prose prose-sm max-w-none text-neutral-800 break-words dark:prose-invert">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                                li: ({ children }) => <li>{children}</li>,
                                strong: ({ children }) => <span className="font-semibold text-neutral-900">{children}</span>,
                                em: ({ children }) => <span className="italic">{children}</span>,
                                code: ({ children }) => (
                                  <code className="bg-neutral-100 text-neutral-800 px-1 py-0.5 rounded text-[12px] font-mono">
                                    {children}
                                  </code>
                                ),
                              }}
                            >
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-neutral-400">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
                          </span>
                        )
                      ) : (
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts */}
              {messages.length <= 2 && attachedFiles.length === 0 && (
                <div className="px-4 py-2 bg-white border-t border-neutral-100 flex gap-1.5 overflow-x-auto text-[11px]">
                  <button
                    onClick={() => handleSend("Explain n8n workflow nodes")}
                    className="shrink-0 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full transition-colors"
                  >
                    💡 Explain n8n
                  </button>
                  <button
                    onClick={() => handleSend("How many videos have I watched?")}
                    className="shrink-0 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full transition-colors"
                  >
                    📊 My video progress
                  </button>
                  <button
                    onClick={() => handleSend("What is my certificate status?")}
                    className="shrink-0 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full transition-colors"
                  >
                    🎓 My certificate
                  </button>
                </div>
              )}

              {/* Attached files preview chips above input */}
              {attachedFiles.length > 0 && (
                <div className="px-3 py-2 bg-neutral-50 border-t border-neutral-200 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {attachedFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${
                        file.error
                          ? "bg-red-50 border-red-200 text-red-600"
                          : file.uploading
                          ? "bg-blue-50 border-blue-200 text-blue-700 animate-pulse"
                          : "bg-white border-neutral-200 text-neutral-800 shadow-xs"
                      }`}
                    >
                      {file.uploading ? (
                        <Loader2 className="w-3 h-3 animate-spin shrink-0 text-blue-600" />
                      ) : file.type.startsWith("image/") ? (
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      )}
                      <span className="truncate max-w-[130px] font-medium">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(file.id)}
                        className="hover:bg-neutral-200 rounded p-0.5 text-neutral-400 hover:text-neutral-700 transition-colors ml-1"
                        title="Remove file"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-neutral-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="p-2 text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 rounded-xl transition-colors shrink-0"
                    title="Attach any document or image (PDF, Word, Code, Image, CSV)"
                    aria-label="Attach file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={attachedFiles.length > 0 ? "Add a message or press send..." : "Ask Alex anything..."}
                    disabled={isLoading}
                    className="flex-1 bg-neutral-100 hover:bg-neutral-50 focus:bg-white text-neutral-900 placeholder:text-neutral-400 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 border border-neutral-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={(!input.trim() && attachedFiles.filter((f) => !f.uploading).length === 0) || isLoading}
                    className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shrink-0"
                    aria-label="Send message"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-neutral-400 px-1">
                  <span>Powered by AutoLearn Spot</span>
                  <Link href="/dashboard/alex" className="hover:text-blue-600 transition-colors flex items-center gap-0.5">
                    Full AI Studio <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}