/**
 * Shared auth helper for Edge Functions.
 *
 * Verifies the caller's Supabase JWT (from the Authorization header) and returns
 * the authenticated user. The anon key is NOT a user token, so anonymous callers
 * resolve to `{ user: null }` — callers can use that to require a logged-in user.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface VerifiedUser {
  id: string;
  email?: string;
}

export interface VerifyResult {
  user: VerifiedUser | null;
  error?: string;
}

export async function verifyUser(req: Request): Promise<VerifyResult> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { user: null, error: 'Missing authorization header' };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRoleKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || '';

  // A client scoped to the caller's JWT — getUser() validates the token against
  // the auth server and returns null for the anon key or an expired/invalid token.
  const client = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    return { user: null, error: 'Unauthorized' };
  }

  return { user: { id: user.id, email: user.email } };
}
