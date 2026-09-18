"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Search, Plus, ArrowLeft, Clock, User } from 'lucide-react';

interface Conversation {
  id: string;
  student_id: string;
  learning_product_id: string;
  created_at: string;
  updated_at: string;
  unread_count: number;
  learning_products: {
    id: string;
    title: string;
    thumbnail: string | null;
  };
}

export default function AuthorMessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/author/messages/conversations');
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.learning_products.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedConversation) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedConversation(null)}
          className="flex items-center gap-2 text-sky-600 hover:text-sky-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to conversations
        </button>
        <MessageView conversation={selectedConversation} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text mb-2">
            Messages
          </h1>
          <p className="text-brand-text/70">
            Communicate with your students
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/50" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* Conversations List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-brand-text/50">Loading conversations...</div>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="w-12 h-12 text-neutral-300 mb-3" />
          <p className="text-brand-text/70 text-sm">
            {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
          </p>
          <p className="text-brand-text/50 text-xs mt-1">
            Messages from your students will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              onClick={() => setSelectedConversation(conversation)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ConversationCard({ conversation, onClick }: { conversation: Conversation; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg hover:shadow-md transition-shadow text-left"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-brand-text truncate">
              {conversation.learning_products.title}
            </h3>
            {conversation.unread_count > 0 && (
              <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-medium rounded-full">
                {conversation.unread_count}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-brand-text/50">
            <User className="w-3 h-3" />
            <span>Student ID: {conversation.student_id.slice(0, 8)}...</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-brand-text/50 mt-1">
            <Clock className="w-3 h-3" />
            <span>Last updated {new Date(conversation.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function MessageView({ conversation }: { conversation: Conversation }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [conversation.id]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/author/messages/conversations/${conversation.id}/messages`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/author/messages/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_type: 'TEXT',
          body: newMessage,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        fetchMessages();
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
        <h2 className="font-semibold text-brand-text mb-1">
          {conversation.learning_products.title}
        </h2>
        <p className="text-sm text-brand-text/70">
          Conversation with student
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-brand-text/50">Loading messages...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Messages */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-brand-text/50">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 px-4 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: any }) {
  const isAuthor = message.sender_role === 'AUTHOR';

  return (
    <div className={`flex ${isAuthor ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg ${
          isAuthor
            ? 'bg-sky-600 text-white'
            : 'bg-gray-100 text-brand-text'
        }`}
      >
        {message.body && <p className="text-sm">{message.body}</p>}
        {message.author_message_attachments && message.author_message_attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.author_message_attachments.map((attachment: any) => (
              <div key={attachment.id} className="text-xs">
                📎 {attachment.file_name}
              </div>
            ))}
          </div>
        )}
        <p className="text-xs mt-1 opacity-70">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}