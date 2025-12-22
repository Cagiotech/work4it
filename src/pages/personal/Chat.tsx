import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Search, ArrowLeft, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format, isToday, isYesterday } from "date-fns";
import { pt } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  name: string;
  type: 'student' | 'company';
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

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

export default function PersonalChat() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [staffInfo, setStaffInfo] = useState<{ id: string; company_id: string } | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Subscribe to realtime messages when staffInfo is available
  useEffect(() => {
    if (staffInfo) {
      const cleanup = subscribeToMessages();
      return cleanup;
    }
  }, [staffInfo, selectedContact]);

  useEffect(() => {
    if (selectedContact && staffInfo) {
      loadMessages(selectedContact);
    }
  }, [selectedContact, staffInfo]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

      // Load company info as a contact
      const { data: company } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', staff.company_id)
        .single();

      // Load assigned students as contacts
      const { data: students } = await supabase
        .from('students')
        .select('id, full_name, profile_photo_url')
        .eq('personal_trainer_id', staff.id)
        .eq('status', 'active');

      const contactsList: Contact[] = [];

      // Add company as contact (use company_id as the contact id)
      if (company) {
        contactsList.push({
          id: company.id,
          name: company.name || 'Administração',
          type: 'company',
          unreadCount: 0
        });
      }

      // Add students as contacts
      if (students) {
        for (const student of students) {
          contactsList.push({
            id: student.id,
            name: student.full_name,
            type: 'student',
            avatar: student.profile_photo_url || undefined,
            unreadCount: 0
          });
        }
      }

      // Load last messages and unread counts for each contact
      for (const contact of contactsList) {
        // For company contacts, the company sends with its company_id as sender_id
        // For other contacts, they use their own id
        const myId = staff.id;
        const theirId = contact.id;
        
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('company_id', staff.company_id)
          .or(`and(sender_id.eq.${myId},receiver_id.eq.${theirId}),and(sender_id.eq.${theirId},receiver_id.eq.${myId})`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastMsg) {
          contact.lastMessage = lastMsg.content;
          contact.lastMessageTime = lastMsg.created_at;
        }

        // Count unread messages sent TO me (receiver_id is my staff id, receiver_type is staff)
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', myId)
          .eq('receiver_type', 'staff')
          .eq('sender_id', theirId)
          .eq('is_read', false);

        contact.unreadCount = count || 0;
      }

      // Sort contacts by last message time
      contactsList.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

      setContacts(contactsList);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (contact: Contact) => {
    if (!staffInfo) return;

    const myId = staffInfo.id;
    const theirId = contact.id;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('company_id', staffInfo.company_id)
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${theirId}),and(sender_id.eq.${theirId},receiver_id.eq.${myId})`)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
      
      // Mark messages as read (only messages where I am the receiver)
      const unreadIds = data
        .filter(m => !m.is_read && m.receiver_id === myId && m.receiver_type === 'staff')
        .map(m => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in('id', unreadIds);
      }

      // Update unread count in contacts
      setContacts(prev => prev.map(c => 
        c.id === contact.id ? { ...c, unreadCount: 0 } : c
      ));
    }
  };

  const subscribeToMessages = () => {
    if (!staffInfo) return;

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
          
          // Check if this message involves me (either as sender or receiver)
          const isForMe = (newMsg.receiver_id === staffInfo.id && newMsg.receiver_type === 'staff') ||
                          (newMsg.sender_id === staffInfo.id && newMsg.sender_type === 'staff');
          
          if (!isForMe) return;

          // If message is from selected contact, add to current chat
          if (selectedContact && 
              ((newMsg.sender_id === selectedContact.id) || 
               (newMsg.receiver_id === selectedContact.id))) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            
            // Mark as read if it's from the other party
            if (newMsg.sender_id === selectedContact.id) {
              supabase
                .from('messages')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('id', newMsg.id);
            }
          } else if (newMsg.receiver_id === staffInfo.id && newMsg.receiver_type === 'staff') {
            // Update unread count for other contacts
            setContacts(prev => prev.map(c => 
              c.id === newMsg.sender_id ? { ...c, unreadCount: c.unreadCount + 1, lastMessage: newMsg.content, lastMessageTime: newMsg.created_at } : c
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || !staffInfo || sendingMessage) return;

    setSendingMessage(true);
    try {
      const message = {
        company_id: staffInfo.company_id,
        sender_id: staffInfo.id,
        sender_type: 'staff',
        receiver_id: selectedContact.id,
        receiver_type: selectedContact.type,
        content: newMessage.trim()
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMessages(prev => [...prev, data]);
        setNewMessage("");
        
        // Update contact's last message
        setContacts(prev => prev.map(c => 
          c.id === selectedContact.id 
            ? { ...c, lastMessage: data.content, lastMessageTime: data.created_at }
            : c
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Ontem';
    }
    return format(date, 'dd/MM');
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)]">
        <Card className="h-full">
          <div className="flex h-full">
            <div className="w-full md:w-80 border-r p-4 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)]">
      <Card className="h-full overflow-hidden">
        <div className="flex h-full">
          {/* Contacts List */}
          <div className={`w-full md:w-80 border-r flex flex-col ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
            <CardHeader className="border-b p-4 shrink-0">
              <CardTitle className="text-lg">Mensagens</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar conversas..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Nenhum contacto encontrado</p>
                  </div>
                ) : (
                  filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => {
                        setSelectedContact(contact);
                        setShowMobileChat(true);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                        selectedContact?.id === contact.id
                          ? "bg-primary/10"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <Avatar>
                        {contact.avatar && <AvatarImage src={contact.avatar} />}
                        <AvatarFallback className={`${contact.type === 'company' ? 'bg-blue-500/10 text-blue-600' : 'bg-primary/10 text-primary'}`}>
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{contact.name}</span>
                          {contact.lastMessageTime && (
                            <span className="text-xs text-muted-foreground">
                              {formatMessageTime(contact.lastMessageTime)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate">
                            {contact.lastMessage || 'Nenhuma mensagem'}
                          </p>
                          {contact.unreadCount > 0 && (
                            <Badge className="ml-2 h-5 min-w-[20px] p-0 flex items-center justify-center">
                              {contact.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${!showMobileChat ? 'hidden md:flex' : 'flex'}`}>
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="border-b p-4 flex items-center gap-3 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setShowMobileChat(false)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar>
                    {selectedContact.avatar && <AvatarImage src={selectedContact.avatar} />}
                    <AvatarFallback className={`${selectedContact.type === 'company' ? 'bg-blue-500/10 text-blue-600' : 'bg-primary/10 text-primary'}`}>
                      {getInitials(selectedContact.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedContact.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedContact.type === 'company' ? 'Administração' : 'Aluno'}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma mensagem ainda</p>
                        <p className="text-sm">Envie a primeira mensagem!</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isMe = message.sender_type === 'staff' && message.sender_id === staffInfo?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] md:max-w-[60%] rounded-2xl px-4 py-2 ${
                                isMe
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-muted rounded-bl-md"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                                }`}
                              >
                                {format(new Date(message.created_at), 'HH:mm')}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t p-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Escrever mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      className="flex-1"
                      disabled={sendingMessage}
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      size="icon"
                      disabled={!newMessage.trim() || sendingMessage}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Selecione uma conversa</p>
                  <p className="text-sm">Escolha um contacto para iniciar uma conversa</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
