import { createClient } from "@supabase/supabase-js";
import { config } from "@/lib/config";

export function createSupabaseClient() {
  return createClient(config.supabase.url, config.supabase.anonKey);
}

export function createSupabaseServiceClient() {
  return createClient(config.supabase.url, config.supabase.serviceKey);
}

// Export createSupabaseClient as createClient for backward compatibility
export { createSupabaseClient as createClient };
