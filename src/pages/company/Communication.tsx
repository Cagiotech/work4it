import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ConversationList } from "@/components/company/communication/ConversationList";
import { ChatWindow } from "@/components/company/communication/ChatWindow";
import { NewMessageDialog } from "@/components/company/communication/NewMessageDialog";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_type: string;
  receiver_id: string;
  receiver_type: string;
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  id: string;
  name: string;
  type: 'student' | 'staff' | 'company';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function Communication() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessageOpen, setNewMessageOpen] = useState(false);

  useEffect(() => {
    if (profile?.company_id) {
      fetchConversations();
      
      // Subscribe to realtime messages
      const channel = supabase
        .channel('company-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `company_id=eq.${profile.company_id}`
          },
          (payload) => {
            const newMsg = payload.new as Message;
            console.log('New message received:', newMsg);
            
            // If the message is for the selected conversation, add it to messages
            if (selectedConversation && 
                ((newMsg.sender_id === selectedConversation.id && newMsg.sender_type === selectedConversation.type) ||
                 (newMsg.receiver_id === selectedConversation.id && newMsg.receiver_type === selectedConversation.type))) {
              setMessages(prev => {
                // Avoid duplicates
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
              
              // Mark as read if it's from the other party
              if (newMsg.sender_type !== 'company') {
                supabase
                  .from('messages')
                  .update({ is_read: true, read_at: new Date().toISOString() })
                  .eq('id', newMsg.id);
              }
            } else if (newMsg.receiver_type === 'company' || newMsg.sender_type === 'company') {
              // Update conversations list for unread count
              fetchConversations();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.company_id, selectedConversation?.id]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id, selectedConversation.type);
    }
  }, [selectedConversation?.id]);

  const fetchConversations = async () => {
    if (!profile?.company_id) return;
    
    setLoading(true);
    try {
      // Fetch messages where company user is involved
      const { data: messagesData } = await (supabase
        .from('messages')
        .select('*')
        .eq('company_id', profile.company_id) as any)
        .order('created_at', { ascending: false });

      if (!messagesData) {
        setConversations([]);
        return;
      }

      // Group by unique conversation partner
      const convMap = new Map<string, Conversation>();
      
      for (const msg of messagesData) {
        // Determine the other party
        const isFromCompany = msg.sender_type === 'company';
        const otherType = isFromCompany ? msg.receiver_type : msg.sender_type;
        const otherId = isFromCompany ? msg.receiver_id : msg.sender_id;
        const key = `${otherType}-${otherId}`;
        
        if (!convMap.has(key)) {
          convMap.set(key, {
            id: otherId,
            name: 'A carregar...',
            type: otherType as 'student' | 'staff',
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unreadCount: !msg.is_read && !isFromCompany ? 1 : 0
          });
        } else {
          const existing = convMap.get(key)!;
          if (!msg.is_read && !isFromCompany) {
            existing.unreadCount++;
          }
        }
      }

      // Fetch names for each conversation partner
      const convArray = Array.from(convMap.values());
      
      for (const conv of convArray) {
        const table = conv.type === 'student' ? 'students' : 'staff';
        const { data } = await supabase.from(table).select('full_name').eq('id', conv.id).single();
        if (data) {
          conv.name = data.full_name;
        }
      }

      setConversations(convArray);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (recipientId: string, recipientType: string) => {
    if (!profile?.company_id) return;
    
    setMessagesLoading(true);
    try {
      const { data } = await (supabase
        .from('messages')
        .select('*')
        .eq('company_id', profile.company_id) as any)
        .or(`and(sender_id.eq.${recipientId},sender_type.eq.${recipientType}),and(receiver_id.eq.${recipientId},receiver_type.eq.${recipientType})`)
        .order('created_at', { ascending: true });

      setMessages(data || []);

      // Mark as read
      if (data) {
        const unreadIds = data
          .filter((m: Message) => !m.is_read && m.sender_id === recipientId && m.sender_type === recipientType)
          .map((m: Message) => m.id);
        
        if (unreadIds.length > 0) {
          await supabase.from('messages').update({ is_read: true, read_at: new Date().toISOString() }).in('id', unreadIds);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!profile?.company_id || !selectedConversation) return;

    try {
      // For company sending, sender_id is the company_id
      const { error } = await supabase.from('messages').insert({
        company_id: profile.company_id,
        content,
        sender_id: profile.company_id,
        sender_type: 'company',
        receiver_id: selectedConversation.id,
        receiver_type: selectedConversation.type
      });

      if (error) throw error;

      // Refetch messages
      await fetchMessages(selectedConversation.id, selectedConversation.type);
      await fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const handleSelectRecipients = async (recipients: { id: string; name: string; type: 'student' | 'staff' }[]) => {
    if (recipients.length === 1) {
      const r = recipients[0];
      setSelectedConversation({
        id: r.id,
        name: r.name,
        type: r.type,
        lastMessage: '',
        lastMessageTime: '',
        unreadCount: 0
      });
    } else if (recipients.length > 1) {
      toast.info('Selecionou múltiplos destinatários. Por agora, só suportamos conversa individual.');
      const r = recipients[0];
      setSelectedConversation({
        id: r.id,
        name: r.name,
        type: r.type,
        lastMessage: '',
        lastMessageTime: '',
        unreadCount: 0
      });
    }
  };

  return (
    <div className="h-[calc(100vh-180px)]">
      <Card className="h-full flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Mensagens
            </h2>
            <Button size="sm" onClick={() => setNewMessageOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nova
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversation?.id || null}
              onSelect={setSelectedConversation}
              loading={loading}
            />
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 border-l border-border">
          {selectedConversation ? (
            <ChatWindow
              recipientId={selectedConversation.id}
              recipientName={selectedConversation.name}
              recipientType={selectedConversation.type}
              messages={messages}
              currentUserId={profile?.company_id || ''}
              currentUserType="company"
              onSendMessage={handleSendMessage}
              loading={messagesLoading}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Users className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg">Selecione uma conversa</p>
              <p className="text-sm">ou inicie uma nova mensagem</p>
            </div>
          )}
        </div>
      </Card>

      <NewMessageDialog
        open={newMessageOpen}
        onOpenChange={setNewMessageOpen}
        onSelectRecipients={handleSelectRecipients}
      />
    </div>
  );
}
