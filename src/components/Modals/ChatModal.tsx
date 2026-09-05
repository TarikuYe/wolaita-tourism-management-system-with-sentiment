import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, Building, Clock, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../config/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderType: 'tourist' | 'agency' | 'admin';
  content: string;
  timestamp: Date;
  read: boolean;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispute: any;
}

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, dispute }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages for this chat
  useEffect(() => {
    if (!isOpen || !dispute?.id) return;

    console.log('Fetching messages for dispute:', dispute.id);
    
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', dispute.id),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, 
      (snapshot) => {
        const messagesData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            chatId: data.chatId,
            senderId: data.senderId,
            senderName: data.senderName,
            senderType: data.senderType,
            content: data.content,
            timestamp: data.timestamp?.toDate() || new Date(),
            read: data.read || false
          } as Message;
        });
        
        console.log('Messages loaded:', messagesData.length);
        setMessages(messagesData);
        setMessagesLoading(false);

        // Mark messages as read
        const unreadMessages = messagesData.filter(
          msg => !msg.read && msg.senderId !== currentUser?.id
        );
        
        if (unreadMessages.length > 0) {
          unreadMessages.forEach(async (message) => {
            try {
              await updateDoc(doc(db, 'messages', message.id), {
                read: true
              });
            } catch (error) {
              console.error('Error marking message as read:', error);
            }
          });
        }
      },
      (error) => {
        console.error('Error fetching messages:', error);
        setMessagesLoading(false);
        toast.error('Failed to load messages');
      }
    );

    return () => unsubscribe();
  }, [isOpen, dispute?.id, currentUser?.id]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUser || !dispute?.id) return;

    setLoading(true);

    try {
      // Add message to messages collection
      await addDoc(collection(db, 'messages'), {
        chatId: dispute.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderType: currentUser.role === 'agency' ? 'agency' : 'tourist',
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
        read: false
      });

      // Update chat last message and timestamp
      const chatRef = doc(db, 'chats', dispute.id);
      await updateDoc(chatRef, {
        lastMessage: newMessage.trim(),
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadCount: currentUser.role === 'agency' ? 0 : 1 // If agency sends, reset unread count for tourist
      });

      setNewMessage('');
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg max-w-4xl w-full mx-4 h-3/4 flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {currentUser?.role === 'agency' ? (
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {currentUser?.role === 'agency' ? dispute.createdByName : dispute.agencyName}
              </h2>
              <p className="text-sm text-gray-600">Dispute: {dispute.title}</p>
              <p className="text-xs text-gray-500">Tour: {dispute.tourName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-500">
                  Start the conversation by sending a message about the dispute.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const showDate = index === 0 || 
                  formatDate(messages[index - 1].timestamp) !== formatDate(message.timestamp);
                
                return (
                  <div key={message.id}>
                    {/* Date separator */}
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                    )}

                    {/* Message */}
                    <div className={`flex ${message.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === currentUser?.id 
                          ? 'bg-amber-600 text-white' 
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-xs font-medium ${
                            message.senderId === currentUser?.id ? 'text-amber-100' : 'text-gray-500'
                          }`}>
                            {message.senderName}
                          </span>
                          <span className={`text-xs ${
                            message.senderId === currentUser?.id ? 'text-amber-200' : 'text-gray-400'
                          }`}>
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white rounded-b-lg">
          <form onSubmit={sendMessage} className="flex space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || loading}
              className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};