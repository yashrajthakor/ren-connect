import { createClient } from '@supabase/supabase-js';

// These values are provided by the Lovable Supabase integration
// They are safe to expose as they rely on Row Level Security for protection
// Can also be set via environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://takprmdekvuhjliiguwg.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRha3BybWRla3Z1aGpsaWlndXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MTM3NDQsImV4cCI6MjA4MjI4OTc0NH0.ulD0gDq0s1MRvBQ5bXrkQFvo7NVYzphn2Twp1rm-EoE";

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Supabase configuration error: Missing URL or Anon Key");
  console.error("URL:", SUPABASE_URL ? "✅ Set" : "❌ Missing");
  console.error("Anon Key:", SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing");
} else {
  console.log("✅ Supabase configured");
  console.log("URL:", SUPABASE_URL);
  console.log("Anon Key:", SUPABASE_ANON_KEY.substring(0, 30) + "...");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Log configuration on import (only in development)
if (import.meta.env.DEV) {
  console.group("🔍 Supabase Client Configuration");
  console.log("URL:", SUPABASE_URL);
  console.log("Anon Key:", SUPABASE_ANON_KEY.substring(0, 30) + "...");
  console.log("Full Key Length:", SUPABASE_ANON_KEY.length);
  console.log("Using Env Vars:", {
    url: !!import.meta.env.VITE_SUPABASE_URL,
    key: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  });
  console.groupEnd();
}
