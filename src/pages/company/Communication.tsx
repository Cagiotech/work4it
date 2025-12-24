import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, MessageSquare, Users, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ConversationList } from "@/components/company/communication/ConversationList";
import { ChatWindow } from "@/components/company/communication/ChatWindow";
import { NewMessageDialog } from "@/components/company/communication/NewMessageDialog";
import { SuggestionsSection } from "@/components/company/communication/SuggestionsSection";

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
  const { profile, user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessageOpen, setNewMessageOpen] = useState(false);

  useEffect(() => {
    if (profile?.company_id) {
      fetchConversations();
      
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
            
            if (selectedConversation && 
                ((newMsg.sender_id === selectedConversation.id && newMsg.sender_type === selectedConversation.type) ||
                 (newMsg.receiver_id === selectedConversation.id && newMsg.receiver_type === selectedConversation.type))) {
              setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
              
              if (newMsg.sender_type !== 'company') {
                supabase
                  .from('messages')
                  .update({ is_read: true, read_at: new Date().toISOString() })
                  .eq('id', newMsg.id);
              }
            } else if (newMsg.receiver_type === 'company' || newMsg.sender_type === 'company') {
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
      // Fetch all active students and staff from the company
      const [studentsResult, staffResult, messagesResult] = await Promise.all([
        supabase
          .from('students')
          .select('id, full_name')
          .eq('company_id', profile.company_id)
          .eq('status', 'active'),
        supabase
          .from('staff')
          .select('id, full_name')
          .eq('company_id', profile.company_id)
          .eq('is_active', true),
        supabase
          .from('messages')
          .select('*')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false })
      ]);

      const students = studentsResult.data || [];
      const staff = staffResult.data || [];
      const messagesData = messagesResult.data || [];

      // Create a map to track message data per contact
      const messageMap = new Map<string, { lastMessage: string; lastMessageTime: string; unreadCount: number }>();
      
      for (const msg of messagesData) {
        // Company sends/receives - determine the other party
        const isFromCompany = msg.sender_type === 'company';
        const isToCompany = msg.receiver_type === 'company';
        
        // Skip messages that don't involve company
        if (!isFromCompany && !isToCompany) continue;
        
        const otherType = isFromCompany ? msg.receiver_type : msg.sender_type;
        const otherId = isFromCompany ? msg.receiver_id : msg.sender_id;
        const key = `${otherType}-${otherId}`;
        
        if (!messageMap.has(key)) {
          messageMap.set(key, {
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unreadCount: !msg.is_read && isToCompany ? 1 : 0
          });
        } else {
          const existing = messageMap.get(key)!;
          if (!msg.is_read && isToCompany) {
            existing.unreadCount++;
          }
        }
      }

      // Build conversation list with all students and staff
      const convArray: Conversation[] = [];
      
      for (const student of students) {
        const key = `student-${student.id}`;
        const msgData = messageMap.get(key);
        convArray.push({
          id: student.id,
          name: student.full_name,
          type: 'student',
          lastMessage: msgData?.lastMessage || '',
          lastMessageTime: msgData?.lastMessageTime || '',
          unreadCount: msgData?.unreadCount || 0
        });
      }
      
      for (const member of staff) {
        const key = `staff-${member.id}`;
        const msgData = messageMap.get(key);
        convArray.push({
          id: member.id,
          name: member.full_name,
          type: 'staff',
          lastMessage: msgData?.lastMessage || '',
          lastMessageTime: msgData?.lastMessageTime || '',
          unreadCount: msgData?.unreadCount || 0
        });
      }

      // Sort: unread first, then by last message time
      convArray.sort((a, b) => {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
        if (!a.lastMessageTime && !b.lastMessageTime) return a.name.localeCompare(b.name);
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

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
      const { error } = await supabase.from('messages').insert({
        company_id: profile.company_id,
        content,
        sender_id: profile.company_id,
        sender_type: 'company',
        receiver_id: selectedConversation.id,
        receiver_type: selectedConversation.type
      });

      if (error) throw error;

      await fetchMessages(selectedConversation.id, selectedConversation.type);
      await fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const handleSelectRecipients = async (recipients: { id: string; name: string; type: 'student' | 'staff' }[]) => {
    if (recipients.length >= 1) {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Comunicação</h2>
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Mensagens
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Sugestões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-4">
          <div className="h-[calc(100vh-280px)]">
            <Card className="h-full flex overflow-hidden">
              {/* Sidebar */}
              <div className="w-80 flex-shrink-0 flex flex-col">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Conversas
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
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="mt-4">
          {profile?.company_id && user?.id && (
            <SuggestionsSection companyId={profile.company_id} userId={user.id} />
          )}
        </TabsContent>
      </Tabs>

      <NewMessageDialog
        open={newMessageOpen}
        onOpenChange={setNewMessageOpen}
        onSelectRecipients={handleSelectRecipients}
      />
    </div>
  );
}
