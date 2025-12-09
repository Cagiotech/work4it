import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Dumbbell,
  Apple,
  DollarSign,
  ClipboardCheck,
  MessageCircle,
  Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import logoLight from "@/assets/logo-light.png";

const menuItems = [
  { title: "Dashboard", url: "/personal", icon: LayoutDashboard },
  { title: "Meus Alunos", url: "/personal/students", icon: Users },
  { title: "Agenda", url: "/personal/schedule", icon: Calendar },
  { title: "Planos de Treino", url: "/personal/training-plans", icon: Dumbbell },
  { title: "Planos Nutricionais", url: "/personal/nutrition", icon: Apple },
  { title: "Financeiro", url: "/personal/financial", icon: DollarSign },
  { title: "Lista de Presença", url: "/personal/attendance", icon: ClipboardCheck },
  { title: "Mensagens", url: "/personal/chat", icon: MessageCircle },
  { title: "Definições", url: "/personal/settings", icon: Settings },
];

export function PersonalSidebar() {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/personal") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-card">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-3">
            {!collapsed && (
              <img src={logoLight} alt="Cagiotech" className="h-8" />
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/personal"}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-foreground/70 hover:bg-muted hover:text-foreground"
                      activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
