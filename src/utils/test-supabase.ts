/**
 * Utility functions to test and verify Supabase configuration
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Test Supabase connection and configuration
 * Returns a detailed report of the configuration status
 */
export async function testSupabaseConnection() {
  const report = {
    url: import.meta.env.VITE_SUPABASE_URL || "https://xybjydgqwthvzpgwhgah.supabase.co",
    anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Ymp5ZGdxd3RodnpwZ3doZ2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjI2MTYsImV4cCI6MjA2NjU5ODYxNn0.uO5P4A80Td_kLvz2wchPhJGfAZmvBNFh1Ij_0bLq0PY").substring(0, 20) + "...",
    isConfigured: false,
    canConnect: false,
    authEnabled: false,
    error: null as string | null,
    details: {} as Record<string, any>,
  };

  try {
    // Check if URL and key are set by testing a simple auth call
    const url = import.meta.env.VITE_SUPABASE_URL || "https://xybjydgqwthvzpgwhgah.supabase.co";
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Ymp5ZGdxd3RodnpwZ3doZ2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjI2MTYsImV4cCI6MjA2NjU5ODYxNn0.uO5P4A80Td_kLvz2wchPhJGfAZmvBNFh1Ij_0bLq0PY";
    
    report.isConfigured = !!(url && key);
    
    if (!report.isConfigured) {
      report.error = "Supabase URL or Anon Key is missing";
      return report;
    }

    // Test connection by getting the current session
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        // Check if it's a network/DNS error
        if (sessionError.message.includes("Failed to fetch") || 
            sessionError.message.includes("ERR_NAME_NOT_RESOLVED") ||
            sessionError.message.includes("NetworkError")) {
          report.error = `Cannot connect to Supabase: DNS resolution failed. The URL "${url}" may be incorrect or the project may not exist.`;
          report.details.dnsError = true;
        } else {
          report.error = `Session check failed: ${sessionError.message}`;
        }
      } else {
        report.canConnect = true;
        report.authEnabled = true;
        report.details.session = sessionData?.session ? "Active session found" : "No active session";
      }
    } catch (networkError: any) {
      if (networkError?.message?.includes("Failed to fetch") || 
          networkError?.message?.includes("ERR_NAME_NOT_RESOLVED")) {
        report.error = `Network error: Cannot resolve Supabase URL "${url}". Please verify the URL is correct in your Supabase dashboard.`;
        report.details.dnsError = true;
      } else {
        report.error = `Connection test failed: ${networkError?.message || "Unknown error"}`;
      }
    }

    // Test a simple API call (health check)
    try {
      const { error: healthError } = await supabase.from("_health").select("1").limit(1);
      // This might fail, but that's okay - it means we can reach Supabase
      report.details.apiReachable = !healthError || healthError.code !== "PGRST116";
    } catch (e) {
      // Expected to fail, but shows we can make requests
      report.details.apiReachable = true;
    }

  } catch (error) {
    report.error = error instanceof Error ? error.message : "Unknown error";
  }

  return report;
}

/**
 * Log Supabase configuration to console
 */
export function logSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL || "https://xybjydgqwthvzpgwhgah.supabase.co";
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Ymp5ZGdxd3RodnpwZ3doZ2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjI2MTYsImV4cCI6MjA2NjU5ODYxNn0.uO5P4A80Td_kLvz2wchPhJGfAZmvBNFh1Ij_0bLq0PY";
  
  console.group("🔍 Supabase Configuration");
  console.log("URL:", url);
  console.log("Anon Key:", key.substring(0, 30) + "...");
  console.log("Full Key Length:", key.length);
  console.log("Using Env Vars:", {
    url: !!import.meta.env.VITE_SUPABASE_URL,
    key: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  });
  console.log("Client:", supabase);
  console.groupEnd();
}

/**
 * Test authentication flow
 */
export async function testAuth() {
  console.group("🔐 Testing Authentication");
  
  try {
    // Check current session
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    console.log("Current Session:", session?.session ? "✅ Active" : "❌ None");
    if (sessionError) console.error("Session Error:", sessionError);

    // Check user
    const { data: user, error: userError } = await supabase.auth.getUser();
    console.log("Current User:", user?.user ? `✅ ${user.user.email}` : "❌ None");
    if (userError) console.error("User Error:", userError);

  } catch (error) {
    console.error("Auth Test Error:", error);
  }
  
  console.groupEnd();
}

