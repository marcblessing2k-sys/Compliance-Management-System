import { useState, useEffect, useRef } from 'react';
import { X, Send, Search, MessageCircle, User, Clock, Trash2, ArrowLeft } from 'lucide-react';
import {
  getConversations,
  getConversation,
  sendMessage,
  markConversationAsRead,
  getAllUsers,
  deleteConversation,
  ChatMessage,
  ChatConversation
} from '../utils/chatService';
import { toast } from 'sonner';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
}

export function ChatModal({ isOpen, onClose, currentUserId, currentUserName }: ChatModalProps) {
  const [view, setView] = useState<'conversations' | 'chat' | 'new-chat'>('conversations');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
      const interval = setInterval(loadConversations, 3000); // Refresh every 3 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen, currentUserId]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.userId);
      markConversationAsRead(currentUserId, selectedConversation.userId);
    }
  }, [selectedConversation, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = () => {
    const convos = getConversations(currentUserId);
    setConversations(convos);

    // Refresh current conversation if open
    if (selectedConversation) {
      const updatedConvo = convos.find(c => c.userId === selectedConversation.userId);
      if (updatedConvo) {
        setSelectedConversation(updatedConvo);
        loadMessages(updatedConvo.userId);
      }
    }
  };

  const loadMessages = (otherUserId: string) => {
    const msgs = getConversation(currentUserId, otherUserId);
    setMessages(msgs);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    sendMessage(
      currentUserId,
      currentUserName,
      selectedConversation.userId,
      selectedConversation.userName,
      newMessage.trim()
    );

    setNewMessage('');
    loadMessages(selectedConversation.userId);
    loadConversations();
    toast.success('Message sent');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectConversation = (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    setView('chat');
    markConversationAsRead(currentUserId, conversation.userId);
    loadConversations();
  };

  const handleStartNewChat = () => {
    const users = getAllUsers(currentUserId);
    setAvailableUsers(users);
    setView('new-chat');
  };

  const handleSelectUser = (user: any) => {
    const conversation: ChatConversation = {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      unreadCount: 0
    };
    setSelectedConversation(conversation);
    setView('chat');
    loadMessages(user.id);
  };

  const handleDeleteConversation = (userId: string, userName: string) => {
    if (confirm(`Delete conversation with ${userName}?`)) {
      deleteConversation(currentUserId, userId);
      loadConversations();
      if (selectedConversation?.userId === userId) {
        setSelectedConversation(null);
        setView('conversations');
      }
      toast.success('Conversation deleted');
    }
  };

  const handleBack = () => {
    setView('conversations');
    setSelectedConversation(null);
    setSearchQuery('');
  };

  const filteredUsers = availableUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#5B9BD5] to-[#4682B4] text-white p-5 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            {view !== 'conversations' && (
              <button onClick={handleBack} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
                <ArrowLeft size={20} />
              </button>
            )}
            <MessageCircle size={24} />
            <div>
              <h2 className="text-xl font-bold">
                {view === 'conversations' && 'Messages'}
                {view === 'chat' && selectedConversation?.userName}
                {view === 'new-chat' && 'New Conversation'}
              </h2>
              {view === 'chat' && selectedConversation && (
                <p className="text-sm text-blue-100">{selectedConversation.userEmail}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Conversations List View */}
          {view === 'conversations' && (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b">
                <button
                  onClick={handleStartNewChat}
                  className="w-full bg-[#FFE54D] hover:bg-[#FFD700] text-gray-900 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle size={20} />
                  New Conversation
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageCircle size={48} className="mb-4 opacity-50" />
                    <p className="font-semibold">No conversations yet</p>
                    <p className="text-sm">Start a new conversation to connect with colleagues</p>
                  </div>
                ) : (
                  conversations.map(convo => (
                    <div
                      key={convo.userId}
                      className="p-4 border-b hover:bg-gray-50 cursor-pointer flex items-center justify-between group"
                      onClick={() => handleSelectConversation(convo)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="bg-[#5B9BD5] text-white w-12 h-12 rounded-full flex items-center justify-center font-bold">
                          {convo.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{convo.userName}</p>
                            {convo.unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                                {convo.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">{convo.lastMessage}</p>
                          <p className="text-xs text-gray-400">
                            {convo.lastMessageTime && new Date(convo.lastMessageTime).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(convo.userId, convo.userName);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-600 hover:bg-red-100 p-2 rounded transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* New Chat - User Selection */}
          {view === 'new-chat' && (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <User size={48} className="mb-4 opacity-50" />
                    <p className="font-semibold">No users found</p>
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <div
                      key={user.id}
                      className="p-4 border-b hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className="bg-[#5B9BD5] text-white w-12 h-12 rounded-full flex items-center justify-center font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Chat View */}
          {view === 'chat' && selectedConversation && (
            <div className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageCircle size={48} className="mb-4 opacity-50" />
                    <p className="font-semibold">No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isSender = msg.senderId === currentUserId;
                    return (
                      <div key={msg.id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${isSender ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`rounded-lg p-3 ${
                              isSender
                                ? 'bg-[#5B9BD5] text-white'
                                : 'bg-white border border-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${isSender ? 'justify-end' : 'justify-start'}`}>
                            <Clock size={12} />
                            <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5] resize-none"
                    rows={2}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-[#5B9BD5] hover:bg-[#4682B4] text-white px-6 rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={20} />
                    Send
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
