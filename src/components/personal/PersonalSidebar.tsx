import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Dumbbell,
  Apple,
  DollarSign,
  ClipboardCheck,
  MessageCircle,
  CalendarDays,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import logoLight from "@/assets/logo-light.png";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  { key: "dashboard", title: "Dashboard", url: "/personal", icon: LayoutDashboard },
  { key: "students", title: "Meus Alunos", url: "/personal/students", icon: Users },
  { key: "schedule", title: "Agenda", url: "/personal/schedule", icon: Calendar },
  { key: "training", title: "Planos de Treino", url: "/personal/training-plans", icon: Dumbbell },
  { key: "nutrition", title: "Planos Nutricionais", url: "/personal/nutrition", icon: Apple },
  { key: "financial", title: "Financeiro", url: "/personal/financial", icon: DollarSign },
  { key: "attendance", title: "Lista de Presença", url: "/personal/attendance", icon: ClipboardCheck },
  { key: "chat", title: "Mensagens", url: "/personal/chat", icon: MessageCircle },
  { key: "events", title: "Eventos", url: "/personal/events", icon: CalendarDays },
  { key: "settings", title: "Definições", url: "/personal/settings", icon: Settings },
];

export function PersonalSidebar() {
  const { t } = useTranslation();
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user, profile } = useAuth();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/personal") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border h-screen">
      <SidebarContent className="bg-sidebar flex flex-col h-full overflow-hidden">
        {/* Header with logo */}
        <div className={`p-3 shrink-0 ${collapsed ? 'flex flex-col items-center' : ''}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <img src={logoLight} alt="Cagiotech" className="h-6" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold text-sidebar-foreground truncate">Cagiotech</span>
            )}
          </div>
          
          {!collapsed && (
            <div className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{profile?.full_name || 'Personal Trainer'}</p>
              <p className="text-xs text-sidebar-foreground/60 mt-0.5 truncate">{user?.email}</p>
            </div>
          )}
        </div>

        {/* Toggle button */}
        <div className={`px-2 pb-2 shrink-0 ${collapsed ? 'flex justify-center' : ''}`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={`h-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent ${collapsed ? 'w-8' : 'w-full'}`}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span className="ml-2 text-xs">Minimizar</span>}
          </Button>
        </div>

        <Separator className="bg-sidebar-border mx-2 shrink-0" />

        {/* Menu Items - scrollable area */}
        <SidebarGroup className={`flex-1 ${collapsed ? 'px-1' : 'px-2'} pt-2 overflow-y-auto min-h-0`}>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <NavLink
                        to={item.url}
                        end={item.url === "/personal"}
                        className={`flex items-center rounded-lg transition-all duration-200 ${
                          active 
                            ? 'bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20' 
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                        } ${collapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2.5'}`}
                        activeClassName=""
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer with logout */}
        <SidebarFooter className={`${collapsed ? 'px-1' : 'px-2'} pb-2 shrink-0`}>
          <Separator className="mb-2 bg-sidebar-border" />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                tooltip={collapsed ? t("common.logout") : undefined}
                className={`flex items-center text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive rounded-lg transition-all duration-200 ${collapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2.5'}`}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{t("common.logout")}</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
