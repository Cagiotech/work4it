import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Server, Database, Globe, Clock, AlertTriangle, CheckCircle, RefreshCw, Cpu, HardDrive } from "lucide-react";

const systemStatus = [
  { name: "API Principal", status: "online", uptime: "99.98%", responseTime: "45ms" },
  { name: "Base de Dados", status: "online", uptime: "99.99%", responseTime: "12ms" },
  { name: "Servidor de Ficheiros", status: "online", uptime: "99.95%", responseTime: "85ms" },
  { name: "Serviço de Email", status: "warning", uptime: "98.50%", responseTime: "250ms" },
  { name: "CDN", status: "online", uptime: "100%", responseTime: "15ms" },
];

const recentEvents = [
  { type: "success", message: "Deploy v2.4.1 concluído com sucesso", time: "Há 15 min" },
  { type: "warning", message: "Pico de utilização detectado - 850 req/s", time: "Há 1h" },
  { type: "success", message: "Backup automático concluído", time: "Há 2h" },
  { type: "info", message: "Manutenção programada em 48h", time: "Há 4h" },
  { type: "success", message: "Certificado SSL renovado", time: "Há 6h" },
  { type: "warning", message: "Latência elevada no serviço de email", time: "Há 8h" },
];

const metrics = [
  { name: "CPU", value: 32, unit: "%", icon: Cpu, status: "good" },
  { name: "Memória", value: 68, unit: "%", icon: Server, status: "warning" },
  { name: "Disco", value: 45, unit: "%", icon: HardDrive, status: "good" },
  { name: "Rede", value: 156, unit: "Mb/s", icon: Globe, status: "good" },
];

const activeUsers = [
  { hour: "00:00", users: 45 },
  { hour: "04:00", users: 12 },
  { hour: "08:00", users: 234 },
  { hour: "12:00", users: 456 },
  { hour: "16:00", users: 567 },
  { hour: "20:00", users: 389 },
  { hour: "Agora", users: 342 },
];

export default function AdminMonitoring() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Monitorização</h1>
          <p className="text-muted-foreground text-sm md:text-base">Estado do sistema em tempo real</p>
        </div>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* System Metrics */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <metric.icon className="h-4 w-4" />
                {metric.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1">
                <span className={`text-2xl font-bold ${
                  metric.status === "warning" ? "text-yellow-600" : ""
                }`}>
                  {metric.value}
                </span>
                <span className="text-muted-foreground mb-1">{metric.unit}</span>
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    metric.status === "warning" ? "bg-yellow-500" : "bg-green-500"
                  }`}
                  style={{ width: metric.unit === "%" ? `${metric.value}%` : "60%" }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Services Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Estado dos Serviços
            </CardTitle>
            <CardDescription>Monitorização em tempo real</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemStatus.map((service, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      service.status === "online" ? "bg-green-500" :
                      service.status === "warning" ? "bg-yellow-500" : "bg-red-500"
                    }`} />
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground hidden md:block">{service.uptime}</span>
                    <span className="text-muted-foreground">{service.responseTime}</span>
                    <Badge variant={service.status === "online" ? "default" : "secondary"}>
                      {service.status === "online" ? "Online" : "Aviso"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Eventos Recentes
            </CardTitle>
            <CardDescription>Log de atividades do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEvents.map((event, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    event.type === "success" ? "bg-green-500/5" :
                    event.type === "warning" ? "bg-yellow-500/5" : "bg-blue-500/5"
                  }`}
                >
                  {event.type === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  ) : event.type === "warning" ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                  ) : (
                    <Activity className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{event.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Users Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Utilizadores Ativos
          </CardTitle>
          <CardDescription>Utilizadores online ao longo do dia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end gap-4">
            {activeUsers.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium">{data.users}</span>
                <div
                  className="w-full bg-primary/80 rounded-t-md transition-all hover:bg-primary"
                  style={{ height: `${(data.users / 600) * 150}px` }}
                />
                <span className="text-xs text-muted-foreground">{data.hour}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
