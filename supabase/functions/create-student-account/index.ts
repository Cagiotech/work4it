import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateStudentRequest {
  email: string;
  fullName: string;
  studentId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
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

    const { email, fullName, studentId }: CreateStudentRequest = await req.json();

    console.log(`Creating account for student: ${email}`);

    // Create the user with temporary password
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: "12345678",
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "student",
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      
      // Check if user already exists
      if (createError.message.includes("already been registered")) {
        return new Response(
          JSON.stringify({ 
            error: "Email já registado no sistema",
            code: "USER_EXISTS"
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      throw createError;
    }

    console.log(`User created successfully: ${userData.user?.id}`);

    // Update the student record with the user_id
    const { error: updateError } = await supabaseAdmin
      .from("students")
      .update({ 
        user_id: userData.user?.id,
        password_changed: false 
      })
      .eq("id", studentId);

    if (updateError) {
      console.error("Error updating student:", updateError);
      // Try to delete the created user if we can't link it
      await supabaseAdmin.auth.admin.deleteUser(userData.user!.id);
      throw updateError;
    }

    console.log(`Student ${studentId} linked to user ${userData.user?.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: userData.user?.id,
        message: "Conta criada com sucesso. Senha temporária: 12345678"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in create-student-account:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
