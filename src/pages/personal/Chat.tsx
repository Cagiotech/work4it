import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search, Phone, Video, MoreVertical, Paperclip, Smile } from "lucide-react";

const conversations = [
  {
    id: 1,
    name: "Maria Santos",
    lastMessage: "Obrigada pela aula de hoje!",
    time: "10:30",
    unread: 2,
    online: true,
  },
  {
    id: 2,
    name: "Pedro Costa",
    lastMessage: "Podemos remarcar para quinta?",
    time: "09:15",
    unread: 0,
    online: false,
  },
  {
    id: 3,
    name: "Ana Ferreira",
    lastMessage: "Vou enviar as fotos do progresso",
    time: "Ontem",
    unread: 1,
    online: true,
  },
  {
    id: 4,
    name: "João Oliveira",
    lastMessage: "Ok, combinado!",
    time: "Ontem",
    unread: 0,
    online: false,
  },
  {
    id: 5,
    name: "Sofia Rodrigues",
    lastMessage: "Qual é o plano para amanhã?",
    time: "Seg",
    unread: 0,
    online: false,
  },
  {
    id: 6,
    name: "Administração",
    lastMessage: "Reunião de equipa às 15h",
    time: "Seg",
    unread: 0,
    online: true,
    isAdmin: true,
  },
];

const messages = [
  { id: 1, sender: "Maria Santos", content: "Bom dia! Tudo bem?", time: "09:00", isMe: false },
  { id: 2, sender: "me", content: "Bom dia Maria! Tudo ótimo, e contigo?", time: "09:05", isMe: true },
  { id: 3, sender: "Maria Santos", content: "Tudo bem! Estava a pensar na aula de hoje", time: "09:10", isMe: false },
  { id: 4, sender: "Maria Santos", content: "Podemos focar mais em exercícios de core?", time: "09:11", isMe: false },
  { id: 5, sender: "me", content: "Claro! Já tenho um plano preparado com foco em core e estabilização", time: "09:15", isMe: true },
  { id: 6, sender: "me", content: "Vamos trabalhar pranchas, bird dogs e dead bugs", time: "09:16", isMe: true },
  { id: 7, sender: "Maria Santos", content: "Perfeito! Mal posso esperar 💪", time: "09:20", isMe: false },
  { id: 8, sender: "me", content: "Vejo-te às 10h então! Não te esqueças de trazer a garrafa de água", time: "09:25", isMe: true },
  { id: 9, sender: "Maria Santos", content: "Combinado! Até já", time: "09:30", isMe: false },
  { id: 10, sender: "Maria Santos", content: "Obrigada pela aula de hoje!", time: "10:30", isMe: false },
];

export default function PersonalChat() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Logic to send message
      setNewMessage("");
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)]">
      <Card className="h-full">
        <div className="flex h-full">
          {/* Conversations List */}
          <div className={`w-full md:w-80 border-r flex flex-col ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
            <CardHeader className="border-b p-4">
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
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversation(conv);
                      setShowMobileChat(true);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                      selectedConversation.id === conv.id
                        ? "bg-primary/10"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback className={`${conv.isAdmin ? 'bg-blue-500/10 text-blue-600' : 'bg-primary/10 text-primary'}`}>
                          {conv.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      {conv.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{conv.name}</span>
                        <span className="text-xs text-muted-foreground">{conv.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                        {conv.unread > 0 && (
                          <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                            {conv.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${!showMobileChat ? 'hidden md:flex' : 'flex'}`}>
            {/* Chat Header */}
            <div className="border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setShowMobileChat(false)}
                >
                  ←
                </Button>
                <div className="relative">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedConversation.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  {selectedConversation.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{selectedConversation.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.online ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] md:max-w-[60%] rounded-2xl px-4 py-2 ${
                        message.isMe
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {message.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <Smile className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Escrever mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
