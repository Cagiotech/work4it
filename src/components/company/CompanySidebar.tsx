import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Calendar,
  MessageSquare,
  DollarSign,
  Dumbbell,
  ShoppingBag,
  CalendarDays,
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
  { key: "dashboard", icon: LayoutDashboard, url: "/company" },
  { key: "students", icon: Users, url: "/company/students" },
  { key: "hr", icon: UserCog, url: "/company/hr" },
  { key: "classes", icon: Calendar, url: "/company/classes" },
  { key: "communication", icon: MessageSquare, url: "/company/communication" },
  { key: "financial", icon: DollarSign, url: "/company/financial" },
  { key: "equipment", icon: Dumbbell, url: "/company/equipment" },
  { key: "shop", icon: ShoppingBag, url: "/company/shop" },
  { key: "events", icon: CalendarDays, url: "/company/events" },
  { key: "settings", icon: Settings, url: "/company/settings" },
];

export function CompanySidebar() {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/company") {
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
                    tooltip={t(`dashboard.${item.key === "dashboard" ? "title" : item.key}`)}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/company"}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-foreground/70 hover:bg-muted hover:text-foreground"
                      activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <span>{t(`dashboard.${item.key === "dashboard" ? "title" : item.key}`)}</span>
                      )}
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
