import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Search, ArrowLeft, MessageCircle, MessageSquare, Users, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  type: 'staff' | 'company';
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

export default function StudentChat() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<{ id: string; company_id: string; personal_trainer_id: string | null } | null>(null);
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

  useEffect(() => {
    if (studentInfo) {
      const cleanup = subscribeToMessages();
      return cleanup;
    }
  }, [studentInfo, selectedContact]);

  useEffect(() => {
    if (selectedContact && studentInfo) {
      loadMessages(selectedContact);
    }
  }, [selectedContact, studentInfo]);

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

      const { data: student } = await supabase
        .from('students')
        .select('id, company_id, personal_trainer_id')
        .eq('user_id', user.id)
        .single();

      if (!student) {
        navigate('/login');
        return;
      }

      setStudentInfo(student);

      const contactsList: Contact[] = [];

      const { data: company } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', student.company_id)
        .single();

      if (company) {
        contactsList.push({
          id: company.id,
          name: company.name || 'Administração',
          type: 'company',
          unreadCount: 0
        });
      }

      if (student.personal_trainer_id) {
        const { data: trainer } = await supabase
          .from('staff')
          .select('id, full_name')
          .eq('id', student.personal_trainer_id)
          .single();

        if (trainer) {
          contactsList.push({
            id: trainer.id,
            name: trainer.full_name,
            type: 'staff',
            unreadCount: 0
          });
        }
      }

      for (const contact of contactsList) {
        const myId = student.id;
        const theirId = contact.id;
        const theirType = contact.type;

        let lastMsgQuery;
        let unreadQuery;

        if (theirType === 'company') {
          // Messages with company
          lastMsgQuery = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('company_id', student.company_id)
            .or(`and(sender_id.eq.${myId},sender_type.eq.student,receiver_type.eq.company),and(sender_type.eq.company,receiver_id.eq.${myId},receiver_type.eq.student)`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          unreadQuery = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', myId)
            .eq('receiver_type', 'student')
            .eq('sender_type', 'company')
            .eq('is_read', false);
        } else {
          // Messages with staff (personal trainer)
          lastMsgQuery = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('company_id', student.company_id)
            .or(`and(sender_id.eq.${myId},receiver_id.eq.${theirId}),and(sender_id.eq.${theirId},receiver_id.eq.${myId})`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          unreadQuery = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', myId)
            .eq('receiver_type', 'student')
            .eq('sender_id', theirId)
            .eq('is_read', false);
        }

        if (lastMsgQuery.data) {
          contact.lastMessage = lastMsgQuery.data.content;
          contact.lastMessageTime = lastMsgQuery.data.created_at;
        }

        contact.unreadCount = unreadQuery.count || 0;
      }

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
    if (!studentInfo) return;

    const myId = studentInfo.id;
    const theirId = contact.id;
    const theirType = contact.type;

    let query;

    if (theirType === 'company') {
      // Messages with company
      query = await supabase
        .from('messages')
        .select('*')
        .eq('company_id', studentInfo.company_id)
        .or(`and(sender_id.eq.${myId},sender_type.eq.student,receiver_type.eq.company),and(sender_type.eq.company,receiver_id.eq.${myId},receiver_type.eq.student)`)
        .order('created_at', { ascending: true });
    } else {
      // Messages with staff
      query = await supabase
        .from('messages')
        .select('*')
        .eq('company_id', studentInfo.company_id)
        .or(`and(sender_id.eq.${myId},receiver_id.eq.${theirId}),and(sender_id.eq.${theirId},receiver_id.eq.${myId})`)
        .order('created_at', { ascending: true });
    }

    if (query.data) {
      setMessages(query.data);

      const unreadIds = query.data
        .filter(m => !m.is_read && m.receiver_id === myId && m.receiver_type === 'student')
        .map(m => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in('id', unreadIds);
      }

      setContacts(prev => prev.map(c =>
        c.id === contact.id && c.type === contact.type ? { ...c, unreadCount: 0 } : c
      ));
    }
  };

  const subscribeToMessages = () => {
    if (!studentInfo) return;

    const channel = supabase
      .channel('student-messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `company_id=eq.${studentInfo.company_id}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          
          const isForMe = (newMsg.receiver_id === studentInfo.id && newMsg.receiver_type === 'student') ||
                          (newMsg.sender_id === studentInfo.id && newMsg.sender_type === 'student');
          
          if (!isForMe) return;

          // Check if message is for selected contact
          const isForSelectedContact = selectedContact && (
            (selectedContact.type === 'company' && (newMsg.sender_type === 'company' || newMsg.receiver_type === 'company')) ||
            (selectedContact.type !== 'company' && (newMsg.sender_id === selectedContact.id || newMsg.receiver_id === selectedContact.id))
          );

          if (isForSelectedContact) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            
            // Mark as read if received
            if (newMsg.receiver_id === studentInfo.id && newMsg.receiver_type === 'student') {
              supabase
                .from('messages')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('id', newMsg.id);
            }
          } else if (newMsg.receiver_id === studentInfo.id && newMsg.receiver_type === 'student') {
            // Update unread count for the contact
            const senderType = newMsg.sender_type;
            setContacts(prev => prev.map(c => {
              if (senderType === 'company' && c.type === 'company') {
                return { ...c, unreadCount: c.unreadCount + 1, lastMessage: newMsg.content, lastMessageTime: newMsg.created_at };
              } else if (c.id === newMsg.sender_id) {
                return { ...c, unreadCount: c.unreadCount + 1, lastMessage: newMsg.content, lastMessageTime: newMsg.created_at };
              }
              return c;
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || !studentInfo || sendingMessage) return;

    setSendingMessage(true);
    try {
      // For company, receiver_id should be company_id
      const receiverId = selectedContact.type === 'company' 
        ? studentInfo.company_id 
        : selectedContact.id;

      const message = {
        company_id: studentInfo.company_id,
        sender_id: studentInfo.id,
        sender_type: 'student',
        receiver_id: receiverId,
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

        setContacts(prev => prev.map(c =>
          c.id === selectedContact.id && c.type === selectedContact.type
            ? { ...c, lastMessage: data.content, lastMessageTime: data.created_at }
            : c
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Não foi possível enviar a mensagem");
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
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Mensagens</h2>
        <Card className="h-[calc(100vh-220px)]">
          <div className="flex h-full">
            <div className="w-full md:w-80 border-r p-4 space-y-4">
              <Skeleton className="h-10 w-full" />
              {[1, 2, 3].map(i => (
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
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Mensagens</h2>
      
      <Card className="h-[calc(100vh-220px)] overflow-hidden">
        <div className="flex h-full">
          {/* Contacts List */}
          <div className={`w-full md:w-80 border-r flex flex-col ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Conversas
                </h3>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
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
                    <AvatarFallback className={`${selectedContact.type === 'company' ? 'bg-blue-500/10 text-blue-600' : 'bg-primary/10 text-primary'}`}>
                      {getInitials(selectedContact.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedContact.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedContact.type === 'company' ? 'Administração' : 'Personal Trainer'}
                    </p>
                  </div>
                </div>

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
                        const isMe = message.sender_type === 'student' && message.sender_id === studentInfo?.id;
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

                <div className="border-t p-4 shrink-0">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Escreva uma mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={sendingMessage}
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={!newMessage.trim() || sendingMessage}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Users className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-lg">Selecione uma conversa</p>
                <p className="text-sm">para ver as mensagens</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
