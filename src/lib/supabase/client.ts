import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { readSupabaseEnvironment } from "./environment";

let browserClient: SupabaseClient<Database> | null | undefined;

export const getSupabaseClient = (): SupabaseClient<Database> | null => {
  if (browserClient !== undefined) return browserClient;

  const environment = readSupabaseEnvironment();
  if (!environment) {
    browserClient = null;
    return browserClient;
  }

  browserClient = createClient<Database>(environment.url, environment.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
};
