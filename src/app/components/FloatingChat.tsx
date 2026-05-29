import { useState, useEffect, useRef } from 'react';
import { X, Send, Search, MessageCircle, User, Clock, Trash2, ArrowLeft, Minimize2 } from 'lucide-react';
import {
  getConversations,
  getConversation,
  sendMessage,
  markConversationAsRead,
  getAllUsers,
  deleteConversation,
  getUnreadCount,
  ChatMessage,
  ChatConversation
} from '../utils/chatService';
import { toast } from 'sonner';

interface FloatingChatProps {
  currentUserId: string;
  currentUserName: string;
}

export function FloatingChat({ currentUserId, currentUserName }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [view, setView] = useState<'conversations' | 'chat' | 'new-chat'>('conversations');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(async () => {
      await loadConversations();
      try {
        const count = await getUnreadCount(currentUserId);
        setUnreadCount(count);
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [currentUserId]);

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

  const loadConversations = async () => {
    try {
      const convos = await getConversations(currentUserId);
      setConversations(convos);
      if (selectedConversation) {
        const updatedConvo = convos.find(c => c.userId === selectedConversation.userId);
        if (updatedConvo) {
          setSelectedConversation(updatedConvo);
          await loadMessages(updatedConvo.userId);
        }
      }
    } catch {
      // ignore
    }
  };

  const loadMessages = async (otherUserId: string) => {
    try {
      const msgs = await getConversation(currentUserId, otherUserId);
      setMessages(msgs);
    } catch {
      // ignore
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await sendMessage(
        currentUserId,
        currentUserName,
        selectedConversation.userId,
        selectedConversation.userName,
        newMessage.trim()
      );
      setNewMessage('');
      await loadMessages(selectedConversation.userId);
      await loadConversations();
    } catch (err) {
      toast.error((err as Error).message || 'Failed to send message');
    }
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

  const handleStartNewChat = async () => {
    try {
      const users = await getAllUsers(currentUserId);
      setAvailableUsers(users);
      setView('new-chat');
    } catch (err) {
      toast.error((err as Error).message || 'Failed to load users');
    }
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

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const filteredUsers = availableUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Floating Chat Bubble */}
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-[#5B9BD5] to-[#4682B4] text-white w-16 h-16 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 flex items-center justify-center z-50"
      >
        <MessageCircle size={28} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-6 bg-white rounded-2xl shadow-2xl z-50 transition-all ${
            isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5B9BD5] to-[#4682B4] text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              {view !== 'conversations' && !isMinimized && (
                <button onClick={handleBack} className="hover:bg-white/20 p-1 rounded transition-colors">
                  <ArrowLeft size={18} />
                </button>
              )}
              <MessageCircle size={20} />
              <div>
                <h3 className="font-bold text-sm">
                  {view === 'conversations' && 'Messages'}
                  {view === 'chat' && selectedConversation?.userName}
                  {view === 'new-chat' && 'New Chat'}
                </h3>
                {view === 'chat' && selectedConversation && !isMinimized && (
                  <p className="text-xs text-blue-100">{selectedConversation.userEmail}</p>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={handleMinimize}
                className="hover:bg-white/20 p-1.5 rounded transition-colors"
              >
                <Minimize2 size={16} />
              </button>
              <button
                onClick={handleToggle}
                className="hover:bg-white/20 p-1.5 rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="h-[calc(100%-4rem)] overflow-hidden flex flex-col">
              {/* Conversations List View */}
              {view === 'conversations' && (
                <div className="flex-1 flex flex-col">
                  <div className="p-3 border-b">
                    <button
                      onClick={handleStartNewChat}
                      className="w-full bg-[#FFE54D] hover:bg-[#FFD700] text-gray-900 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <MessageCircle size={16} />
                      New Chat
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                        <MessageCircle size={40} className="mb-3 opacity-50" />
                        <p className="font-semibold text-sm">No conversations</p>
                        <p className="text-xs text-center">Start a new chat</p>
                      </div>
                    ) : (
                      conversations.map(convo => (
                        <div
                          key={convo.userId}
                          className="p-3 border-b hover:bg-gray-50 cursor-pointer flex items-center justify-between group"
                          onClick={() => handleSelectConversation(convo)}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="bg-[#5B9BD5] text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                              {convo.userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <p className="font-semibold text-sm text-gray-900 truncate">{convo.userName}</p>
                                {convo.unreadCount > 0 && (
                                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                                    {convo.unreadCount}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 truncate">{convo.lastMessage}</p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(convo.userId, convo.userName);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-red-600 hover:bg-red-100 p-1 rounded transition-all"
                          >
                            <Trash2 size={14} />
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
                  <div className="p-3 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5] text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                        <User size={40} className="mb-3 opacity-50" />
                        <p className="font-semibold text-sm">No users found</p>
                      </div>
                    ) : (
                      filteredUsers.map(user => (
                        <div
                          key={user.id}
                          className="p-3 border-b hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                          onClick={() => handleSelectUser(user)}
                        >
                          <div className="bg-[#5B9BD5] text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-600 truncate">{user.email}</p>
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
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <MessageCircle size={40} className="mb-3 opacity-50" />
                        <p className="font-semibold text-sm">No messages yet</p>
                        <p className="text-xs">Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map(msg => {
                        const isSender = msg.senderId === currentUserId;
                        return (
                          <div key={msg.id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%]`}>
                              <div
                                className={`rounded-lg p-2 ${
                                  isSender
                                    ? 'bg-[#5B9BD5] text-white'
                                    : 'bg-white border border-gray-200 text-gray-900'
                                }`}
                              >
                                <p className="text-xs whitespace-pre-wrap break-words">{msg.message}</p>
                              </div>
                              <p className={`text-xs text-gray-500 mt-0.5 ${isSender ? 'text-right' : 'text-left'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-3 border-t bg-white">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5] text-sm"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-[#5B9BD5] hover:bg-[#4682B4] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
