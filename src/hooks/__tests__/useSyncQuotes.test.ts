import { renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useSyncQuotes } from '../useSyncQuotes';

// Mock dependencies
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('../useNetworkStatus', () => ({
  useNetworkStatus: jest.fn(),
}));
jest.mock('../../services/QuoteStorageService', () => ({
  quoteStorage: {
    syncToServer: jest.fn(() => Promise.resolve()),
    migrateAnonymousQuotes: jest.fn(() => Promise.resolve()),
  },
}));

import { useAuth } from '../../contexts/AuthContext';
import { useNetworkStatus } from '../useNetworkStatus';
import { quoteStorage } from '../../services/QuoteStorageService';

const mockUseAuth = useAuth as jest.Mock;
const mockUseNetworkStatus = useNetworkStatus as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useSyncQuotes', () => {
  it('does not sync for anonymous users', () => {
    mockUseAuth.mockReturnValue({
      isAnonymous: true,
      session: null,
    });
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });

    renderHook(() => useSyncQuotes());

    expect(quoteStorage.syncToServer).not.toHaveBeenCalled();
  });

  it('syncs on mount for authenticated online users', () => {
    mockUseAuth.mockReturnValue({
      isAnonymous: false,
      session: { access_token: 'tok', user: { id: 'u1' } },
    });
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });

    renderHook(() => useSyncQuotes());

    expect(quoteStorage.syncToServer).toHaveBeenCalledWith('u1', expect.any(Function));
  });

  it('syncs when app comes to foreground', () => {
    mockUseAuth.mockReturnValue({
      isAnonymous: false,
      session: { access_token: 'tok', user: { id: 'u1' } },
    });
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });

    // Capture the AppState listener
    let appStateCallback: ((state: string) => void) | null = null;
    const spy = jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, cb) => {
      appStateCallback = cb as any;
      return { remove: jest.fn() } as any;
    });

    renderHook(() => useSyncQuotes());
    (quoteStorage.syncToServer as jest.Mock).mockClear();

    // Simulate foreground
    appStateCallback!('active');
    expect(quoteStorage.syncToServer).toHaveBeenCalled();

    spy.mockRestore();
  });

  it('syncs when transitioning offline to online', () => {
    mockUseAuth.mockReturnValue({
      isAnonymous: false,
      session: { access_token: 'tok', user: { id: 'u1' } },
    });

    // Start offline
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });
    const { rerender } = renderHook(() => useSyncQuotes());
    (quoteStorage.syncToServer as jest.Mock).mockClear();

    // Go online
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });
    rerender({});

    expect(quoteStorage.syncToServer).toHaveBeenCalled();
  });
});
