import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAccountRequest {
  email: string;
  fullName: string;
  recordId: string;
  recordType: "student" | "staff";
}

// Generate a cryptographically secure random password
function generateSecurePassword(length: number = 16): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }
  
  // Ensure at least one of each required character type
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  
  // If missing any type, regenerate (rare case)
  if (!hasLower || !hasUpper || !hasNumber || !hasSpecial) {
    return generateSecurePassword(length);
  }
  
  return password;
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

    // Step 1: Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized - no token provided" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !caller) {
      console.error("Invalid token:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Authenticated caller: ${caller.id} (${caller.email})`);

    const { email, fullName, recordId, recordType = "student" }: CreateAccountRequest = await req.json();

    // Validate required fields
    if (!email || !fullName || !recordId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, fullName, recordId" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Step 2: Get the record and verify it exists
    const tableName = recordType === "student" ? "students" : "staff";
    const { data: record, error: recordError } = await supabaseAdmin
      .from(tableName)
      .select("company_id, user_id")
      .eq("id", recordId)
      .single();

    if (recordError || !record) {
      console.error(`Record not found in ${tableName}:`, recordError?.message);
      return new Response(
        JSON.stringify({ error: "Record not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if account already exists for this record
    if (record.user_id) {
      return new Response(
        JSON.stringify({ error: "Account already exists for this record", code: "ACCOUNT_EXISTS" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const recordCompanyId = record.company_id;

    // Step 3: Verify caller has permission (is company owner or admin staff)
    // Check if caller is the company owner
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("created_by")
      .eq("id", recordCompanyId)
      .single();

    const isOwner = company?.created_by === caller.id;

    // Check if caller is admin staff in this company
    let isAdminStaff = false;
    if (!isOwner) {
      const { data: callerStaff } = await supabaseAdmin
        .from("staff")
        .select("id, role_id, roles:role_id(is_admin)")
        .eq("user_id", caller.id)
        .eq("company_id", recordCompanyId)
        .single();

      // @ts-ignore - roles relationship
      isAdminStaff = callerStaff?.roles?.is_admin === true;
    }

    if (!isOwner && !isAdminStaff) {
      console.error(`User ${caller.id} is not authorized to create accounts for company ${recordCompanyId}`);
      return new Response(
        JSON.stringify({ error: "Forbidden - insufficient permissions" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Authorization verified: isOwner=${isOwner}, isAdminStaff=${isAdminStaff}`);
    console.log(`Creating account for ${recordType}: ${email}`);

    // Generate a cryptographically secure random password
    const temporaryPassword = generateSecurePassword(16);

    // Create the user with secure temporary password
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: recordType,
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

    // Update the record with the user_id based on record type
    const { error: updateError } = await supabaseAdmin
      .from(tableName)
      .update({ 
        user_id: userData.user?.id,
        password_changed: false 
      })
      .eq("id", recordId);

    if (updateError) {
      console.error(`Error updating ${recordType}:`, updateError);
      // Try to delete the created user if we can't link it
      await supabaseAdmin.auth.admin.deleteUser(userData.user!.id);
      throw updateError;
    }

    console.log(`${recordType} ${recordId} linked to user ${userData.user?.id} by ${caller.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: userData.user?.id,
        temporaryPassword: temporaryPassword,
        message: `Conta criada com sucesso. Senha temporária: ${temporaryPassword}`
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
