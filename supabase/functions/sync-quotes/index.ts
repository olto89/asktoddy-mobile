import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, createResponse, createErrorResponse } from '../_shared/env.ts';

// ─── camelCase ↔ snake_case mapping helpers ─────────────────────────

interface ClientQuote {
  id: string;
  timestamp: number;
  lastModified: number;
  address: string;
  jobType: string;
  constructionMethod?: string;
  constructionMethodMultiplier?: number;
  propertyType: string;
  size: string;
  tasks: string[];
  notes: string;
  photos: string[];
  voiceNotes: string;
  voiceRecordings?: any[];
  syncStatus: string;
  status: string;
  pendingGeneration?: boolean;
  generatedTasks?: any[];
  totalCost?: { min: number; max: number };
  finalCost?: number;
  aiAnalysis?: any;
  siteNotes?: any;
  quoteName?: string;
  customerName?: string;
  projectNotes?: string;
}

interface DbRow {
  id: string;
  user_id: string;
  timestamp: number;
  last_modified: number;
  address: string;
  job_type: string;
  construction_method: string | null;
  construction_method_multiplier: number | null;
  property_type: string;
  size: string;
  tasks: string[];
  notes: string;
  photos: string[];
  voice_notes: string;
  voice_recordings: any[];
  status: string;
  pending_generation: boolean;
  generated_tasks: any[] | null;
  total_cost: { min: number; max: number } | null;
  final_cost: number | null;
  ai_analysis: any | null;
  site_notes: any | null;
  deleted_at: string | null;
}

function toDbRow(quote: ClientQuote, userId: string): Record<string, unknown> {
  return {
    id: quote.id,
    user_id: userId,
    timestamp: quote.timestamp,
    last_modified: quote.lastModified,
    address: quote.address || '',
    job_type: quote.jobType || '',
    construction_method: quote.constructionMethod || null,
    construction_method_multiplier: quote.constructionMethodMultiplier || null,
    property_type: quote.propertyType || '',
    size: quote.size || '',
    tasks: quote.tasks || [],
    notes: quote.notes || '',
    photos: quote.photos || [],
    voice_notes: quote.voiceNotes || '',
    voice_recordings: quote.voiceRecordings || [],
    status: quote.status || 'draft',
    pending_generation: quote.pendingGeneration || false,
    generated_tasks: quote.generatedTasks || null,
    total_cost: quote.totalCost || null,
    final_cost: quote.finalCost || null,
    ai_analysis: quote.aiAnalysis || null,
    site_notes: quote.siteNotes || null,
  };
}

function toClientQuote(row: DbRow): ClientQuote {
  return {
    id: row.id,
    timestamp: row.timestamp,
    lastModified: row.last_modified,
    address: row.address,
    jobType: row.job_type,
    constructionMethod: row.construction_method || undefined,
    constructionMethodMultiplier: row.construction_method_multiplier || undefined,
    propertyType: row.property_type,
    size: row.size,
    tasks: row.tasks || [],
    notes: row.notes,
    photos: row.photos || [],
    voiceNotes: row.voice_notes,
    voiceRecordings: row.voice_recordings || [],
    syncStatus: 'synced',
    status: row.status,
    pendingGeneration: row.pending_generation,
    generatedTasks: row.generated_tasks || undefined,
    totalCost: row.total_cost || undefined,
    finalCost: row.final_cost || undefined,
    aiAnalysis: row.ai_analysis || undefined,
    siteNotes: row.site_notes || undefined,
  };
}

// ─── Main handler ──────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Missing authorization header', 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || '';

    // Create a client with the user's JWT to get their identity
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

    // Parse request body
    const body = await req.json();
    const clientQuotes: ClientQuote[] = body.quotes || [];
    const lastSyncTimestamp: number = body.lastSyncTimestamp || 0;
    const clientDeletedIds: string[] = body.deletedIds || [];

    // Use service role client for DB operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // 1. Fetch all server quotes for this user (not soft-deleted)
    const { data: serverRows, error: fetchError } = await adminClient
      .from('quotes')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (fetchError) {
      console.error('Error fetching server quotes:', fetchError);
      return createErrorResponse('Failed to fetch quotes', 500);
    }

    const serverQuotes: DbRow[] = serverRows || [];
    const serverMap = new Map<string, DbRow>();
    for (const sq of serverQuotes) {
      serverMap.set(sq.id, sq);
    }

    // 2. Process client quotes: insert or update
    const upsertRows: Record<string, unknown>[] = [];
    const clientIds = new Set<string>();

    for (const cq of clientQuotes) {
      clientIds.add(cq.id);
      const existing = serverMap.get(cq.id);

      if (!existing) {
        // Not on server → INSERT
        upsertRows.push(toDbRow(cq, userId));
      } else if (cq.lastModified > existing.last_modified) {
        // Client is newer → UPDATE
        upsertRows.push(toDbRow(cq, userId));
      }
      // else: server is newer or equal → skip (server wins)
    }

    // 3. Process client deletedIds → soft-delete on server
    if (clientDeletedIds.length > 0) {
      const { error: deleteError } = await adminClient
        .from('quotes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', userId)
        .in('id', clientDeletedIds)
        .is('deleted_at', null);

      if (deleteError) {
        console.error('Error soft-deleting quotes:', deleteError);
      }
    }

    // 4. Upsert client quotes to server
    if (upsertRows.length > 0) {
      const { error: upsertError } = await adminClient
        .from('quotes')
        .upsert(upsertRows, { onConflict: 'id' });

      if (upsertError) {
        console.error('Error upserting quotes:', upsertError);
        return createErrorResponse('Failed to sync quotes', 500);
      }
    }

    // 5. Collect server quotes modified since lastSyncTimestamp
    //    that weren't in the client payload (new from other devices)
    const serverUpdated: ClientQuote[] = [];
    for (const sq of serverQuotes) {
      if (sq.last_modified > lastSyncTimestamp && !clientIds.has(sq.id)) {
        serverUpdated.push(toClientQuote(sq));
      }
    }

    // Also include quotes that server won on (server was newer)
    for (const cq of clientQuotes) {
      const existing = serverMap.get(cq.id);
      if (existing && existing.last_modified >= cq.lastModified) {
        serverUpdated.push(toClientQuote(existing));
      }
    }

    // 6. Collect server-side deletedIds since lastSyncTimestamp
    const { data: deletedRows } = await adminClient
      .from('quotes')
      .select('id')
      .eq('user_id', userId)
      .not('deleted_at', 'is', null)
      .gt('deleted_at', new Date(lastSyncTimestamp).toISOString());

    const serverDeletedIds = (deletedRows || []).map((r: { id: string }) => r.id);

    const syncTimestamp = Date.now();

    return createResponse({
      success: true,
      quotes: serverUpdated,
      syncTimestamp,
      deletedIds: serverDeletedIds,
    });
  } catch (error) {
    console.error('sync-quotes error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
