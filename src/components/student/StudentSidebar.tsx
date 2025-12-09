import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Dumbbell,
  Apple,
  CreditCard,
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
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/student") {
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
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={t(`student.${item.key}`)}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/student"}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-foreground/70 hover:bg-muted hover:text-foreground"
                      activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{t(`student.${item.key}`)}</span>}
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
