import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getPublicEnv } from "@/lib/env";
import { getServerEnv } from "@/lib/env.server";

export function createSupabaseAdminClient() {
  const env = getPublicEnv();
  const serverEnv = getServerEnv();

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
