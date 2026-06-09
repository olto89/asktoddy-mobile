/**
 * useImagePicker Hook - Simplified image selection and management
 * For use in chat interfaces and other components that need image input
 */

import { useState } from 'react';
import { Alert, ActionSheetIOS, Platform, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export interface ImagePickerState {
  selectedImage: string | null;
  isLoading: boolean;

  // Actions
  pickImage: () => Promise<void>;
  takePhoto: () => Promise<void>;
  clearImage: () => void;
  showImagePicker: () => void;
  /** Opens photo library directly — no camera option. Use for logos/documents. */
  pickFromLibrary: () => Promise<void>;
}

export interface UseImagePickerOptions {
  quality?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];
  onImageSelected?: (uri: string) => void;
  onError?: (error: Error) => void;
}

export const useImagePicker = (options: UseImagePickerOptions = {}): ImagePickerState => {
  const {
    quality = 0.8,
    allowsEditing = true,
    aspect = [4, 3],
    onImageSelected,
    onError,
  } = options;

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Pick image from photo library
   */
  const pickImage = async (): Promise<void> => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        if (!permissionResult.canAskAgain) {
          Alert.alert(
            'Photo Library Access',
            'AskToddy needs access to your photo library to select images. Please enable it in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        } else {
          Alert.alert('Permission Required', 'Photo library access is needed to select images.');
        }
        return;
      }

      setIsLoading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect,
        quality,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        onImageSelected?.(imageUri);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error('Failed to pick image');
      console.error('Image picker error:', errorMessage);
      onError?.(errorMessage);

      Alert.alert('Gallery Error', 'Failed to pick image. Please try again.', [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Take photo with camera
   */
  const takePhoto = async (): Promise<void> => {
    try {
      // Request camera permission
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        if (!permissionResult.canAskAgain) {
          Alert.alert(
            'Camera Access',
            'AskToddy needs camera access to take photos. Please enable it in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        } else {
          Alert.alert('Permission Required', 'Camera access is needed to take photos.');
        }
        return;
      }

      setIsLoading(true);

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect,
        quality,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        onImageSelected?.(imageUri);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error('Failed to take photo');
      console.error('Camera error:', errorMessage);
      onError?.(errorMessage);

      Alert.alert('Camera Error', 'Failed to take photo. Please try again.', [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear selected image
   */
  const clearImage = (): void => {
    setSelectedImage(null);
  };

  /**
   * Show platform-appropriate image picker
   */
  const showImagePicker = (): void => {
    if (Platform.OS === 'ios') {
      // iOS Action Sheet
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Camera', 'Photo Library'],
          cancelButtonIndex: 0,
        },
        buttonIndex => {
          if (buttonIndex === 1) {
            takePhoto();
          } else if (buttonIndex === 2) {
            pickImage();
          }
        }
      );
    } else {
      // Android Alert Dialog
      Alert.alert('Select Image', 'Choose an option to add an image', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
      ]);
    }
  };

  /**
   * Open photo library directly (no camera option)
   * Best for logos and documents where camera doesn't make sense
   */
  const pickFromLibrary = async (): Promise<void> => {
    await pickImage();
  };

  return {
    selectedImage,
    isLoading,
    pickImage,
    takePhoto,
    clearImage,
    showImagePicker,
    pickFromLibrary,
  };
};
