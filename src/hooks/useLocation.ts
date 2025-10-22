/**
 * useLocation Hook - React hook for GPS location and UK region detection
 * Provides location data with regional pricing multipliers
 */

import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { LocationService, LocationData, UKRegion } from '../services/location/LocationService';

export interface UseLocationState {
  loading: boolean;
  error: string | null;
  location: LocationData | null;
  region: UKRegion | null;
  pricingContext: {
    location: string;
    city: string;
    postcode?: string;
    region: string;
    regionCode: string;
    pricingMultiplier: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  } | null;

  // Actions
  getCurrentLocation: () => Promise<void>;
  refreshLocation: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

export const useLocation = (autoFetch: boolean = true): UseLocationState => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [region, setRegion] = useState<UKRegion | null>(null);
  const [pricingContext, setPricingContext] = useState<any>(null);

  const locationService = LocationService.getInstance();

  /**
   * Get current location
   */
  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Request permissions if needed
      const hasPermission = await locationService.requestPermissions();

      if (!hasPermission) {
        console.log('📍 Location permission denied, using default location');
      }

      // Get location (will use default if no permission)
      const locationData = await locationService.getCurrentLocation();

      if (locationData) {
        setLocation(locationData);

        // Get UK region
        const ukRegion = locationService.getUKRegion(locationData);
        setRegion(ukRegion);

        // Get pricing context
        const context = await locationService.getPricingContext();
        setPricingContext(context);

        console.log('📍 Location updated:', {
          city: locationData.city,
          region: ukRegion.name,
          multiplier: ukRegion.pricingMultiplier,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
      console.error('Location error:', errorMessage);

      // Use default location on error
      const defaultLocation = await locationService.getCurrentLocation();
      if (defaultLocation) {
        setLocation(defaultLocation);
        const ukRegion = locationService.getUKRegion(defaultLocation);
        setRegion(ukRegion);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh location
   */
  const refreshLocation = useCallback(async () => {
    console.log('🔄 Refreshing location...');
    await getCurrentLocation();
  }, [getCurrentLocation]);

  /**
   * Request permissions explicitly
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await locationService.requestPermissions();
      if (granted) {
        await getCurrentLocation();
      }
      return granted;
    } catch (err) {
      console.error('Permission request error:', err);
      return false;
    }
  }, [getCurrentLocation]);

  /**
   * Auto-fetch location on mount
   */
  useEffect(() => {
    if (autoFetch) {
      getCurrentLocation();
    }
  }, [autoFetch]);

  /**
   * Update location when app returns to foreground
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && location) {
        // Refresh location when app becomes active
        console.log('📱 App active, checking location...');
        getCurrentLocation();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [location, getCurrentLocation]);

  return {
    loading,
    error,
    location,
    region,
    pricingContext,
    getCurrentLocation,
    refreshLocation,
    requestPermissions,
  };
};

/**
 * Helper hook for just pricing multiplier
 */
export const usePricingMultiplier = (): number => {
  const { region } = useLocation(true);
  return region?.pricingMultiplier || 1.0;
};

/**
 * Helper hook for formatted location string
 */
export const useFormattedLocation = (): string => {
  const { location, region } = useLocation(true);

  if (!location) return 'Location not available';

  if (location.city && region) {
    return `${location.city}, ${region.name}`;
  }

  return location.formatted || 'Unknown location';
};
