import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SiteNote } from '../types/Quote';
import { logger } from './Logger';
import { deletePersistedImages } from '../utils/imageStorage';

const STORAGE_KEYS = {
  QUOTES: 'saved_quotes',
  PENDING_DELETES: '@asktoddy_pending_deletes',
  LAST_SYNC: '@asktoddy_last_sync_timestamp',
} as const;

class QuoteStorageService {
  private cache: SiteNote[] | null = null;
  private syncInProgress = false;

  // Simple async mutex: queued writes execute sequentially
  private writeLock: Promise<void> = Promise.resolve();

  /**
   * Serialise a write operation so concurrent calls cannot interleave.
   * Each call waits for the previous write to finish before starting.
   */
  private async withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void;
    const next = new Promise<void>(resolve => {
      release = resolve;
    });
    const prev = this.writeLock;
    this.writeLock = next;
    await prev;
    try {
      return await fn();
    } finally {
      release!();
    }
  }

  /**
   * Get all quotes, sorted by lastModified descending.
   * Populates in-memory cache from AsyncStorage on first call.
   */
  async getAll(): Promise<SiteNote[]> {
    if (this.cache !== null) {
      return this.cache;
    }

    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.QUOTES);
      const quotes: SiteNote[] = json ? JSON.parse(json) : [];
      quotes.sort((a, b) => b.lastModified - a.lastModified);
      this.cache = quotes;
      return quotes;
    } catch (error) {
      console.error('QuoteStorageService.getAll failed:', error);
      this.cache = [];
      return [];
    }
  }

  /**
   * Get a single quote by ID.
   */
  async getById(id: string): Promise<SiteNote | null> {
    const quotes = await this.getAll();
    return quotes.find(q => q.id === id) || null;
  }

  /**
   * Upsert a quote locally. Sets syncStatus to 'local' and updates lastModified.
   * Returns void — caller can fire-and-forget.
   */
  async save(quote: SiteNote): Promise<void> {
    return this.withWriteLock(async () => {
      try {
        const quotes = await this.getAll();
        const updated = quotes.filter(q => q.id !== quote.id);
        const saved: SiteNote = {
          ...quote,
          syncStatus: 'local',
          lastModified: quote.lastModified || Date.now(),
        };
        updated.push(saved);
        updated.sort((a, b) => b.lastModified - a.lastModified);
        this.cache = updated;
        await AsyncStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(updated));
      } catch (error) {
        console.error('QuoteStorageService.save failed:', error);
      }
    });
  }

  /**
   * Delete a quote locally and queue its ID for server-side soft delete on next sync.
   */
  async delete(id: string): Promise<void> {
    return this.withWriteLock(async () => {
      try {
        const quotes = await this.getAll();
        const toDelete = quotes.find(q => q.id === id);

        // Clean up persisted photo files
        if (toDelete?.photos && toDelete.photos.length > 0) {
          deletePersistedImages(toDelete.photos); // fire-and-forget
        }

        const updated = quotes.filter(q => q.id !== id);
        this.cache = updated;
        await AsyncStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(updated));

        // Queue for server delete
        const pendingJson = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_DELETES);
        const pending: string[] = pendingJson ? JSON.parse(pendingJson) : [];
        if (!pending.includes(id)) {
          pending.push(id);
          await AsyncStorage.setItem(STORAGE_KEYS.PENDING_DELETES, JSON.stringify(pending));
        }
      } catch (error) {
        console.error('QuoteStorageService.delete failed:', error);
      }
    });
  }

  /**
   * Clear all local quote data. Used on sign-out.
   */
  async clear(): Promise<void> {
    return this.withWriteLock(async () => {
      try {
        this.cache = null;
        await AsyncStorage.removeItem(STORAGE_KEYS.QUOTES);
        await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_DELETES);
        await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
      } catch (error) {
        console.error('QuoteStorageService.clear failed:', error);
      }
    });
  }

  /**
   * Sync local quotes to the server. Calls the sync-quotes Edge Function.
   * Merges server response back into local cache.
   * Errors are logged but never surfaced to UI.
   */
  async syncToServer(userId: string, getAccessToken: () => Promise<string | null>): Promise<void> {
    if (this.syncInProgress) return;
    this.syncInProgress = true;

    try {
      const token = await getAccessToken();
      if (!token) return;

      const quotes = await this.getAll();
      const lastSyncJson = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      const lastSyncTimestamp = lastSyncJson ? parseInt(lastSyncJson, 10) : 0;

      const pendingJson = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_DELETES);
      const deletedIds: string[] = pendingJson ? JSON.parse(pendingJson) : [];

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) return;

      const response = await fetch(`${supabaseUrl}/functions/v1/sync-quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quotes,
          lastSyncTimestamp,
          deletedIds,
        }),
      });

      if (!response.ok) {
        logger.warn('sync-quotes returned', response.status);
        return;
      }

      const data = await response.json();
      if (!data.success) return;

      // Merge server quotes into local cache — use write lock to avoid racing with save()
      await this.withWriteLock(async () => {
        // Merge server quotes into local cache
        const serverQuotes: SiteNote[] = data.quotes || [];
        const serverDeletedIds: string[] = data.deletedIds || [];

        // Start from current local cache
        let merged = [...(this.cache || [])];

        // Remove server-deleted quotes
        if (serverDeletedIds.length > 0) {
          merged = merged.filter(q => !serverDeletedIds.includes(q.id));
        }

        // Merge server quotes (server wins for any conflicts since it already resolved them)
        for (const sq of serverQuotes) {
          const idx = merged.findIndex(q => q.id === sq.id);
          const mergedQuote: SiteNote = { ...sq, syncStatus: 'synced' as const };
          if (idx >= 0) {
            merged[idx] = mergedQuote;
          } else {
            merged.push(mergedQuote);
          }
        }

        merged.sort((a, b) => b.lastModified - a.lastModified);
        this.cache = merged;
        await AsyncStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(merged));

        // Clear pending deletes and update sync timestamp
        await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_DELETES);
        if (data.syncTimestamp) {
          await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, String(data.syncTimestamp));
        }
      });
    } catch (error) {
      logger.warn('QuoteStorageService.syncToServer failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Migrate anonymous quotes to a newly authenticated account.
   * Pushes all local quotes to the server for the first time.
   */
  async migrateAnonymousQuotes(
    userId: string,
    getAccessToken: () => Promise<string | null>
  ): Promise<void> {
    // Reset last sync so all quotes get pushed
    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
    await this.syncToServer(userId, getAccessToken);
  }

  /** Invalidate the in-memory cache (useful for testing). */
  _invalidateCache(): void {
    this.cache = null;
  }
}

export const quoteStorage = new QuoteStorageService();
export default QuoteStorageService;
