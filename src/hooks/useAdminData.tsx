import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Fetch all companies with stats
export function useAdminCompanies() {
  return useQuery({
    queryKey: ["admin-companies"],
    queryFn: async () => {
      const { data: companies, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get student counts per company
      const { data: students } = await supabase
        .from("students")
        .select("company_id");

      // Get staff counts per company
      const { data: staff } = await supabase
        .from("staff")
        .select("company_id");

      // Get subscription info per company
      const { data: subscriptions } = await supabase
        .from("company_subscriptions")
        .select("company_id, plan_id, status");

      // Get admin plans
      const { data: adminPlans } = await supabase
        .from("admin_plans")
        .select("*");

      // Get financial transactions per company
      const { data: transactions } = await supabase
        .from("financial_transactions")
        .select("company_id, amount, type, status");

      return companies.map((company) => {
        const studentCount = students?.filter((s) => s.company_id === company.id).length || 0;
        const staffCount = staff?.filter((s) => s.company_id === company.id).length || 0;
        const subscription = subscriptions?.find((s) => s.company_id === company.id && s.status === "active");
        const plan = adminPlans?.find((p) => p.id === subscription?.plan_id);
        const companyTransactions = transactions?.filter((t) => t.company_id === company.id) || [];
        const totalRevenue = companyTransactions
          .filter((t) => t.type === "income" && t.status === "paid")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        return {
          ...company,
          studentCount,
          staffCount,
          subscription: plan,
          totalRevenue,
        };
      });
    },
  });
}

// Fetch admin dashboard stats
export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        companiesResult,
        studentsResult,
        staffResult,
        subscriptionsResult,
        adminPlansResult,
      ] = await Promise.all([
        supabase.from("companies").select("id, created_at"),
        supabase.from("students").select("id, status, created_at"),
        supabase.from("staff").select("id, is_active"),
        supabase.from("company_subscriptions").select("status, plan_id"),
        supabase.from("admin_plans").select("id, price"),
      ]);

      const companies = companiesResult.data || [];
      const students = studentsResult.data || [];
      const staff = staffResult.data || [];
      const subscriptions = subscriptionsResult.data || [];
      const adminPlans = adminPlansResult.data || [];

      // Calculate monthly revenue from active subscriptions
      const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
      const monthlyRevenue = activeSubscriptions.reduce((sum, sub) => {
        const plan = adminPlans.find((p) => p.id === sub.plan_id);
        return sum + Number(plan?.price || 0);
      }, 0);

      // Calculate this month's new companies
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const newCompaniesThisMonth = companies.filter(
        (c) => new Date(c.created_at) >= thisMonth
      ).length;

      // Calculate this month's new students
      const newStudentsThisMonth = students.filter(
        (s) => new Date(s.created_at) >= thisMonth
      ).length;

      return {
        totalCompanies: companies.length,
        newCompaniesThisMonth,
        totalStudents: students.length,
        activeStudents: students.filter((s) => s.status === "active").length,
        newStudentsThisMonth,
        totalStaff: staff.length,
        activeStaff: staff.filter((s) => s.is_active).length,
        monthlyRevenue,
        activeSubscriptions: activeSubscriptions.length,
      };
    },
  });
}

// Fetch admin plans (global plans managed by admin)
export function useAdminPlans() {
  return useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_plans")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;

      // Get company counts per plan
      const { data: subscriptions } = await supabase
        .from("company_subscriptions")
        .select("plan_id, status")
        .eq("status", "active");

      return data.map((plan) => ({
        ...plan,
        companyCount: subscriptions?.filter((s) => s.plan_id === plan.id).length || 0,
      }));
    },
  });
}

// Manage admin plans
export function useManagePlans() {
  const queryClient = useQueryClient();

  const createPlan = useMutation({
    mutationFn: async (plan: {
      name: string;
      description?: string;
      price: number;
      billing_cycle: string;
      max_students?: number | null;
      max_staff?: number | null;
      features?: any[];
    }) => {
      const { data, error } = await supabase
        .from("admin_plans")
        .insert(plan)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      toast.success("Plano criado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao criar plano");
    },
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<any>) => {
      const { data, error } = await supabase
        .from("admin_plans")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      toast.success("Plano atualizado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao atualizar plano");
    },
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("admin_plans")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      toast.success("Plano eliminado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao eliminar plano");
    },
  });

  return { createPlan, updatePlan, deletePlan };
}

// Fetch admin banners
export function useAdminBanners() {
  return useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_banners")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

// Manage banners
export function useManageBanners() {
  const queryClient = useQueryClient();

  const createBanner = useMutation({
    mutationFn: async (banner: {
      title: string;
      message: string;
      image_url?: string;
      link_url?: string;
      link_text?: string;
      target_audience: string;
      starts_at?: string;
      ends_at?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("admin_banners")
        .insert({ ...banner, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banner criado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao criar banner");
    },
  });

  const updateBanner = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<any>) => {
      const { data, error } = await supabase
        .from("admin_banners")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banner atualizado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao atualizar banner");
    },
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("admin_banners")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banner eliminado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao eliminar banner");
    },
  });

  return { createBanner, updateBanner, deleteBanner };
}

// Fetch feature suggestions
export function useFeatureSuggestions() {
  return useQuery({
    queryKey: ["feature-suggestions"],
    queryFn: async () => {
      const { data: suggestions, error } = await supabase
        .from("feature_suggestions")
        .select("*, companies(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get vote counts
      const { data: votes } = await supabase
        .from("suggestion_votes")
        .select("suggestion_id, vote_type");

      return suggestions.map((suggestion) => {
        const suggestionVotes = votes?.filter((v) => v.suggestion_id === suggestion.id) || [];
        const upVotes = suggestionVotes.filter((v) => v.vote_type === "up").length;
        const downVotes = suggestionVotes.filter((v) => v.vote_type === "down").length;

        return {
          ...suggestion,
          upVotes,
          downVotes,
          netVotes: upVotes - downVotes,
        };
      });
    },
  });
}

// Manage suggestions
export function useManageSuggestions() {
  const queryClient = useQueryClient();

  const updateSuggestion = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<any>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = { ...updates };
      if (updates.status === "approved" && !updates.approved_at) {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user?.id;
      }

      const { data, error } = await supabase
        .from("feature_suggestions")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-suggestions"] });
      toast.success("Sugestão atualizada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao atualizar sugestão");
    },
  });

  return { updateSuggestion };
}

// Fetch all users (profiles + students + staff)
export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [profilesResult, studentsResult, staffResult] = await Promise.all([
        supabase.from("profiles").select("*, companies(name)"),
        supabase.from("students").select("id, user_id, full_name, email, status, company_id, companies(name)"),
        supabase.from("staff").select("id, user_id, full_name, email, is_active, position, company_id, companies(name)"),
      ]);

      const profiles = profilesResult.data || [];
      const students = studentsResult.data || [];
      const staff = staffResult.data || [];

      const users: any[] = [];

      // Add company owners from profiles
      profiles.forEach((profile) => {
        if (profile.company_id) {
          users.push({
            id: profile.id,
            user_id: profile.user_id,
            name: profile.full_name || "Sem nome",
            email: "-",
            role: "Admin Empresa",
            company: (profile.companies as any)?.name || "-",
            status: "Ativo",
            type: "profile",
          });
        }
      });

      // Add students
      students.forEach((student) => {
        users.push({
          id: student.id,
          user_id: student.user_id,
          name: student.full_name,
          email: student.email,
          role: "Aluno",
          company: (student.companies as any)?.name || "-",
          status: student.status === "active" ? "Ativo" : "Inativo",
          type: "student",
        });
      });

      // Add staff
      staff.forEach((member) => {
        users.push({
          id: member.id,
          user_id: member.user_id,
          name: member.full_name,
          email: member.email,
          role: member.position || "Staff",
          company: (member.companies as any)?.name || "-",
          status: member.is_active ? "Ativo" : "Inativo",
          type: "staff",
        });
      });

      return users;
    },
  });
}
