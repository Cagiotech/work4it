import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteAccountRequest {
  companyId: string;
  userId: string;
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

    const { companyId, userId }: DeleteAccountRequest = await req.json();

    // Verify the user owns the company
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, created_by')
      .eq('id', companyId)
      .single();

    if (companyError || !companyData) {
      return new Response(
        JSON.stringify({ error: "Empresa não encontrada" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (companyData.created_by !== user.id) {
      return new Response(
        JSON.stringify({ error: "Não tem permissão para excluir esta empresa" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Deleting company ${companyId} and all associated data...`);

    // Delete all associated data in order (respecting foreign keys)
    
    // 1. Delete signed documents
    await supabaseAdmin
      .from('signed_documents')
      .delete()
      .eq('company_id', companyId);
    console.log('Deleted signed_documents');

    // 2. Get all students for this company
    const { data: students } = await supabaseAdmin
      .from('students')
      .select('id, user_id')
      .eq('company_id', companyId);

    if (students && students.length > 0) {
      const studentIds = students.map(s => s.id);
      
      // Delete student-related data
      await supabaseAdmin.from('student_nutrition_plans').delete().in('student_id', studentIds);
      await supabaseAdmin.from('student_notes').delete().in('student_id', studentIds);
      await supabaseAdmin.from('student_documents').delete().in('student_id', studentIds);
      await supabaseAdmin.from('student_anamnesis').delete().in('student_id', studentIds);
      await supabaseAdmin.from('student_subscriptions').delete().in('student_id', studentIds);
      
      // Delete student auth users
      for (const student of students) {
        if (student.user_id) {
          await supabaseAdmin.auth.admin.deleteUser(student.user_id);
        }
      }
      
      // Delete students
      await supabaseAdmin.from('students').delete().eq('company_id', companyId);
      console.log(`Deleted ${students.length} students and their data`);
    }

    // 3. Get all staff for this company
    const { data: staff } = await supabaseAdmin
      .from('staff')
      .select('id, user_id')
      .eq('company_id', companyId);

    if (staff && staff.length > 0) {
      // Delete staff auth users
      for (const member of staff) {
        if (member.user_id) {
          await supabaseAdmin.auth.admin.deleteUser(member.user_id);
        }
      }
      
      // Delete staff
      await supabaseAdmin.from('staff').delete().eq('company_id', companyId);
      console.log(`Deleted ${staff.length} staff members`);
    }

    // 4. Delete subscription plans
    await supabaseAdmin.from('subscription_plans').delete().eq('company_id', companyId);
    console.log('Deleted subscription_plans');

    // 5. Delete role permissions and roles
    const { data: roles } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('company_id', companyId);

    if (roles && roles.length > 0) {
      const roleIds = roles.map(r => r.id);
      await supabaseAdmin.from('role_permissions').delete().in('role_id', roleIds);
      await supabaseAdmin.from('roles').delete().eq('company_id', companyId);
      console.log('Deleted roles and permissions');
    }

    // 6. Delete profile
    await supabaseAdmin.from('profiles').delete().eq('user_id', userId);
    console.log('Deleted profile');

    // 7. Delete company
    await supabaseAdmin.from('companies').delete().eq('id', companyId);
    console.log('Deleted company');

    // 8. Finally, delete the owner's auth user
    await supabaseAdmin.auth.admin.deleteUser(userId);
    console.log('Deleted owner auth user');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Conta e todos os dados associados foram excluídos com sucesso" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error deleting account:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao excluir conta" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
