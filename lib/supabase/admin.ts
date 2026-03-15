import { createClient } from "@supabase/supabase-js";

let adminClient: ReturnType<typeof createClient> | null = null;

/**
 * Returns a Supabase client using the service-role key, bypassing RLS.
 * Use only in server-side API routes for operations that require elevated privileges
 * (e.g., inserting AI-generated scenarios into the scenarios table).
 */
export function createAdminClient() {
  if (adminClient) return adminClient;

  adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  return adminClient;
}
