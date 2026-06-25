// src/utils/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check .env file."
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      // 🟢 Explicitly force localStorage tracking to align with your pipeline
      persistSession: true,
      // 🟢 Automatically refresh stale tokens in the background before they expire
      autoRefreshToken: true,
      // 🟢 Keeps keys standard across subdomains or deep-linked routes
      storageKey: "sb-auth-token", 
      detectSessionInUrl: true
    }
  }
);
