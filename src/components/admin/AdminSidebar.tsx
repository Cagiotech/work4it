import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  Settings,
  BarChart3,
  Activity,
  Megaphone,
  Map,
  CreditCard,
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

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Utilizadores", url: "/admin/users", icon: Users },
  { title: "Empresas", url: "/admin/companies", icon: Building2 },
  { title: "Planos", url: "/admin/plans", icon: CreditCard },
  { title: "Permissões", url: "/admin/permissions", icon: Shield },
  { title: "Relatórios", url: "/admin/reports", icon: BarChart3 },
  { title: "Monitorização", url: "/admin/monitoring", icon: Activity },
  { title: "Eventos/Anúncios", url: "/admin/events", icon: Megaphone },
  { title: "Roadmap", url: "/admin/roadmap", icon: Map },
  { title: "Definições", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarContent className="bg-card">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-3">
            {!collapsed && (
              <span className="text-lg font-bold text-primary">Administração</span>
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
                      end={item.url === "/admin"}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-accent/50"
                      activeClassName="bg-primary/10 text-primary font-medium border-l-2 border-primary"
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
