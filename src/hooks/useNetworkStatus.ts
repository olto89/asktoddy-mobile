import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

const POLL_INTERVAL_MS = 30_000;
const PING_TIMEOUT_MS = 5_000;

async function pingNetwork(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkConnectivity = useCallback(async () => {
    const online = await pingNetwork();
    setIsOnline(online);
  }, []);

  useEffect(() => {
    // Initial check
    checkConnectivity();

    // Poll every 30s
    intervalRef.current = setInterval(checkConnectivity, POLL_INTERVAL_MS);

    // Re-check when app comes to foreground
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        checkConnectivity();
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.remove();
    };
  }, [checkConnectivity]);

  return { isOnline, checkConnectivity };
}
