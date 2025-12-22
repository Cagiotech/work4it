import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ConversationList } from "@/components/company/communication/ConversationList";
import { ChatWindow } from "@/components/company/communication/ChatWindow";

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

export default function PersonalChat() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [staffInfo, setStaffInfo] = useState<{ id: string; company_id: string } | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (staffInfo) {
      const channel = supabase
        .channel('staff-messages-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `company_id=eq.${staffInfo.company_id}`
          },
          (payload) => {
            const newMsg = payload.new as Message;
            console.log('Staff received message:', newMsg);

            const isForMe = (newMsg.receiver_id === staffInfo.id && newMsg.receiver_type === 'staff') ||
                            (newMsg.sender_id === staffInfo.id && newMsg.sender_type === 'staff');

            if (!isForMe) return;

            const isForSelectedContact = selectedConversation && (
              (selectedConversation.type === 'company' && (newMsg.sender_type === 'company' || newMsg.receiver_type === 'company')) ||
              (selectedConversation.type !== 'company' && (newMsg.sender_id === selectedConversation.id || newMsg.receiver_id === selectedConversation.id))
            );

            if (isForSelectedContact) {
              setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });

              if (newMsg.receiver_id === staffInfo.id && newMsg.receiver_type === 'staff') {
                supabase
                  .from('messages')
                  .update({ is_read: true, read_at: new Date().toISOString() })
                  .eq('id', newMsg.id);
              }
            } else if (newMsg.receiver_id === staffInfo.id && newMsg.receiver_type === 'staff') {
              const contactId = newMsg.sender_type === 'company'
                ? conversations.find(c => c.type === 'company')?.id
                : newMsg.sender_id;

              if (contactId) {
                setConversations(prev => prev.map(c =>
                  c.id === contactId ? { ...c, unreadCount: c.unreadCount + 1, lastMessage: newMsg.content, lastMessageTime: newMsg.created_at } : c
                ));
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [staffInfo, selectedConversation?.id]);

  useEffect(() => {
    if (selectedConversation && staffInfo) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation?.id, staffInfo]);

  const loadInitialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: staff } = await supabase
        .from('staff')
        .select('id, company_id')
        .eq('user_id', user.id)
        .single();

      if (!staff) {
        navigate('/login');
        return;
      }

      setStaffInfo(staff);

      const { data: company } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', staff.company_id)
        .single();

      const { data: students } = await supabase
        .from('students')
        .select('id, full_name, profile_photo_url')
        .eq('personal_trainer_id', staff.id)
        .eq('status', 'active');

      const convList: Conversation[] = [];

      if (company) {
        convList.push({
          id: company.id,
          name: company.name || 'Administração',
          type: 'company',
          lastMessage: '',
          lastMessageTime: '',
          unreadCount: 0
        });
      }

      if (students) {
        for (const student of students) {
          convList.push({
            id: student.id,
            name: student.full_name,
            type: 'student',
            lastMessage: '',
            lastMessageTime: '',
            unreadCount: 0
          });
        }
      }

      // Load last messages and unread counts
      for (const conv of convList) {
        const myId = staff.id;

        let lastMsgQuery;
        let unreadQuery;

        if (conv.type === 'company') {
          lastMsgQuery = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('company_id', staff.company_id)
            .or(`and(sender_type.eq.company,receiver_id.eq.${myId},receiver_type.eq.staff),and(sender_id.eq.${myId},sender_type.eq.staff,receiver_type.eq.company)`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          unreadQuery = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', myId)
            .eq('receiver_type', 'staff')
            .eq('sender_type', 'company')
            .eq('is_read', false);
        } else {
          const theirId = conv.id;

          lastMsgQuery = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('company_id', staff.company_id)
            .or(`and(sender_id.eq.${myId},receiver_id.eq.${theirId}),and(sender_id.eq.${theirId},receiver_id.eq.${myId})`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          unreadQuery = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', myId)
            .eq('receiver_type', 'staff')
            .eq('sender_id', theirId)
            .eq('is_read', false);
        }

        if (lastMsgQuery.data) {
          conv.lastMessage = lastMsgQuery.data.content;
          conv.lastMessageTime = lastMsgQuery.data.created_at;
        }

        conv.unreadCount = unreadQuery.count || 0;
      }

      convList.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

      setConversations(convList);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversation: Conversation) => {
    if (!staffInfo) return;

    setMessagesLoading(true);
    const myId = staffInfo.id;

    try {
      let query;

      if (conversation.type === 'company') {
        query = await supabase
          .from('messages')
          .select('*')
          .eq('company_id', staffInfo.company_id)
          .or(`and(sender_type.eq.company,receiver_id.eq.${myId},receiver_type.eq.staff),and(sender_id.eq.${myId},sender_type.eq.staff,receiver_type.eq.company)`)
          .order('created_at', { ascending: true });
      } else {
        const theirId = conversation.id;
        query = await supabase
          .from('messages')
          .select('*')
          .eq('company_id', staffInfo.company_id)
          .or(`and(sender_id.eq.${myId},receiver_id.eq.${theirId}),and(sender_id.eq.${theirId},receiver_id.eq.${myId})`)
          .order('created_at', { ascending: true });
      }

      setMessages(query.data || []);

      if (query.data) {
        const unreadIds = query.data
          .filter(m => !m.is_read && m.receiver_id === myId && m.receiver_type === 'staff')
          .map(m => m.id);

        if (unreadIds.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .in('id', unreadIds);
        }

        setConversations(prev => prev.map(c =>
          c.id === conversation.id ? { ...c, unreadCount: 0 } : c
        ));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!staffInfo || !selectedConversation) return;

    try {
      const { error } = await supabase.from('messages').insert({
        company_id: staffInfo.company_id,
        content,
        sender_id: staffInfo.id,
        sender_type: 'staff',
        receiver_id: selectedConversation.id,
        receiver_type: selectedConversation.type
      });

      if (error) throw error;

      await fetchMessages(selectedConversation);
      await loadInitialData();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
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
              currentUserId={staffInfo?.id || ''}
              currentUserType="staff"
              onSendMessage={handleSendMessage}
              loading={messagesLoading}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Users className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg">Selecione uma conversa</p>
              <p className="text-sm">para ver as mensagens</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
