import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// To fix the "supabaseUrl is required" error during build,
// we ensure the client is only created when needed and not at module-load time.
let supabaseInstance: SupabaseClient | null = null;

const getSupabase = () => {
    if (!supabaseInstance) {
        if (!supabaseUrl || !supabaseAnonKey) {
            // This will only be an issue during build if env vars are not set,
            // but provides a runtime check as well.
            throw new Error("Supabase URL and Anon Key must be provided.");
        }
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabaseInstance;
};

// Use a getter to export the client.
// This ensures createClient is called only when `supabase` is accessed for the first time.
export const supabase = getSupabase();
