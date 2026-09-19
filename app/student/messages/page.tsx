"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Search, Plus, ArrowLeft, Clock, User, Video, X } from 'lucide-react';

interface Conversation {
  id: string;
  student_id: string;
  author_id: string;
  learning_product_id: string;
  created_at: string;
  updated_at: string;
  unread_count: number;
  learning_products: {
    id: string;
    title: string;
    thumbnail: string | null;
  };
  authors: {
    id: string;
    display_name: string;
    profile_image: string | null;
  };
}

interface EnrolledCourse {
  id: string;
  title: string;
  author_id: string;
  author_name: string;
}

export default function StudentMessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [creatingConversation, setCreatingConversation] = useState(false);

  useEffect(() => {
    fetchConversations();
    fetchEnrolledCourses();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/student/messages/conversations', {
        credentials: 'include',
      });
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

  const fetchEnrolledCourses = async () => {
    try {
      const response = await fetch('/api/student/enrolled-courses', {
        credentials: 'include',
      });
      const data = await response.json();
      console.log('Enrolled courses response:', data);
      if (data.success) {
        setEnrolledCourses(data.courses);
      } else {
        console.error('Failed to fetch enrolled courses:', data.error);
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    }
  };

  const startNewConversation = async () => {
    console.log('Starting new conversation with course:', selectedCourse);
    if (!selectedCourse || creatingConversation) {
      console.log('Cannot start conversation - missing course or already creating');
      return;
    }

    setCreatingConversation(true);
    try {
      const response = await fetch('/api/student/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ learning_product_id: selectedCourse }),
      });

      const data = await response.json();
      console.log('Conversation creation response:', data);
      if (data.success) {
        setShowNewMessageModal(false);
        setSelectedCourse('');
        fetchConversations();
        // Navigate to the new conversation
        if (data.conversation) {
          setSelectedConversation(data.conversation);
        }
      } else {
        alert(data.error || 'Failed to create conversation');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to create conversation');
    } finally {
      setCreatingConversation(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.learning_products.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.authors.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedConversation) {
    return (
      <>
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
        {/* Modal - render here too when conversation is selected */}
        {showNewMessageModal && (
          <>
            {console.log('Modal rendering inside conversation view, showNewMessageModal:', showNewMessageModal)}
            <div 
              className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowNewMessageModal(false);
                }
              }}
            >
              <div 
                className="bg-[var(--card)] brightness-95 border border-brand-border rounded-lg max-w-md w-full p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-brand-text">Start New Conversation</h2>
                  <button
                    type="button"
                    onClick={() => setShowNewMessageModal(false)}
                    className="text-brand-text/70 hover:text-brand-text"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-text mb-2">
                      Select Course
                    </label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full px-3 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    >
                      <option value="">Choose a course...</option>
                      {enrolledCourses.length === 0 ? (
                        <option value="" disabled>No enrolled courses found</option>
                      ) : (
                        enrolledCourses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.title} - {course.author_name}
                          </option>
                        ))
                      )}
                    </select>
                    {enrolledCourses.length === 0 && (
                      <p className="text-xs text-brand-text/50 mt-1">
                        You need to be enrolled in a course to start a conversation
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={startNewConversation}
                      disabled={!selectedCourse || creatingConversation}
                      className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {creatingConversation ? 'Creating...' : 'Start Conversation'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewMessageModal(false)}
                      className="px-4 py-2 border border-brand-border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </>
        )}
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-text mb-2">
              Messages
            </h1>
            <p className="text-brand-text/70">
              Communicate with your course instructors
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              console.log('New Message button clicked, current modal state:', showNewMessageModal);
              setShowNewMessageModal(true);
              console.log('Modal state set to true');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors cursor-pointer active:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            New Message
          </button>
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
              Start a conversation with your course instructor
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

      {/* New Message Modal */}
      {showNewMessageModal && (
        <>
          {console.log('Modal rendering, showNewMessageModal:', showNewMessageModal)}
          <div 
            className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowNewMessageModal(false);
              }
            }}
          >
            <div 
              className="bg-[var(--card)] brightness-95 border border-brand-border rounded-lg max-w-md w-full p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-brand-text">Start New Conversation</h2>
                <button
                  type="button"
                  onClick={() => setShowNewMessageModal(false)}
                  className="text-brand-text/70 hover:text-brand-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-2">
                    Select Course
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  >
                    <option value="">Choose a course...</option>
                    {enrolledCourses.length === 0 ? (
                      <option value="" disabled>No enrolled courses found</option>
                    ) : (
                      enrolledCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title} - {course.author_name}
                        </option>
                      ))
                    )}
                  </select>
                  {enrolledCourses.length === 0 && (
                    <p className="text-xs text-brand-text/50 mt-1">
                      You need to be enrolled in a course to start a conversation
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={startNewConversation}
                    disabled={!selectedCourse || creatingConversation}
                    className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {creatingConversation ? 'Creating...' : 'Start Conversation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewMessageModal(false)}
                    className="px-4 py-2 border border-brand-border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
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
              {conversation.authors.display_name}
            </h3>
            {conversation.unread_count > 0 && (
              <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-medium rounded-full">
                {conversation.unread_count}
              </span>
            )}
          </div>
          <p className="text-sm text-brand-text/70 truncate">
            {conversation.learning_products.title}
          </p>
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
          {conversation.authors.display_name}
        </h2>
        <p className="text-sm text-brand-text/70">
          {conversation.learning_products.title}
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

      {/* New Message Modal */}
      {showNewMessageModal && (
        <>
          {console.log('Modal rendering, showNewMessageModal:', showNewMessageModal)}
          <div 
            className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowNewMessageModal(false);
              }
            }}
          >
            <div 
              className="bg-[var(--card)] brightness-95 border border-brand-border rounded-lg max-w-md w-full p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-text">Start New Conversation</h2>
              <button
                type="button"
                onClick={() => setShowNewMessageModal(false)}
                className="text-brand-text/70 hover:text-brand-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">
                  Select Course
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                >
                  <option value="">Choose a course...</option>
                  {enrolledCourses.length === 0 ? (
                    <option value="" disabled>No enrolled courses found</option>
                  ) : (
                    enrolledCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title} - {course.author_name}
                      </option>
                    ))
                  )}
                </select>
                {enrolledCourses.length === 0 && (
                  <p className="text-xs text-brand-text/50 mt-1">
                    You need to be enrolled in a course to start a conversation
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={startNewConversation}
                  disabled={!selectedCourse || creatingConversation}
                  className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {creatingConversation ? 'Creating...' : 'Start Conversation'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewMessageModal(false)}
                  className="px-4 py-2 border border-brand-border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: any }) {
  const isStudent = message.sender_role === 'STUDENT';

  return (
    <div className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg ${
          isStudent
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