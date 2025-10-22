import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// To fix the "supabaseUrl is required" error during build,
// we ensure the client is only created when needed and not at module-load time.
let supabaseInstance: SupabaseClient | null = null;

const getSupabase = () => {
    if (!supabaseInstance) {
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabaseInstance;
};

export const supabase = getSupabase();
