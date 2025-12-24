import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Settings,
  BarChart3,
  Activity,
  Megaphone,
  Map,
  CreditCard,
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

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Empresas", url: "/admin/companies", icon: Building2 },
  { title: "Planos", url: "/admin/plans", icon: CreditCard },
  { title: "Relatórios", url: "/admin/reports", icon: BarChart3 },
  { title: "Monitorização", url: "/admin/monitoring", icon: Activity },
  { title: "Eventos/Anúncios", url: "/admin/events", icon: Megaphone },
  { title: "Roadmap", url: "/admin/roadmap", icon: Map },
  { title: "Definições", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
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
              <span className="text-lg font-bold text-sidebar-foreground truncate">Admin</span>
            )}
          </div>
          
          {!collapsed && (
            <div className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-sm font-medium text-sidebar-foreground truncate">Super Admin</p>
              <p className="text-xs text-sidebar-foreground/60 mt-0.5 truncate">admin@cagiotech.com</p>
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
        <SidebarGroup className={`flex-1 ${collapsed ? 'px-1' : 'px-2'} pt-2`}>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <NavLink
                        to={item.url}
                        end={item.url === "/admin"}
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
                tooltip={collapsed ? "Terminar Sessão" : undefined}
                className={`flex items-center text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive rounded-lg transition-all duration-200 ${collapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2.5'}`}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Terminar Sessão</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
