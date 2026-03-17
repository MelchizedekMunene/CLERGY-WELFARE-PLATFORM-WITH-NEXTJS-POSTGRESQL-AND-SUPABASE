// src/lib/supabase.js
// Supabase client singletons.
// - browserClient: uses NEXT_PUBLIC_ keys, safe for client components (uploads)
// - serverClient: uses SERVICE_ROLE_KEY, only used in API routes (never sent to browser)

import { createClient } from '@supabase/supabase-js';

// ─── Browser client (for drag-and-drop uploads from components) ──────────────
// Uses the anon key — bucket policies control what's allowed
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Server client (for API routes that need elevated access) ────────────────
// Uses the service role key — NEVER import this in client components
export function getSupabaseServerClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}