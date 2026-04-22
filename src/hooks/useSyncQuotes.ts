import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNetworkStatus } from './useNetworkStatus';
import { quoteStorage } from '../services/QuoteStorageService';

/**
 * Hook that triggers background quote sync in three scenarios:
 * 1. App comes to foreground
 * 2. Device transitions from offline → online
 * 3. On demand (returned triggerSync function)
 *
 * Skips anonymous users. Errors are silently logged.
 */
export function useSyncQuotes() {
  const { isAnonymous, session } = useAuth();
  const { isOnline } = useNetworkStatus();
  const prevOnlineRef = useRef<boolean | null>(null);

  // Keep session in a ref so doSync always reads the latest token
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const doSync = () => {
    const currentSession = sessionRef.current;
    if (isAnonymous || !currentSession?.user?.id) return;
    const getAccessToken = async () => currentSession.access_token ?? null;
    quoteStorage.syncToServer(currentSession.user.id, getAccessToken).catch(() => {});
  };

  // 1. Sync when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        doSync();
      }
    });
    return () => {
      if (subscription) subscription.remove();
    };
  }, [isAnonymous]);

  // 2. Sync when transitioning offline → online
  useEffect(() => {
    if (prevOnlineRef.current === false && isOnline === true) {
      doSync();
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline, isAnonymous]);

  // 3. Initial sync on mount (if already online and authenticated)
  useEffect(() => {
    if (isOnline && !isAnonymous && session?.user?.id) {
      doSync();
    }
  }, []);

  return { triggerSync: doSync };
}
