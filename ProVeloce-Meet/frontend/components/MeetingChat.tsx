'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { MessageSquare, Send, X } from 'lucide-react';
import { chatApi, ChatMessage } from '@/lib/chat-api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

interface MeetingChatProps {
  meetingId: string;
  isOpen: boolean;
  onClose: () => void;
}

const MeetingChat = ({ meetingId, isOpen, onClose }: MeetingChatProps) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const token = await getToken({ template: "meet" });
      if (!token) return;

      const fetchedMessages = await chatApi.getMessages(meetingId, token);
      setMessages(fetchedMessages as ChatMessage[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const token = await getToken({ template: "meet" });
      if (!token || !user) return;

      const sentMessage = await chatApi.sendMessage(meetingId, newMessage.trim(), token);
      setMessages(prev => [...prev, sentMessage]);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Poll for new messages
  useEffect(() => {
    if (!isOpen || !meetingId) return;

    // Fetch initial messages
    fetchMessages();

    // Poll every 3 seconds for new messages
    pollIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, meetingId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 sm:right-4 sm:bottom-20 w-full sm:w-80 h-full sm:h-[500px] bg-dark-2 border-0 sm:border border-dark-3 rounded-none sm:rounded-lg shadow-lg flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-dark-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          <h3 className="text-white font-semibold text-sm sm:text-base">Chat</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-sm text-center">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((message) => (
            <div key={message._id || message.timestamp} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-blue-400">
                  {message.userName}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-300 break-words">{message.message}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 sm:p-4 border-t border-dark-3">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="bg-dark-3 border-dark-4 text-white placeholder:text-gray-500 text-sm sm:text-base"
            disabled={isSending}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            className="bg-blue-1 hover:bg-blue-2 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MeetingChat;

