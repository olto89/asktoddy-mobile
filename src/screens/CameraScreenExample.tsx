/**
 * CameraScreenExample - Demonstrates how to use the extracted camera hooks
 * This shows how the old CameraScreen functionality can be rebuilt using hooks
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useCamera, useImageAnalysis } from '../hooks';
import designTokens from '../styles/designTokens';
import Button from '../components/ui/Button';

type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Camera'>;

interface Props {
  navigation: CameraScreenNavigationProp;
}

const { width: screenWidth } = Dimensions.get('window');

export default function CameraScreenExample({ navigation }: Props) {
  // Use the extracted hooks
  const {
    facing,
    isLoading: cameraLoading,
    permission,
    cameraRef,
    takePicture,
    pickImageFromLibrary,
    toggleCameraFacing,
    requestPermission,
  } = useCamera({
    onImageCaptured: handleImageCaptured,
    onError: (error) => console.error('Camera error:', error),
  });

  const {
    isAnalyzing,
    analyzeImage,
  } = useImageAnalysis({
    onAnalysisComplete: (result) => {
      if (result.success && result.data) {
        // Navigate to results with analysis
        navigation.navigate('Results', {
          imageUri: lastCapturedImage,
          analysis: result.data,
        });
      } else {
        // Navigate to results without analysis
        navigation.navigate('Results', {
          imageUri: lastCapturedImage,
          analysis: null,
        });
      }
    },
  });

  const [lastCapturedImage, setLastCapturedImage] = React.useState<string | null>(null);

  function handleImageCaptured(uri: string) {
    console.log('📷 Image captured:', uri);
    setLastCapturedImage(uri);
    
    // Auto-analyze the captured image
    analyzeImage(uri, {
      location: 'UK',
      projectType: 'General Construction',
      preferredProvider: 'auto',
    });
  }

  const isLoading = cameraLoading || isAnalyzing;

  // Permission loading state
  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color={designTokens.colors.primary[500]} />
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  // Permission denied state
  if (!permission.granted) {
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

  // Loading state during capture/analysis
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designTokens.colors.primary[500]} />
        <Text style={styles.loadingText}>
          {isAnalyzing ? 'Analyzing your project...' : 'Capturing image...'}
        </Text>
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
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
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