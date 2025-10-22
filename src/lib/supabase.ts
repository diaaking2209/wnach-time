import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// This is the standard Supabase client configuration.
// By removing the aggressive caching overrides, we allow Next.js and Supabase
// to handle data fetching and revalidation in their intended, default way.
// This ensures that data is fresh when needed without causing the issues
// of stale or missing data on navigation.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)