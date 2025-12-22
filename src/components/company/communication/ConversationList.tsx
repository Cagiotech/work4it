import { useState, useEffect } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Search, Users, User, Building2, Pin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  name: string;
  type: 'student' | 'staff' | 'company';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  loading?: boolean;
}

export function ConversationList({ conversations, selectedId, onSelect, loading }: ConversationListProps) {
  const [search, setSearch] = useState("");
  
  const filtered = conversations.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return format(date, "HH:mm");
    } else if (diffDays === 1) {
      return "Ontem";
    } else if (diffDays < 7) {
      return format(date, "EEEE", { locale: pt });
    } else {
      return format(date, "dd/MM/yyyy");
    }
  };

  return (
    <div className="flex flex-col h-full border-r border-border">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar conversas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelect(conversation)}
                className={cn(
                  "flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                  selectedId === conversation.id && "bg-muted",
                  conversation.type === 'company' && "border-l-2 border-l-primary bg-primary/5"
                )}
              >
                <Avatar className="h-12 w-12">
                  <AvatarFallback className={cn(
                    "text-sm font-medium",
                    conversation.type === 'company' 
                      ? "bg-primary text-primary-foreground" 
                      : conversation.type === 'student' 
                        ? "bg-primary/10 text-primary" 
                        : "bg-secondary/50 text-secondary-foreground"
                  )}>
                    {conversation.type === 'company' ? (
                      <Building2 className="h-5 w-5" />
                    ) : (
                      getInitials(conversation.name)
                    )}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium truncate">{conversation.name}</span>
                      {conversation.type === 'company' && (
                        <Pin className="h-3 w-3 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {conversation.lastMessageTime && formatTime(conversation.lastMessageTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage || "Sem mensagens"}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <Badge className="h-5 min-w-5 flex items-center justify-center rounded-full text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
