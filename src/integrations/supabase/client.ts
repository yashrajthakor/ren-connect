import { createClient } from '@supabase/supabase-js';

// These values are provided by the Lovable Supabase integration
// They are safe to expose as they rely on Row Level Security for protection
const SUPABASE_URL = "https://xybjydgqwthvzpgwhgah.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Ymp5ZGdxd3RodnpwZ3doZ2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjI2MTYsImV4cCI6MjA2NjU5ODYxNn0.uO5P4A80Td_kLvz2wchPhJGfAZmvBNFh1Ij_0bLq0PY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
