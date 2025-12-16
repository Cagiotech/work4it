import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Dumbbell,
  Apple,
  CreditCard,
  MessageCircle,
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
  { key: "dashboard", icon: LayoutDashboard, url: "/student" },
  { key: "classes", icon: Calendar, url: "/student/classes" },
  { key: "plans", icon: Dumbbell, url: "/student/plans" },
  { key: "nutrition", icon: Apple, url: "/student/nutrition" },
  { key: "payments", icon: CreditCard, url: "/student/payments" },
  { key: "chat", icon: MessageCircle, url: "/student/chat" },
  { key: "settings", icon: Settings, url: "/student/settings" },
];

export function StudentSidebar() {
  const { t } = useTranslation();
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/student") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-gradient-sidebar flex flex-col">
        {/* Header with logo */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
                <img src={logoLight} alt="Cagiotech" className="h-6" />
              </div>
              {!collapsed && (
                <span className="text-lg font-bold text-sidebar-foreground">Cagiotech</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </Button>
          </div>
          
          {!collapsed && user && (
            <div className="mt-4 p-3 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
              <p className="text-sm font-medium text-sidebar-foreground">Área do Aluno</p>
              <p className="text-xs text-sidebar-foreground/60 mt-0.5">{user.email}</p>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <SidebarGroup className="flex-1 px-3">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={t(`student.${item.key}`)}
                    >
                      <NavLink
                        to={item.url}
                        end={item.url === "/student"}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                          active 
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-lg shadow-sidebar-primary/25' 
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                        }`}
                        activeClassName=""
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span>{t(`student.${item.key}`)}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer with logout */}
        <SidebarFooter className="p-3">
          <Separator className="mb-3 bg-sidebar-border" />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                tooltip={t("common.logout")}
                className="flex items-center gap-3 px-3 py-2.5 text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive rounded-lg transition-all duration-200"
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
