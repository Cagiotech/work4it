import { useTranslation } from "react-i18next";
import { Send, Mail, MessageSquare, Bell, Plus } from "lucide-react";
import { CompanyHeader } from "@/components/company/CompanyHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const mockMessages = [
  { id: 1, sender: "Maria Santos", subject: "Dúvida sobre aula", time: "10:30", read: false },
  { id: 2, sender: "Pedro Costa", subject: "Alteração de horário", time: "09:15", read: true },
  { id: 3, sender: "Ana Rodrigues", subject: "Pagamento", time: "Ontem", read: true },
];

const mockNotifications = [
  { id: 1, title: "Aula cancelada", message: "Yoga das 08:00 foi cancelada", time: "5 min" },
  { id: 2, title: "Novo aluno", message: "João Silva inscreveu-se no plano Premium", time: "1 hora" },
  { id: 3, title: "Pagamento atrasado", message: "3 alunos com pagamentos pendentes", time: "2 horas" },
];

export default function Communication() {
  const { t } = useTranslation();

  return (
    <>
      <CompanyHeader title={t("dashboard.communication")} />
      
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="messages" className="w-full">
          <TabsList>
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensagens
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="compose" className="gap-2">
              <Send className="h-4 w-4" />
              Enviar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Caixa de Entrada
                </CardTitle>
                <Badge>3 novas</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer ${!msg.read ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${!msg.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {msg.sender}
                        </span>
                        <span className="text-xs text-muted-foreground">{msg.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{msg.subject}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notificações do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockNotifications.map((notif) => (
                    <div key={notif.id} className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{notif.title}</h4>
                        <p className="text-sm text-muted-foreground">{notif.message}</p>
                        <span className="text-xs text-muted-foreground">{notif.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compose" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Nova Mensagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Para</label>
                  <Input placeholder="Selecionar destinatários..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Assunto</label>
                  <Input placeholder="Assunto da mensagem..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Mensagem</label>
                  <Textarea 
                    placeholder="Escreva a sua mensagem..." 
                    className="min-h-[200px]"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline">Cancelar</Button>
                  <Button className="gap-2">
                    <Send className="h-4 w-4" />
                    Enviar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
