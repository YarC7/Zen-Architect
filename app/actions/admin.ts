"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { Database } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Create a new user with admin privileges (bypass email confirmation)
 */
export async function adminCreateUser(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const full_name = formData.get("full_name") as string;
  const username = email.split('@')[0];

  const supabaseAdmin = createAdminClient() as SupabaseClient<Database>;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (error) {
    return { error: error.message };
  }

  // 2. Create Profile Data
  if (data.user) {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: data.user.id,
        full_name: full_name || null,
        username: username || null,
        updated_at: new Date().toISOString()
      });
    
    if (profileError) {
      // Note: We might want to handle this edge case (auth created but profile failed)
      return { error: `Auth account created but profile setup failed: ${profileError.message}` };
    }
  }

  revalidatePath("/users");
  return { success: true, user: data.user };
}

/**
 * Update an existing user's details
 */
export async function adminUpdateUser(userId: string, data: { full_name?: string; email?: string }) {
  const supabaseAdmin = createAdminClient() as SupabaseClient<Database>;

  // 1. Update Authentication Data (if email changed)
  if (data.email) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, { 
      email: data.email 
    });
    if (authError) return { error: authError.message };
  }

  // 2. Update Profile Data
  if (data.full_name) {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        full_name: data.full_name, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId);
    
    if (profileError) return { error: profileError.message };
  }

  revalidatePath("/users");
  return { success: true };
}

/**
 * Archive a user (soft delete)
 */
export async function adminArchiveUser(userId: string) {
  const supabaseAdmin = createAdminClient() as SupabaseClient<Database>;
  
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ 
      deleted_at: new Date().toISOString() 
    })
    .eq('id', userId);

  if (error) return { error: error.message };

  revalidatePath("/users");
  return { success: true };
}

/**
 * Restore an archived user
 */
export async function adminRestoreUser(userId: string) {
  const supabaseAdmin = createAdminClient() as SupabaseClient<Database>;
  
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ 
      deleted_at: null 
    })
    .eq('id', userId);

  if (error) return { error: error.message };

  revalidatePath("/users");
  return { success: true };
}

/**
 * Get full user details including Auth data (email)
 */
export async function adminGetUser(userId: string) {
  const supabaseAdmin = createAdminClient() as SupabaseClient<Database>;
  
  // 1. Get Auth User (for email)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (authError) return { error: authError.message };

  // 2. Get Profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (profileError) return { error: profileError.message };

  return { 
    success: true, 
    user: {
      id: userId,
      email: user?.email,
      full_name: profile.full_name,
      username: profile.username,
      avatar_url: profile.avatar_url,
      deleted_at: profile.deleted_at
    }
  };
}
