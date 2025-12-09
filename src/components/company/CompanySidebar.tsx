import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
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
  LogOut,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  const navigate = useNavigate();
  const collapsed = state === "collapsed";

  // Mock data - will come from backend later
  const userName = "Javysson Oliveira";
  const userRole = "Administrador";
  const studentsCount = 0;

  const isActive = (path: string) => {
    if (path === "/company") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-card flex flex-col">
        {/* Header with user info */}
        <div className="px-4 py-4">
          {!collapsed ? (
            <>
              <h1 className="text-xl font-bold text-foreground">Cagiotech</h1>
              <div className="mt-3">
                <p className="text-sm font-medium text-foreground">{userName}</p>
                <Badge variant="outline" className="mt-1 text-xs">
                  {userRole}
                </Badge>
              </div>
            </>
          ) : (
            <div className="flex justify-center">
              <span className="text-lg font-bold text-primary">C</span>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <SidebarGroup className="flex-1">
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

        {/* Footer with students count and logout */}
        <SidebarFooter className="mt-auto">
          <Separator className="mb-2" />
          
          {/* Students count */}
          <div className="px-4 py-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-foreground/70">
                <Users className="h-4 w-4" />
                {!collapsed && <span>{t("dashboard.students")}</span>}
              </div>
              <span className="text-primary font-semibold">{studentsCount}</span>
            </div>
          </div>

          {/* Logout button */}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                tooltip={t("common.logout")}
                className="flex items-center gap-3 px-4 py-2.5 text-foreground/70 hover:bg-muted hover:text-foreground rounded-lg transition-all duration-200"
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
