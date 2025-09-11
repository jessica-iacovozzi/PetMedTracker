import { createClient } from "@supabase/supabase-js";
import { config } from "../src/lib/config";

const supabaseUrl = config.supabase.url;
const supabaseAnonKey = config.supabase.anonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
