import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import designTokens from '../styles/designTokens';
import Button from '../components/ui/Button';

type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Camera'>;

interface Props {
  navigation: CameraScreenNavigationProp;
}

export default function CameraScreen({ navigation }: Props) {
  const handleTestNavigation = () => {
    // Mock navigation to results with placeholder data
    navigation.navigate('Results', { 
      imageUri: 'placeholder-image-uri',
      analysis: { mock: 'data' }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Camera Screen</Text>
        <Text style={styles.subtitle}>
          Camera functionality will be implemented in ASK-25
        </Text>
        
        <Button
          title="Test Navigation to Results"
          onPress={handleTestNavigation}
          style={styles.testButton}
        />
        
        <Button
          title="Back to Home"
          onPress={() => navigation.goBack()}
          variant="outline"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.surface,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designTokens.spacing.xl,
  },
  title: {
    fontSize: designTokens.typography.fontSize['2xl'],
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    marginBottom: designTokens.spacing['2xl'],
    lineHeight: designTokens.typography.lineHeight.lg,
  },
  testButton: {
    marginBottom: designTokens.spacing.lg,
  },
});