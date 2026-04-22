import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, createResponse, createErrorResponse } from '../_shared/env.ts';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate the request using the user's JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Missing authorization header', 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || '';

    // Create a client with the user's JWT to verify identity
    const userClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const userId = user.id;
    console.log(`🗑️ Starting account deletion for user: ${userId}`);

    // Service-role client for admin operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Delete user data in order (most dependent first)

    // 1. Delete quotes
    const { error: quotesError } = await adminClient.from('quotes').delete().eq('user_id', userId);

    if (quotesError) {
      console.error('Error deleting quotes:', quotesError);
    }

    // 2. Delete analysis requests
    const { error: analysisError } = await adminClient
      .from('analysis_requests')
      .delete()
      .eq('user_id', userId);

    if (analysisError) {
      console.error('Error deleting analysis_requests:', analysisError);
    }

    // 3. Delete conversation sessions
    const { error: sessionsError } = await adminClient
      .from('conversation_sessions')
      .delete()
      .eq('user_id', userId);

    if (sessionsError) {
      console.error('Error deleting conversation_sessions:', sessionsError);
    }

    // 4. Delete user files from company-logos storage bucket
    try {
      const { data: files } = await adminClient.storage.from('company-logos').list(userId);

      if (files && files.length > 0) {
        const filePaths = files.map(f => `${userId}/${f.name}`);
        await adminClient.storage.from('company-logos').remove(filePaths);
      }
    } catch (storageError) {
      console.error('Error deleting storage files:', storageError);
      // Non-fatal — continue with account deletion
    }

    // 5. Delete auth user
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      return createErrorResponse('Failed to delete account', 500);
    }

    console.log(`✅ Account deleted successfully for user: ${userId}`);

    return createResponse({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('delete-account error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
