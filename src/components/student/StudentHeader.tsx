import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Bell, User, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface StudentInfo {
  full_name: string;
  email: string | null;
}

export function StudentHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentInfo | null>(null);

  useEffect(() => {
    const fetchStudentInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('students')
        .select('full_name, email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setStudent(data);
      }
    };

    fetchStudentInfo();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 md:h-16 items-center gap-2 md:gap-4 px-3 md:px-6">
        <SidebarTrigger className="md:hidden">
          <Menu className="h-5 w-5" />
        </SidebarTrigger>

        <div className="flex-1" />

        <div className="flex items-center gap-2 md:gap-4">
          <LanguageSwitcher />
          <ThemeSwitcher />
          
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {student ? getInitials(student.full_name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium">{student?.full_name || "Aluno"}</p>
                <p className="text-xs text-muted-foreground">{student?.email || ""}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/student/settings")}>
                <User className="mr-2 h-4 w-4" />
                <span>{t("common.profile")}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t("common.logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
