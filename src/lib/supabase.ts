
import { createClient } from '@supabase/supabase-js'

// This is the correct singleton pattern for Next.js.
// The client is created only when the function is first called.
// Subsequent calls will return the same instance.

let supabase: ReturnType<typeof createClient>;

function getSupabase() {
    if (supabase) {
        return supabase;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase URL and Anon Key must be provided in your environment variables.");
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey);
    return supabase;
}

// We export the getter function itself, not the initialized client.
// This ensures the client is created lazily, only when needed,
// which solves the build-time environment variable issue.
export { getSupabase };
