import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Track AppState listener
let appStateCallback: ((state: string) => void) | null = null;
const mockRemove = jest.fn();

jest.spyOn(AppState, 'addEventListener').mockImplementation((_type: string, listener: any) => {
  appStateCallback = listener;
  return { remove: mockRemove } as any;
});

// Must import after mocks
import { useNetworkStatus } from '../useNetworkStatus';

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  appStateCallback = null;
  mockFetch.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useNetworkStatus', () => {
  it('starts with null (unknown) state', () => {
    mockFetch.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useNetworkStatus());
    // Before the initial ping resolves, isOnline is null
    expect(result.current.isOnline).toBeNull();
  });

  it('reports online when ping succeeds', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
    });
  });

  it('reports offline when ping fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
    });
  });

  it('re-checks on AppState foreground', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
    });

    // Now simulate going offline
    mockFetch.mockRejectedValue(new Error('Network error'));

    // Simulate app coming to foreground
    await act(async () => {
      appStateCallback?.('active');
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
    });
  });

  it('cleans up interval and AppState listener on unmount', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    const { unmount } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    unmount();
    expect(mockRemove).toHaveBeenCalled();
  });

  it('checkConnectivity can be called manually', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
    });

    mockFetch.mockRejectedValue(new Error('offline'));

    await act(async () => {
      await result.current.checkConnectivity();
    });

    expect(result.current.isOnline).toBe(false);
  });
});
