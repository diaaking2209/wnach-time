import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ssywwcucfidvgxzwiqnj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeXd3Y3VjZmlkdmd4endpcW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODIwNzIsImV4cCI6MjA3MDA1ODA3Mn0.oxiRrGe6Kwe_BEXgoiK_05cU-Zdw8VMW2uwVDsC4kUc'

// This is the standard Supabase client configuration.
// By removing the aggressive caching overrides, we allow Next.js and Supabase
// to handle data fetching and revalidation in their intended, default way.
// This ensures that data is fresh when needed without causing the issues
// of stale or missing data on navigation.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
