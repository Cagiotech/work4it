import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Send, MessageCircle, User, Building, Paperclip, Smile } from "lucide-react";
import { StudentHeader } from "@/components/student/StudentHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  sender: "user" | "other";
  text: string;
  time: string;
  date?: string;
}

const mockPersonalMessages: Message[] = [
  { id: 1, sender: "other", text: "Olá Maria! Como correu o treino de ontem?", time: "09:30", date: "Hoje" },
  { id: 2, sender: "user", text: "Olá João! Correu muito bem, consegui aumentar o peso no agachamento!", time: "09:45" },
  { id: 3, sender: "other", text: "Excelente! 💪 Continua assim. Para amanhã, lembra-te de fazer o aquecimento completo antes do treino de pernas.", time: "09:47" },
  { id: 4, sender: "user", text: "Combinado! Tenho uma dúvida sobre a alimentação pós-treino...", time: "09:50" },
  { id: 5, sender: "other", text: "Claro, podes perguntar! O que precisas de saber?", time: "09:52" },
];

const mockCompanyMessages: Message[] = [
  { id: 1, sender: "other", text: "Bem-vinda ao Fitness Pro Gym! Qualquer dúvida, estamos aqui para ajudar.", time: "Segunda", date: "05/12/2024" },
  { id: 2, sender: "user", text: "Obrigada! Gostaria de saber os horários das aulas de Yoga.", time: "10:00" },
  { id: 3, sender: "other", text: "As aulas de Yoga são às Terças e Quintas às 18:00, e Sábados às 10:00. Quer que a inscrevamos?", time: "10:15" },
  { id: 4, sender: "user", text: "Sim, por favor! Na aula de Terça.", time: "10:20" },
  { id: 5, sender: "other", text: "Feito! Está inscrita na aula de Yoga de Terça-feira às 18:00 com a instrutora Ana Costa. 🧘‍♀️", time: "10:25" },
];

function ChatWindow({ messages: initialMessages, recipientName, recipientAvatar }: { 
  messages: Message[]; 
  recipientName: string; 
  recipientAvatar: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: messages.length + 1,
      sender: "user",
      text: newMessage,
      time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, message]);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] md:h-[500px]">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-3 md:p-4 border-b border-border">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {recipientAvatar}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-foreground">{recipientName}</p>
          <p className="text-xs text-success">Online</p>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollRef} className="flex-1 p-3 md:p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={message.id}>
              {message.date && (
                <div className="flex justify-center my-4">
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {message.date}
                  </span>
                </div>
              )}
              <div className={cn(
                "flex",
                message.sender === "user" ? "justify-end" : "justify-start"
              )}>
                <div className={cn(
                  "max-w-[85%] md:max-w-[70%] rounded-2xl px-3 md:px-4 py-2 md:py-3",
                  message.sender === "user" 
                    ? "bg-primary text-primary-foreground rounded-br-md" 
                    : "bg-muted text-foreground rounded-bl-md"
                )}>
                  <p className="text-sm">{message.text}</p>
                  <p className={cn(
                    "text-[10px] md:text-xs mt-1",
                    message.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {message.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-3 md:p-4 border-t border-border">
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="hidden md:flex flex-shrink-0">
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Input 
            placeholder="Escreve uma mensagem..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <Button variant="ghost" size="icon" className="hidden md:flex flex-shrink-0">
            <Smile className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button onClick={handleSend} size="icon" className="flex-shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const { t } = useTranslation();

  return (
    <>
      <StudentHeader title={t("student.chat")} />
      
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="w-full md:w-auto grid grid-cols-2 md:flex mb-4">
            <TabsTrigger value="personal" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Personal Trainer</span>
              <span className="sm:hidden">Personal</span>
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Empresa</span>
              <span className="sm:hidden">Ginásio</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <ChatWindow 
                messages={mockPersonalMessages}
                recipientName="João Silva - Personal Trainer"
                recipientAvatar="JS"
              />
            </Card>
          </TabsContent>

          <TabsContent value="company">
            <Card>
              <ChatWindow 
                messages={mockCompanyMessages}
                recipientName="Fitness Pro Gym"
                recipientAvatar="FP"
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
