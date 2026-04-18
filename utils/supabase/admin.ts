import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

export const createAdminClient = (): SupabaseClient<Database> => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for admin tasks
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
