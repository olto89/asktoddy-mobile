/**
 * Tests for supabase.ts dbHelpers — uploadImage and deleteStorageFile
 */

// We need to test the real implementation, so we unmock the module for this file.
jest.unmock('../../services/supabase');

// Provide a minimal supabase client mock that uploadImage and deleteStorageFile call.
const mockUpload = jest.fn();
const mockRemove = jest.fn();
const mockGetPublicUrl = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      refreshSession: jest.fn(),
      setSession: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
    from: jest.fn(),
    storage: {
      from: jest.fn(() => ({
        upload: mockUpload,
        remove: mockRemove,
        getPublicUrl: mockGetPublicUrl,
      })),
    },
  })),
}));

// expo-file-system is already mocked in jest/setup.ts

// Use dynamic require so env vars are set before module loads
let dbHelpers: (typeof import('../supabase'))['dbHelpers'];

beforeAll(() => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  dbHelpers = require('../supabase').dbHelpers;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('dbHelpers.uploadImage', () => {
  it('uses the caller-supplied filename (not a generated timestamp)', async () => {
    mockUpload.mockResolvedValue({
      data: { path: 'abc-123/logo.jpg', fullPath: 'company-logos/abc-123/logo.jpg' },
      error: null,
    });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://storage.example.com/company-logos/abc-123/logo.jpg' },
    });

    const result = await dbHelpers.uploadImage(
      'file:///tmp/photo.jpg',
      'abc-123/logo.jpg',
      'company-logos'
    );

    expect(result.error).toBeNull();
    // The upload call should use the exact filename we passed — not Date.now()
    expect(mockUpload).toHaveBeenCalledWith(
      'abc-123/logo.jpg',
      expect.anything(), // decoded base64 ArrayBuffer
      expect.objectContaining({ upsert: true })
    );
    expect(mockGetPublicUrl).toHaveBeenCalledWith('abc-123/logo.jpg');
    expect(result.data?.publicUrl).toBe(
      'https://storage.example.com/company-logos/abc-123/logo.jpg'
    );
  });

  it('returns an error when upload fails', async () => {
    mockUpload.mockResolvedValue({ data: null, error: { message: 'bucket not found' } });

    const result = await dbHelpers.uploadImage(
      'file:///tmp/photo.jpg',
      'x/logo.jpg',
      'company-logos'
    );

    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('uses caller-supplied base64 instead of reading the file', async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const FileSystem = require('expo-file-system');
    mockUpload.mockResolvedValue({
      data: { path: 'abc/logo.jpg', fullPath: 'company-logos/abc/logo.jpg' },
      error: null,
    });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://x/logo.jpg' } });

    const result = await dbHelpers.uploadImage(
      'file:///tmp/photo.jpg',
      'abc/logo.jpg',
      'company-logos',
      'preReadBase64=='
    );

    expect(result.error).toBeNull();
    // When base64 is supplied, we must NOT re-read the file.
    expect(FileSystem.readAsStringAsync).not.toHaveBeenCalled();
    expect(mockUpload).toHaveBeenCalled();
  });

  it('fails loudly when image data is empty (no 0-byte upload)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const FileSystem = require('expo-file-system');
    FileSystem.readAsStringAsync.mockResolvedValueOnce('');

    const result = await dbHelpers.uploadImage(
      'file:///tmp/empty.jpg',
      'abc/logo.jpg',
      'company-logos'
    );

    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
    // Must never attempt to store an empty file.
    expect(mockUpload).not.toHaveBeenCalled();
  });
});

describe('dbHelpers.deleteStorageFile', () => {
  it('calls storage.remove with the given path', async () => {
    mockRemove.mockResolvedValue({ error: null });

    const result = await dbHelpers.deleteStorageFile('company-logos', 'abc-123/logo.jpg');

    expect(mockRemove).toHaveBeenCalledWith(['abc-123/logo.jpg']);
    expect(result.error).toBeNull();
  });

  it('returns error from storage on failure', async () => {
    mockRemove.mockResolvedValue({ error: { message: 'not found' } });

    const result = await dbHelpers.deleteStorageFile('company-logos', 'missing/file.jpg');

    expect(result.error).toEqual({ message: 'not found' });
  });
});
