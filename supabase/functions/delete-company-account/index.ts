import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteAccountRequest {
  companyId: string;
  userId?: string;
  forceDelete?: boolean; // For admin use only
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get authorization header to verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the user's token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { companyId, userId, forceDelete = false }: DeleteAccountRequest = await req.json();

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: "ID da empresa é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin
    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    const isAdmin = !!adminRole;

    // Verify the company exists
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, created_by, name')
      .eq('id', companyId)
      .single();

    if (companyError || !companyData) {
      return new Response(
        JSON.stringify({ error: "Empresa não encontrada" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Only owner or admin can delete
    if (companyData.created_by !== user.id && !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Não tem permissão para excluir esta empresa" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check for pending payments/invoices (block if exists, unless force delete)
    if (!forceDelete) {
      // Check pending invoices from platform
      const { data: pendingInvoices } = await supabaseAdmin
        .from('admin_invoices')
        .select('id, amount')
        .eq('company_id', companyId)
        .eq('status', 'pending');

      if (pendingInvoices && pendingInvoices.length > 0) {
        const totalPending = pendingInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
        return new Response(
          JSON.stringify({ 
            error: `Empresa tem ${pendingInvoices.length} fatura(s) pendente(s) no valor de €${totalPending.toFixed(2)}. Regularize antes de excluir.`,
            code: 'PENDING_INVOICES',
            pendingCount: pendingInvoices.length,
            pendingAmount: totalPending
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check pending financial transactions (student payments)
      const { data: pendingTransactions } = await supabaseAdmin
        .from('financial_transactions')
        .select('id, amount, type')
        .eq('company_id', companyId)
        .eq('status', 'pending')
        .eq('type', 'income');

      if (pendingTransactions && pendingTransactions.length > 0) {
        const totalPending = pendingTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        return new Response(
          JSON.stringify({ 
            error: `Empresa tem ${pendingTransactions.length} pagamento(s) pendente(s) de alunos no valor de €${totalPending.toFixed(2)}. Resolva antes de excluir.`,
            code: 'PENDING_PAYMENTS',
            pendingCount: pendingTransactions.length,
            pendingAmount: totalPending
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // ============================================
    // DELETE ALL ASSOCIATED DATA IN CORRECT ORDER
    // ============================================

    // 1. Get all students and staff first (we'll need their IDs)
    const { data: students } = await supabaseAdmin
      .from('students')
      .select('id, user_id')
      .eq('company_id', companyId);

    const { data: staff } = await supabaseAdmin
      .from('staff')
      .select('id, user_id')
      .eq('company_id', companyId);

    const studentIds = students?.map(s => s.id) || [];
    const staffIds = staff?.map(s => s.id) || [];

    // 2. Delete student-related data
    if (studentIds.length > 0) {
      // Nutrition plans and related
      const { data: mealPlans } = await supabaseAdmin
        .from('nutrition_meal_plans')
        .select('id')
        .in('student_id', studentIds);
      
      if (mealPlans && mealPlans.length > 0) {
        const planIds = mealPlans.map(p => p.id);
        const { data: planDays } = await supabaseAdmin
          .from('nutrition_plan_days')
          .select('id')
          .in('plan_id', planIds);
        
        if (planDays && planDays.length > 0) {
          await supabaseAdmin.from('nutrition_plan_meals').delete().in('day_id', planDays.map(d => d.id));
        }
        await supabaseAdmin.from('nutrition_plan_days').delete().in('plan_id', planIds);
        await supabaseAdmin.from('nutrition_meal_plans').delete().in('student_id', studentIds);
      }

      // Training plans
      const { data: trainingPlans } = await supabaseAdmin
        .from('training_plans')
        .select('id')
        .in('student_id', studentIds);
      
      if (trainingPlans && trainingPlans.length > 0) {
        const planIds = trainingPlans.map(p => p.id);
        const { data: planDays } = await supabaseAdmin
          .from('training_plan_days')
          .select('id')
          .in('plan_id', planIds);
        
        if (planDays && planDays.length > 0) {
          await supabaseAdmin.from('training_plan_exercises').delete().in('day_id', planDays.map(d => d.id));
        }
        await supabaseAdmin.from('training_plan_days').delete().in('plan_id', planIds);
        await supabaseAdmin.from('training_plans').delete().in('student_id', studentIds);
      }

      // Student subscriptions and payments
      const { data: studentSubs } = await supabaseAdmin
        .from('student_subscriptions')
        .select('id')
        .in('student_id', studentIds);
      
      if (studentSubs && studentSubs.length > 0) {
        await supabaseAdmin.from('subscription_payments').delete().in('subscription_id', studentSubs.map(s => s.id));
        await supabaseAdmin.from('payment_proofs').delete().in('subscription_id', studentSubs.map(s => s.id));
      }
      await supabaseAdmin.from('student_subscriptions').delete().in('student_id', studentIds);

      // Other student data
      await supabaseAdmin.from('payment_proofs').delete().in('student_id', studentIds);
      await supabaseAdmin.from('student_nutrition_plans').delete().in('student_id', studentIds);
      await supabaseAdmin.from('student_notes').delete().in('student_id', studentIds);
      await supabaseAdmin.from('student_documents').delete().in('student_id', studentIds);
      await supabaseAdmin.from('student_anamnesis').delete().in('student_id', studentIds);
      await supabaseAdmin.from('signed_documents').delete().in('student_id', studentIds);
      await supabaseAdmin.from('student_classes').delete().in('student_id', studentIds);
      await supabaseAdmin.from('student_group_members').delete().in('student_id', studentIds);
      await supabaseAdmin.from('class_enrollments').delete().in('student_id', studentIds);
      await supabaseAdmin.from('student_category_assignments').delete().in('student_id', studentIds);

      // Delete student auth users
      for (const student of students || []) {
        if (student.user_id) {
          try {
            await supabaseAdmin.auth.admin.deleteUser(student.user_id);
          } catch (e) {
            // User might already be deleted
          }
        }
      }

      // Delete students
      await supabaseAdmin.from('students').delete().eq('company_id', companyId);
    }

    // 3. Delete staff-related data
    if (staffIds.length > 0) {
      await supabaseAdmin.from('staff_payment_config').delete().in('staff_id', staffIds);
      await supabaseAdmin.from('staff_documents').delete().in('staff_id', staffIds);
      await supabaseAdmin.from('staff_evaluations').delete().in('staff_id', staffIds);
      await supabaseAdmin.from('staff_trainings').delete().in('staff_id', staffIds);
      await supabaseAdmin.from('staff_absences').delete().in('staff_id', staffIds);
      await supabaseAdmin.from('staff_leave_balances').delete().in('staff_id', staffIds);
      await supabaseAdmin.from('staff_time_records').delete().in('staff_id', staffIds);
      await supabaseAdmin.from('staff_work_schedules').delete().in('staff_id', staffIds);
      await supabaseAdmin.from('staff_classes').delete().in('staff_id', staffIds);

      // Delete staff auth users
      for (const member of staff || []) {
        if (member.user_id) {
          try {
            await supabaseAdmin.auth.admin.deleteUser(member.user_id);
          } catch (e) {
            // User might already be deleted
          }
        }
      }

      await supabaseAdmin.from('staff').delete().eq('company_id', companyId);
    }

    // 4. Delete class-related data
    const { data: classes } = await supabaseAdmin
      .from('classes')
      .select('id')
      .eq('company_id', companyId);
    
    if (classes && classes.length > 0) {
      const classIds = classes.map(c => c.id);
      await supabaseAdmin.from('class_enrollments').delete().in('class_schedule_id', 
        (await supabaseAdmin.from('class_schedules').select('id').in('class_id', classIds)).data?.map(s => s.id) || []
      );
      await supabaseAdmin.from('class_schedules').delete().in('class_id', classIds);
      await supabaseAdmin.from('classes').delete().eq('company_id', companyId);
    }

    // 5. Delete financial data
    await supabaseAdmin.from('financial_transactions').delete().eq('company_id', companyId);
    await supabaseAdmin.from('financial_categories').delete().eq('company_id', companyId);

    // 6. Delete shop data
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('company_id', companyId);
    
    if (products && products.length > 0) {
      await supabaseAdmin.from('inventory_movements').delete().in('product_id', products.map(p => p.id));
    }
    
    const { data: sales } = await supabaseAdmin
      .from('sales')
      .select('id')
      .eq('company_id', companyId);
    
    if (sales && sales.length > 0) {
      await supabaseAdmin.from('sale_items').delete().in('sale_id', sales.map(s => s.id));
    }
    
    await supabaseAdmin.from('sales').delete().eq('company_id', companyId);
    await supabaseAdmin.from('products').delete().eq('company_id', companyId);
    await supabaseAdmin.from('product_categories').delete().eq('company_id', companyId);

    // 7. Delete equipment data
    const { data: equipment } = await supabaseAdmin
      .from('equipment')
      .select('id')
      .eq('company_id', companyId);
    
    if (equipment && equipment.length > 0) {
      await supabaseAdmin.from('equipment_maintenance').delete().in('equipment_id', equipment.map(e => e.id));
    }
    await supabaseAdmin.from('equipment').delete().eq('company_id', companyId);
    await supabaseAdmin.from('equipment_categories').delete().eq('company_id', companyId);

    // 8. Delete roles and permissions
    const { data: roles } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('company_id', companyId);

    if (roles && roles.length > 0) {
      await supabaseAdmin.from('role_permissions').delete().in('role_id', roles.map(r => r.id));
      await supabaseAdmin.from('roles').delete().eq('company_id', companyId);
    }

    // 9. Delete other company data
    await supabaseAdmin.from('rooms').delete().eq('company_id', companyId);
    await supabaseAdmin.from('events').delete().eq('company_id', companyId);
    await supabaseAdmin.from('messages').delete().eq('company_id', companyId);
    await supabaseAdmin.from('notifications').delete().eq('company_id', companyId);
    await supabaseAdmin.from('subscription_plans').delete().eq('company_id', companyId);
    await supabaseAdmin.from('exercise_library').delete().eq('company_id', companyId);
    await supabaseAdmin.from('training_exercises').delete().eq('company_id', companyId);
    await supabaseAdmin.from('student_groups').delete().eq('company_id', companyId);
    await supabaseAdmin.from('student_categories').delete().eq('company_id', companyId);
    await supabaseAdmin.from('feature_suggestions').delete().eq('company_id', companyId);
    await supabaseAdmin.from('password_reset_requests').delete().eq('company_id', companyId);

    // 10. Delete company subscriptions and admin data
    await supabaseAdmin.from('company_subscriptions').delete().eq('company_id', companyId);
    await supabaseAdmin.from('admin_invoices').delete().eq('company_id', companyId);
    await supabaseAdmin.from('admin_company_logs').delete().eq('company_id', companyId);

    // 11. Delete profile of owner
    await supabaseAdmin.from('profiles').delete().eq('company_id', companyId);

    // 12. Delete company
    const { error: deleteCompanyError } = await supabaseAdmin
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (deleteCompanyError) {
      throw new Error(`Erro ao excluir empresa: ${deleteCompanyError.message}`);
    }

    // 13. Delete owner's auth user (only if userId provided and it's the owner deleting their own account)
    if (userId && companyData.created_by === userId) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (e) {
        // Owner user might not exist or was already deleted
      }
    }

    // Log the action for admin audit
    if (isAdmin) {
      await supabaseAdmin.from('admin_audit_logs').insert({
        admin_id: user.id,
        action_type: 'delete_company',
        target_type: 'company',
        target_id: companyId,
        details: { company_name: companyData.name, force_delete: forceDelete }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Empresa "${companyData.name}" e todos os dados associados foram excluídos com sucesso` 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);