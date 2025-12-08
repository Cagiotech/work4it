import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Calendar,
  Dumbbell,
  Settings,
  ChevronLeft,
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
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logoLight from "@/assets/logo-light.png";

const menuItems = [
  { key: "dashboard", icon: LayoutDashboard, url: "/student" },
  { key: "classes", icon: Calendar, url: "/student/classes" },
  { key: "plans", icon: Dumbbell, url: "/student/plans" },
  { key: "settings", icon: Settings, url: "/student/settings" },
];

export function StudentSidebar() {
  const { t } = useTranslation();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar
      className={cn(
        "border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <img src={logoLight} alt="Cagiotech" className="h-8" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/student"}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200",
                        collapsed && "justify-center px-2"
                      )}
                      activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-primary"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="font-medium">
                          {t(`student.${item.key}`)}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className={cn(
            "w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-destructive",
            collapsed ? "justify-center px-2" : "justify-start gap-3"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>{t("common.logout")}</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
