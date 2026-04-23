import AsyncStorage from '@react-native-async-storage/async-storage';
import { quoteStorage } from '../QuoteStorageService';
import type { SiteNote } from '../../types/Quote';

// Helper to build a minimal SiteNote
function makeQuote(overrides: Partial<SiteNote> = {}): SiteNote {
  return {
    id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: Date.now(),
    lastModified: Date.now(),
    address: '10 Test Street',
    jobType: 'bathroom',
    constructionMethod: undefined,
    propertyType: 'Detached',
    size: '3m x 2m',
    tasks: ['Plumbing'],
    notes: '',
    photos: [],
    voiceNotes: '',
    syncStatus: 'local' as const,
    status: 'draft' as const,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.clear as jest.Mock)();
  quoteStorage._invalidateCache();
});

describe('QuoteStorageService — local operations', () => {
  it('getAll returns empty array when no quotes stored', async () => {
    const quotes = await quoteStorage.getAll();
    expect(quotes).toEqual([]);
  });

  it('save stores a quote and getAll retrieves it', async () => {
    const q = makeQuote({ id: 'q1', address: '1 Main St' });
    await quoteStorage.save(q);

    const all = await quoteStorage.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('q1');
    expect(all[0].address).toBe('1 Main St');
    expect(all[0].syncStatus).toBe('local');
  });

  it('save upserts — updates existing quote with same ID', async () => {
    const q = makeQuote({ id: 'q2', address: 'Old Address' });
    await quoteStorage.save(q);

    await quoteStorage.save({ ...q, address: 'New Address', lastModified: Date.now() + 1 });

    const all = await quoteStorage.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].address).toBe('New Address');
  });

  it('getAll returns quotes sorted by lastModified desc', async () => {
    await quoteStorage.save(makeQuote({ id: 'old', lastModified: 1000 }));
    await quoteStorage.save(makeQuote({ id: 'new', lastModified: 3000 }));
    await quoteStorage.save(makeQuote({ id: 'mid', lastModified: 2000 }));

    const all = await quoteStorage.getAll();
    expect(all.map(q => q.id)).toEqual(['new', 'mid', 'old']);
  });

  it('getById returns the correct quote', async () => {
    await quoteStorage.save(makeQuote({ id: 'find-me', address: 'Found' }));
    await quoteStorage.save(makeQuote({ id: 'not-me', address: 'Other' }));

    const found = await quoteStorage.getById('find-me');
    expect(found?.address).toBe('Found');
  });

  it('getById returns null for missing ID', async () => {
    const result = await quoteStorage.getById('nonexistent');
    expect(result).toBeNull();
  });

  it('delete removes a quote locally', async () => {
    await quoteStorage.save(makeQuote({ id: 'del1' }));
    await quoteStorage.save(makeQuote({ id: 'del2' }));

    await quoteStorage.delete('del1');

    const all = await quoteStorage.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('del2');
  });

  it('delete queues ID in pending deletes for sync', async () => {
    await quoteStorage.save(makeQuote({ id: 'pending-del' }));
    await quoteStorage.delete('pending-del');

    const pendingJson = await AsyncStorage.getItem('@asktoddy_pending_deletes');
    const pending = JSON.parse(pendingJson!);
    expect(pending).toContain('pending-del');
  });

  it('delete does not duplicate IDs in pending deletes', async () => {
    await quoteStorage.save(makeQuote({ id: 'dup-del' }));
    await quoteStorage.delete('dup-del');
    // Invalidate cache so delete path runs again
    quoteStorage._invalidateCache();
    await quoteStorage.delete('dup-del');

    const pendingJson = await AsyncStorage.getItem('@asktoddy_pending_deletes');
    const pending = JSON.parse(pendingJson!);
    expect(pending.filter((id: string) => id === 'dup-del')).toHaveLength(1);
  });

  it('clear removes all quote data', async () => {
    await quoteStorage.save(makeQuote({ id: 'clear1' }));
    await quoteStorage.clear();

    // Reset cache since clear nulls it
    const all = await quoteStorage.getAll();
    expect(all).toEqual([]);
  });

  it('cache is populated on first getAll and reused on second call', async () => {
    // Seed storage directly
    const q = makeQuote({ id: 'cached' });
    await AsyncStorage.setItem('saved_quotes', JSON.stringify([q]));

    // First call reads from AsyncStorage
    const first = await quoteStorage.getAll();
    expect(first).toHaveLength(1);

    // Modify storage behind the scenes
    await AsyncStorage.setItem('saved_quotes', JSON.stringify([]));

    // Second call should use cache (still 1 quote)
    const second = await quoteStorage.getAll();
    expect(second).toHaveLength(1);
  });

  it('handles corrupted AsyncStorage data gracefully', async () => {
    await AsyncStorage.setItem('saved_quotes', 'not valid json{{{');
    quoteStorage._invalidateCache();

    const all = await quoteStorage.getAll();
    expect(all).toEqual([]);
  });
});

describe('QuoteStorageService — sync', () => {
  const mockGetToken = jest.fn(() => Promise.resolve('test-token'));

  beforeEach(() => {
    // Set up the env var
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  });

  it('syncToServer sends local quotes and merges server response', async () => {
    const localQuote = makeQuote({ id: 'local1', address: 'Local' });
    await quoteStorage.save(localQuote);

    const serverQuote = makeQuote({ id: 'server1', address: 'From Server', lastModified: 9999 });

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            quotes: [serverQuote],
            syncTimestamp: 10000,
            deletedIds: [],
          }),
      })
    ) as any;

    await quoteStorage.syncToServer('user-1', mockGetToken);

    const all = await quoteStorage.getAll();
    expect(all).toHaveLength(2);
    expect(all.find(q => q.id === 'server1')).toBeDefined();
    expect(all.find(q => q.id === 'server1')?.syncStatus).toBe('synced');
  });

  it('syncToServer removes server-deleted quotes locally', async () => {
    await quoteStorage.save(makeQuote({ id: 'to-delete', address: 'Gone' }));

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            quotes: [],
            syncTimestamp: 10000,
            deletedIds: ['to-delete'],
          }),
      })
    ) as any;

    await quoteStorage.syncToServer('user-1', mockGetToken);

    const all = await quoteStorage.getAll();
    expect(all.find(q => q.id === 'to-delete')).toBeUndefined();
  });

  it('syncToServer is a no-op when already syncing (mutex)', async () => {
    let resolveSync!: () => void;

    global.fetch = jest.fn(
      () =>
        new Promise(resolve => {
          resolveSync = () =>
            resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  success: true,
                  quotes: [],
                  syncTimestamp: 1,
                  deletedIds: [],
                }),
            });
        })
    ) as any;

    // Start first sync — it will await the fetch promise
    const first = quoteStorage.syncToServer('user-1', mockGetToken);

    // Yield to let the first call reach the fetch and set syncInProgress
    await new Promise(r => setTimeout(r, 10));

    // Second call should be a no-op since syncInProgress is true
    const second = quoteStorage.syncToServer('user-1', mockGetToken);
    await second;

    // Only one fetch call should have been made
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Resolve the pending fetch so first sync completes
    resolveSync();
    await first;
  });

  it('syncToServer silently handles fetch errors', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error'))) as any;

    // Should not throw
    await quoteStorage.syncToServer('user-1', mockGetToken);
  });

  it('syncToServer skips when no access token', async () => {
    global.fetch = jest.fn() as any;

    await quoteStorage.syncToServer('user-1', () => Promise.resolve(null));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
