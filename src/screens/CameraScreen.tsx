import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import designTokens from '../styles/designTokens';
import Button from '../components/ui/Button';
import { AIService } from '../services/ai';

type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Camera'>;

interface Props {
  navigation: CameraScreenNavigationProp;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CameraScreen({ navigation }: Props) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    // Request image picker permissions on mount
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        console.log('Media library permission not granted');
      }
    })();
  }, []);

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color={designTokens.colors.primary[500]} />
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <Text style={styles.permissionTitle}>📷 Camera Access Required</Text>
          <Text style={styles.permissionText}>
            AskToddy needs camera access to analyze your construction projects and provide accurate quotes.
          </Text>
          <Button
            title="Enable Camera Access"
            onPress={requestPermission}
            style={styles.permissionButton}
          />
          <Button
            title="Use Photo Library Instead"
            onPress={pickImageFromLibrary}
            variant="outline"
            style={styles.libraryButton}
          />
        </View>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;

    setIsLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (photo?.uri) {
        // Perform AI analysis
        console.log('🤖 Starting AI analysis...');
        
        try {
          const analysis = await AIService.analyzeImageWithContext(photo.uri, {
            projectType: 'General Construction',
            location: 'UK',
            // Add any other context from user preferences
          });
          
          console.log('✅ Analysis complete:', analysis.projectType);
          
          // Navigate to results with both image and analysis
          navigation.navigate('Results', { 
            imageUri: photo.uri,
            analysis: analysis
          });
        } catch (analysisError) {
          console.error('Analysis failed:', analysisError);
          
          // Still navigate to results even if analysis fails
          navigation.navigate('Results', { 
            imageUri: photo.uri,
            analysis: null
          });
          
          Alert.alert(
            'Analysis Notice',
            'Image captured successfully, but analysis is temporarily unavailable. You can still view your photo.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(
        'Camera Error', 
        'Failed to take picture. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  async function pickImageFromLibrary() {
    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Perform AI analysis
        console.log('🤖 Starting AI analysis for library image...');
        
        try {
          const analysis = await AIService.analyzeImageWithContext(asset.uri, {
            projectType: 'General Construction',
            location: 'UK',
          });
          
          console.log('✅ Analysis complete:', analysis.projectType);
          
          // Navigate to results with both image and analysis
          navigation.navigate('Results', { 
            imageUri: asset.uri,
            analysis: analysis
          });
        } catch (analysisError) {
          console.error('Analysis failed:', analysisError);
          
          // Still navigate to results even if analysis fails
          navigation.navigate('Results', { 
            imageUri: asset.uri,
            analysis: null
          });
          
          Alert.alert(
            'Analysis Notice',
            'Image loaded successfully, but analysis is temporarily unavailable.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert(
        'Gallery Error', 
        'Failed to pick image. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designTokens.colors.primary[500]} />
        <Text style={styles.loadingText}>Analyzing your project...</Text>
        <Text style={styles.loadingSubText}>This may take a few moments</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        {/* Header overlay */}
        <View style={styles.headerOverlay}>
          <Text style={styles.instructionText}>
            📷 Point your camera at the area you want to renovate
          </Text>
        </View>

        {/* Camera viewfinder frame */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinder}>
            <View style={styles.corner} style={[styles.corner, styles.topLeft]} />
            <View style={styles.corner} style={[styles.corner, styles.topRight]} />
            <View style={styles.corner} style={[styles.corner, styles.bottomLeft]} />
            <View style={styles.corner} style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Bottom controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={styles.galleryButton} 
            onPress={pickImageFromLibrary}
          >
            <Text style={styles.controlButtonText}>📁</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.captureButton} 
            onPress={takePicture}
            disabled={isLoading}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.flipButton} 
            onPress={toggleCameraFacing}
          >
            <Text style={styles.controlButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Help text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            💡 Tip: Take clear photos with good lighting for best results
          </Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  
  // Permission screens
  permissionContainer: {
    flex: 1,
    backgroundColor: designTokens.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designTokens.spacing.xl,
  },
  permissionContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  permissionTitle: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.text.primary,
    textAlign: 'center',
    marginBottom: designTokens.spacing.lg,
  },
  permissionText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    lineHeight: designTokens.typography.lineHeight.lg,
    marginBottom: designTokens.spacing.xl,
  },
  permissionButton: {
    marginBottom: designTokens.spacing.md,
  },
  libraryButton: {
    marginTop: designTokens.spacing.sm,
  },

  // Loading screen
  loadingContainer: {
    flex: 1,
    backgroundColor: designTokens.colors.navy[900],
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.inverse,
    marginTop: designTokens.spacing.lg,
  },
  loadingSubText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.inverse,
    marginTop: designTokens.spacing.xs,
    opacity: 0.8,
  },

  // Camera overlays
  headerOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  instructionText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: '#fff',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.lg,
    marginHorizontal: designTokens.spacing.lg,
  },

  // Viewfinder
  viewfinderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinder: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.8,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: designTokens.colors.primary[500],
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },

  // Controls
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.xl,
  },
  galleryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  flipButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  controlButtonText: {
    fontSize: 24,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: designTokens.colors.primary[500],
  },

  // Help text
  helpContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  helpText: {
    fontSize: designTokens.typography.fontSize.xs,
    color: '#fff',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.md,
    marginHorizontal: designTokens.spacing.lg,
  },
});