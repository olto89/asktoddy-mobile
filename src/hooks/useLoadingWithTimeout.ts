import { useState, useEffect, useRef } from 'react';

export interface UseLoadingWithTimeoutOptions {
  timeoutMs?: number;
  onTimeout?: () => void;
}

export function useLoadingWithTimeout(options: UseLoadingWithTimeoutOptions = {}) {
  const { timeoutMs = 30000, onTimeout } = options; // 30 second default timeout
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startLoading = () => {
    setLoading(true);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set timeout to force stop loading
    timeoutRef.current = setTimeout(() => {
      console.warn('Loading timeout reached, forcing loading to stop');
      setLoading(false);
      onTimeout?.();
    }, timeoutMs);
  };

  const stopLoading = () => {
    setLoading(false);
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    loading,
    startLoading,
    stopLoading,
  };
}