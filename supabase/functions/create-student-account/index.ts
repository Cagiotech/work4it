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
  recordType?: "student" | "staff";
  password?: string;
  forceResetPassword?: boolean;
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

    const {
      email,
      fullName,
      recordId,
      recordType = "student",
      password,
      forceResetPassword = false,
    }: CreateAccountRequest = await req.json();

    // Validate required fields
    if (!email || !fullName || !recordId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, fullName, recordId" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (password && password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
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

    const existingUserId = (record.user_id ?? null) as string | null;
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

    // If account already exists, optionally reset password
    if (existingUserId) {
      if (!forceResetPassword) {
        return new Response(
          JSON.stringify({ error: "Account already exists for this record", code: "ACCOUNT_EXISTS" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const temporaryPassword = password ?? generateSecurePassword(16);

      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(existingUserId, {
        password: temporaryPassword,
      });

      if (updateAuthError) {
        console.error("Error resetting user password:", updateAuthError);
        throw updateAuthError;
      }

      const { error: updateRecordError } = await supabaseAdmin
        .from(tableName)
        .update({ password_changed: false })
        .eq("id", recordId);

      if (updateRecordError) {
        console.error(`Error updating ${recordType} after password reset:`, updateRecordError);
        throw updateRecordError;
      }

      console.log(`Password reset for ${recordType} ${recordId} (${email}) by ${caller.email}`);

      return new Response(
        JSON.stringify({
          success: true,
          userId: existingUserId,
          temporaryPassword,
          message: `Senha redefinida com sucesso. Senha temporária: ${temporaryPassword}`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Creating account for ${recordType}: ${email}`);

    // Generate a cryptographically secure random password (or use provided password)
    const temporaryPassword = password ?? generateSecurePassword(16);

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

      const errorCode = (createError as any)?.code as string | undefined;
      const isEmailExistsError =
        createError.message?.includes("already been registered") || errorCode === "email_exists";

      // If user already exists in auth, link existing user to record.
      // IMPORTANT: do NOT reset the password unless explicitly requested.
      if (isEmailExistsError) {
        console.log(`Email ${email} already exists in auth. Attempting to link existing user...`);

        // Find the existing user by email (with basic pagination)
        let existingAuthUser:
          | { id: string; email?: string | null }
          | null = null;

        const perPage = 1000;
        for (let page = 1; page <= 10 && !existingAuthUser; page++) {
          const { data: usersPage, error: listError } = await supabaseAdmin.auth.admin.listUsers({
            page,
            perPage,
          });

          if (listError) {
            console.error("Error listing users:", listError);
            throw listError;
          }

          existingAuthUser =
            usersPage.users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase()) ?? null;

          if (usersPage.users.length < perPage) break;
        }

        if (!existingAuthUser) {
          return new Response(
            JSON.stringify({
              error: "Email já registado no sistema mas não encontrado",
              code: "USER_EXISTS",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }

        // Link the existing auth user to the record
        const { error: linkError } = await supabaseAdmin
          .from(tableName)
          .update({ user_id: existingAuthUser.id })
          .eq("id", recordId);

        if (linkError) {
          console.error(`Error linking existing user to ${recordType}:`, linkError);
          throw linkError;
        }

        let appliedPassword: string | null = null;

        // Only reset password when explicitly requested
        if (forceResetPassword || typeof password === "string") {
          const newTempPassword = password ?? generateSecurePassword(16);

          const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
            password: newTempPassword,
          });

          if (resetError) {
            console.error("Error resetting password for existing user:", resetError);
            throw resetError;
          }

          const { error: updateRecordError } = await supabaseAdmin
            .from(tableName)
            .update({ password_changed: false })
            .eq("id", recordId);

          if (updateRecordError) {
            console.error(`Error updating ${recordType} after password reset:`, updateRecordError);
            throw updateRecordError;
          }

          appliedPassword = newTempPassword;
          console.log(`Linked existing auth user ${existingAuthUser.id} to ${recordType} ${recordId} and reset password`);
        } else {
          console.log(`Linked existing auth user ${existingAuthUser.id} to ${recordType} ${recordId} (password unchanged)`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            userId: existingAuthUser.id,
            linkedExisting: true,
            ...(appliedPassword
              ? {
                  temporaryPassword: appliedPassword,
                  message: `Conta existente vinculada. Senha temporária: ${appliedPassword}`,
                }
              : {
                  message: "Conta existente vinculada. Senha não foi alterada.",
                }),
          }),
          {
            status: 200,
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
