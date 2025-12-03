/**
 * Enhanced Permission Service
 * Provides user-friendly permission requests with clear explanations,
 * retry options, and graceful degradation for camera, location, and storage
 */

import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useCameraPermissions } from 'expo-camera';

export type PermissionType = 'camera' | 'location' | 'photos' | 'mediaLibrary';

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export interface PermissionRequest {
  type: PermissionType;
  title: string;
  message: string;
  benefits: string[];
  fallbackMessage: string;
}

// Permission request configurations
const PERMISSION_CONFIGS: Record<PermissionType, PermissionRequest> = {
  camera: {
    type: 'camera',
    title: 'Camera Access Needed',
    message:
      'AskToddy needs camera access to analyze your construction photos and provide accurate quotes.',
    benefits: [
      'Instant photo analysis for accurate quotes',
      'Better material identification',
      'Professional quote generation',
      'Save time with visual estimation',
    ],
    fallbackMessage:
      'You can still use AskToddy by describing your project in text, though photo analysis provides more accurate quotes.',
  },
  photos: {
    type: 'photos',
    title: 'Photo Library Access',
    message: 'Access your photo library to select existing construction photos for analysis.',
    benefits: [
      'Use existing project photos',
      'Analyze multiple images together',
      'Compare before/after photos',
      'Build comprehensive project quotes',
    ],
    fallbackMessage:
      'You can still take new photos with the camera or describe your project in text.',
  },
  location: {
    type: 'location',
    title: 'Location Access for Accurate Pricing',
    message: 'Your location helps provide accurate UK regional pricing and find local suppliers.',
    benefits: [
      'Region-specific material pricing',
      'Local supplier recommendations',
      'Accurate labour cost estimates',
      'Delivery charge calculations',
    ],
    fallbackMessage: 'You can manually select your location or use national average pricing.',
  },
  mediaLibrary: {
    type: 'mediaLibrary',
    title: 'Save Photos',
    message: 'Save analyzed construction photos to your device for future reference.',
    benefits: [
      'Keep project photos organized',
      'Create before/after comparisons',
      'Build visual project timeline',
      'Share photos with contractors',
    ],
    fallbackMessage:
      "Photos will remain available within the app but won't be saved to your device.",
  },
};

export class PermissionService {
  private static instance: PermissionService;

  private constructor() {}

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  /**
   * Request camera permission with enhanced UX
   */
  async requestCameraPermission(): Promise<PermissionStatus> {
    const config = PERMISSION_CONFIGS.camera;

    try {
      // Check current status first
      const { status: currentStatus, canAskAgain } = await ImagePicker.getCameraPermissionsAsync();

      if (currentStatus === 'granted') {
        return { granted: true, canAskAgain: true, status: 'granted' };
      }

      // If denied and can't ask again, show settings prompt
      if (currentStatus === 'denied' && !canAskAgain) {
        return this.showPermissionDeniedAlert(config);
      }

      // Show explanation before requesting
      const shouldRequest = await this.showPermissionRequestAlert(config);
      if (!shouldRequest) {
        return { granted: false, canAskAgain: true, status: 'denied' };
      }

      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      return {
        granted: status === 'granted',
        canAskAgain: status !== 'denied',
        status: status as any,
      };
    } catch (error) {
      console.error('Camera permission error:', error);
      return { granted: false, canAskAgain: true, status: 'denied' };
    }
  }

  /**
   * Request photo library permission
   */
  async requestPhotoLibraryPermission(): Promise<PermissionStatus> {
    const config = PERMISSION_CONFIGS.photos;

    try {
      const { status: currentStatus, canAskAgain } =
        await ImagePicker.getMediaLibraryPermissionsAsync();

      if (currentStatus === 'granted') {
        return { granted: true, canAskAgain: true, status: 'granted' };
      }

      if (currentStatus === 'denied' && !canAskAgain) {
        return this.showPermissionDeniedAlert(config);
      }

      const shouldRequest = await this.showPermissionRequestAlert(config);
      if (!shouldRequest) {
        return { granted: false, canAskAgain: true, status: 'denied' };
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      return {
        granted: status === 'granted',
        canAskAgain: status !== 'denied',
        status: status as any,
      };
    } catch (error) {
      console.error('Photo library permission error:', error);
      return { granted: false, canAskAgain: true, status: 'denied' };
    }
  }

  /**
   * Request location permission with enhanced UX
   */
  async requestLocationPermission(): Promise<PermissionStatus> {
    const config = PERMISSION_CONFIGS.location;

    try {
      const { status: currentStatus, canAskAgain } = await Location.getForegroundPermissionsAsync();

      if (currentStatus === 'granted') {
        return { granted: true, canAskAgain: true, status: 'granted' };
      }

      if (currentStatus === 'denied' && !canAskAgain) {
        return this.showPermissionDeniedAlert(config);
      }

      const shouldRequest = await this.showPermissionRequestAlert(config);
      if (!shouldRequest) {
        return { granted: false, canAskAgain: true, status: 'denied' };
      }

      const { status } = await Location.requestForegroundPermissionsAsync();

      return {
        granted: status === 'granted',
        canAskAgain: status !== 'denied',
        status: status as any,
      };
    } catch (error) {
      console.error('Location permission error:', error);
      return { granted: false, canAskAgain: true, status: 'denied' };
    }
  }

  /**
   * Request media library save permission
   */
  async requestMediaLibraryPermission(): Promise<PermissionStatus> {
    const config = PERMISSION_CONFIGS.mediaLibrary;

    try {
      const { status: currentStatus, canAskAgain } = await MediaLibrary.getPermissionsAsync();

      if (currentStatus === 'granted') {
        return { granted: true, canAskAgain: true, status: 'granted' };
      }

      if (currentStatus === 'denied' && !canAskAgain) {
        return this.showPermissionDeniedAlert(config);
      }

      const shouldRequest = await this.showPermissionRequestAlert(config);
      if (!shouldRequest) {
        return { granted: false, canAskAgain: true, status: 'denied' };
      }

      const { status } = await MediaLibrary.requestPermissionsAsync();

      return {
        granted: status === 'granted',
        canAskAgain: status !== 'denied',
        status: status as any,
      };
    } catch (error) {
      console.error('Media library permission error:', error);
      return { granted: false, canAskAgain: true, status: 'denied' };
    }
  }

  /**
   * Show user-friendly permission request explanation
   */
  private showPermissionRequestAlert(config: PermissionRequest): Promise<boolean> {
    return new Promise(resolve => {
      const benefitsText = config.benefits.map(benefit => `• ${benefit}`).join('\n');

      Alert.alert(
        config.title,
        `${config.message}\n\nHow this helps you:\n${benefitsText}`,
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Allow Access',
            style: 'default',
            onPress: () => resolve(true),
          },
        ],
        { cancelable: false }
      );
    });
  }

  /**
   * Handle permission denied with settings redirect option
   */
  private showPermissionDeniedAlert(config: PermissionRequest): Promise<PermissionStatus> {
    return new Promise(resolve => {
      Alert.alert(
        `${config.title} - Permission Denied`,
        `${config.fallbackMessage}\n\nTo enable this feature later, you can grant permission in your device settings.`,
        [
          {
            text: 'Continue Without',
            style: 'cancel',
            onPress: () => resolve({ granted: false, canAskAgain: false, status: 'denied' }),
          },
          {
            text: 'Open Settings',
            style: 'default',
            onPress: () => {
              Linking.openSettings();
              resolve({ granted: false, canAskAgain: false, status: 'denied' });
            },
          },
        ],
        { cancelable: false }
      );
    });
  }

  /**
   * Check if permission is granted without requesting
   */
  async checkPermissionStatus(type: PermissionType): Promise<PermissionStatus> {
    try {
      switch (type) {
        case 'camera': {
          const { status, canAskAgain } = await ImagePicker.getCameraPermissionsAsync();
          return { granted: status === 'granted', canAskAgain, status: status as any };
        }
        case 'photos': {
          const { status, canAskAgain } = await ImagePicker.getMediaLibraryPermissionsAsync();
          return { granted: status === 'granted', canAskAgain, status: status as any };
        }
        case 'location': {
          const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
          return { granted: status === 'granted', canAskAgain, status: status as any };
        }
        case 'mediaLibrary': {
          const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();
          return { granted: status === 'granted', canAskAgain, status: status as any };
        }
        default:
          return { granted: false, canAskAgain: true, status: 'undetermined' };
      }
    } catch (error) {
      console.error(`Error checking ${type} permission:`, error);
      return { granted: false, canAskAgain: true, status: 'undetermined' };
    }
  }

  /**
   * Show permission education before first request
   */
  showPermissionEducation(type: PermissionType): Promise<boolean> {
    const config = PERMISSION_CONFIGS[type];
    const benefitsText = config.benefits.map(benefit => `• ${benefit}`).join('\n');

    return new Promise(resolve => {
      Alert.alert(
        `Enable ${config.title.replace(' Access Needed', '').replace(' Access', '')}?`,
        `${config.message}\n\nBenefits:\n${benefitsText}\n\n${config.fallbackMessage}`,
        [
          {
            text: 'Skip for Now',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Enable',
            style: 'default',
            onPress: () => resolve(true),
          },
        ],
        { cancelable: false }
      );
    });
  }

  /**
   * Show feature unavailable message
   */
  showFeatureUnavailableAlert(type: PermissionType, action: string = 'use this feature') {
    const config = PERMISSION_CONFIGS[type];

    Alert.alert(
      'Permission Required',
      `To ${action}, please enable ${type} access in your device settings.\n\n${config.fallbackMessage}`,
      [
        {
          text: 'Continue',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          style: 'default',
          onPress: () => Linking.openSettings(),
        },
      ]
    );
  }

  /**
   * Request multiple permissions in sequence with smart UX
   */
  async requestMultiplePermissions(
    types: PermissionType[]
  ): Promise<Record<PermissionType, PermissionStatus>> {
    const results: Record<PermissionType, PermissionStatus> = {} as any;

    for (const type of types) {
      // Check if already granted
      const status = await this.checkPermissionStatus(type);
      if (status.granted) {
        results[type] = status;
        continue;
      }

      // Request permission
      switch (type) {
        case 'camera':
          results[type] = await this.requestCameraPermission();
          break;
        case 'photos':
          results[type] = await this.requestPhotoLibraryPermission();
          break;
        case 'location':
          results[type] = await this.requestLocationPermission();
          break;
        case 'mediaLibrary':
          results[type] = await this.requestMediaLibraryPermission();
          break;
      }
    }

    return results;
  }

  /**
   * Request permissions for quote accuracy improvement
   * Specifically designed for the confidence guide UX
   */
  async requestPermissionsForQuoteImprovement(): Promise<{
    camera: PermissionStatus;
    location: PermissionStatus;
  }> {
    const results = {
      camera: await this.requestCameraPermission(),
      location: await this.requestLocationPermission(),
    };

    // Show completion message if both granted
    if (results.camera.granted && results.location.granted) {
      Alert.alert(
        'Permissions Enabled!',
        'Camera and location access will help provide more accurate quotes. You can now add photos and get region-specific pricing.',
        [{ text: 'Great!' }]
      );
    }

    return results;
  }
}
