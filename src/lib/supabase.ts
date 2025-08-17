import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ssywwcucfidvgxzwiqnj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeXd3Y3VjZmlkdmd4endpcW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODIwNzIsImV4cCI6MjA3MDA1ODA3Mn0.oxiRrGe6Kwe_BEXgoiK_05cU-Zdw8VMW2uwVDsC4kUc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // These options stop Supabase from re-fetching data upon window focus or reconnect.
    // This makes the app feel more "stable" and prevents unexpected loading spinners.
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: (input, init) => {
        // @ts-ignore
        init.next = {
            // By default, `revalidate` is `false` which means it will be cached indefinitely.
            // We set it to 0 to effectively disable caching for Supabase fetch requests.
            revalidate: 0 
        };
        return fetch(input, init);
    },
  },
})
