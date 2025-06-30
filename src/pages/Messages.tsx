
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  status: 'sent' | 'ignored';
  created_at: string;
  sender: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  receiver: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

interface Conversation {
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

const Messages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchConversations();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(username, full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(username, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation
      const conversationMap = new Map();
      
      data?.forEach((message: any) => {
        const otherUser = message.sender_id === user?.id ? message.receiver : message.sender;
        const otherUserId = message.sender_id === user?.id ? message.receiver_id : message.sender_id;
        
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            user: { id: otherUserId, ...otherUser },
            lastMessage: message,
            unreadCount: 0
          });
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(username, full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(username, full_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('New message:', payload);
          fetchConversations();
          if (selectedConversation) {
            fetchMessages(selectedConversation);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          receiver_id: selectedConversation,
          content: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
      fetchMessages(selectedConversation);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const handleConversationSelect = (userId: string) => {
    setSelectedConversation(userId);
    fetchMessages(userId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen max-w-6xl mx-auto">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-purple-500/20 bg-slate-800/30">
        <div className="p-4 border-b border-purple-500/20">
          <h2 className="text-xl font-bold text-white">Messages</h2>
        </div>
        
        <div className="overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="text-center text-slate-300 py-12">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.user.id}
                className={`p-4 cursor-pointer hover:bg-slate-700/50 ${
                  selectedConversation === conversation.user.id ? 'bg-slate-700/70' : ''
                }`}
                onClick={() => handleConversationSelect(conversation.user.id)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.user.avatar_url} />
                    <AvatarFallback className="bg-purple-600 text-white">
                      {conversation.user.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-white">{conversation.user.username}</p>
                      <p className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(conversation.lastMessage.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <p className="text-sm text-slate-300 truncate">
                      {conversation.lastMessage.content}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <Badge 
                        variant={conversation.lastMessage.status === 'ignored' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {conversation.lastMessage.status === 'ignored' ? 'Ignored' : 'Sent'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === user?.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-purple-500/20">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="bg-slate-700 border-slate-600 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-300">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl mb-2">Select a conversation</p>
              <p>Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
