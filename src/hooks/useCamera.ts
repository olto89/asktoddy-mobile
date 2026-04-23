/**
 * useCamera Hook - Reusable camera functionality for AskToddy
 * Enhanced with improved permission handling via PermissionService
 */

import { useState, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabase';
import { PermissionService } from '../services/PermissionService';
import { logger } from '../services/Logger';

export interface CameraOptions {
  quality?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];
  skipProcessing?: boolean;
}

export interface CameraState {
  // Camera state
  facing: CameraType;
  isLoading: boolean;
  permission: any; // Camera permission object

  // Refs
  cameraRef: React.RefObject<CameraView>;

  // Actions
  takePicture: () => Promise<string | null>;
  pickImageFromLibrary: () => Promise<string | null>;
  toggleCameraFacing: () => void;
  requestPermission: () => Promise<void>;
}

export interface UseCameraOptions {
  cameraOptions?: CameraOptions;
  onImageCaptured?: (uri: string) => void;
  onError?: (error: Error) => void;
  analyzeImage?: boolean; // Whether to auto-analyze captured images
}

export const useCamera = (options: UseCameraOptions = {}): CameraState => {
  const {
    cameraOptions = {
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
      skipProcessing: false,
    },
    onImageCaptured,
    onError,
    analyzeImage = false,
  } = options;

  // State
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const cameraRef = useRef<CameraView>(null);

  // Get permission service instance
  const permissionService = PermissionService.getInstance();

  /**
   * Take picture with camera - enhanced with permission service
   */
  const takePicture = async (): Promise<string | null> => {
    // Check camera permission first with improved UX
    const cameraPermissionStatus = await permissionService.requestCameraPermission();
    if (!cameraPermissionStatus.granted) {
      logger.debug('Camera permission denied');
      return null;
    }

    if (!cameraRef.current) {
      onError?.(new Error('Camera not available'));
      return null;
    }

    setIsLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: cameraOptions.quality,
        skipProcessing: cameraOptions.skipProcessing,
      });

      if (photo?.uri) {
        // Optionally analyze image with Edge Function
        if (analyzeImage) {
          try {
            logger.debug('🤖 Auto-analyzing captured image...');
            await analyzeImageWithEdgeFunction(photo.uri);
          } catch (analysisError) {
            console.error('Auto-analysis failed:', analysisError);
            // Don't throw - image capture was successful
          }
        }

        onImageCaptured?.(photo.uri);
        return photo.uri;
      }

      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error('Failed to take picture');
      console.error('Camera error:', errorMessage);
      onError?.(errorMessage);

      Alert.alert('Camera Error', 'Failed to take picture. Please try again.', [{ text: 'OK' }]);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Pick image from photo library - enhanced with permission service
   */
  const pickImageFromLibrary = async (): Promise<string | null> => {
    // Check photo library permission first with improved UX
    const photoPermissionStatus = await permissionService.requestPhotoLibraryPermission();
    if (!photoPermissionStatus.granted) {
      logger.debug('Photo library permission denied');
      return null;
    }

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: cameraOptions.allowsEditing,
        aspect: cameraOptions.aspect,
        quality: cameraOptions.quality,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Optionally analyze image with Edge Function
        if (analyzeImage) {
          try {
            logger.debug('🤖 Auto-analyzing library image...');
            await analyzeImageWithEdgeFunction(asset.uri);
          } catch (analysisError) {
            console.error('Auto-analysis failed:', analysisError);
            // Don't throw - image selection was successful
          }
        }

        onImageCaptured?.(asset.uri);
        return asset.uri;
      }

      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error('Failed to pick image');
      console.error('Image picker error:', errorMessage);
      onError?.(errorMessage);

      Alert.alert('Gallery Error', 'Failed to pick image. Please try again.', [{ text: 'OK' }]);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle camera facing direction
   */
  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  /**
   * Helper function to analyze image using Edge Function
   * This is called automatically if analyzeImage option is true
   */
  const analyzeImageWithEdgeFunction = async (imageUri: string) => {
    const { data, error } = await supabase.functions.invoke('analyze-construction', {
      body: {
        imageUri,
        context: {
          projectType: 'General Construction',
          preferredProvider: 'auto',
        },
      },
    });

    if (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }

    return data;
  };

  return {
    // State
    facing,
    isLoading,
    permission,

    // Refs
    cameraRef,

    // Actions
    takePicture,
    pickImageFromLibrary,
    toggleCameraFacing,
    requestPermission,
  };
};
