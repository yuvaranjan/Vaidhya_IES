import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client — SERVER SIDE ONLY. Uses the service role key, which bypasses
 * RLS. It must never reach the browser: only import this from route handlers,
 * server components, and server actions.
 */

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "SUPABASE_URL / SUPABASE_SERVICE_KEY missing — copy .env.local.example to .env.local",
  );
}

export const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
