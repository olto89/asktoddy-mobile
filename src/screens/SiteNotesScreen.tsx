import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import designTokens from '../styles/designTokens';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

// Job type templates for guided capture
const JOB_TYPES = [
  { id: 'extension', label: 'Extension', icon: 'home-outline' },
  { id: 'bathroom', label: 'Bathroom', icon: 'water-outline' },
  { id: 'kitchen', label: 'Kitchen', icon: 'restaurant-outline' },
  { id: 'roofing', label: 'Roofing', icon: 'umbrella-outline' },
  { id: 'renovation', label: 'Renovation', icon: 'hammer-outline' },
  { id: 'other', label: 'Other', icon: 'construct-outline' },
];

const PROPERTY_TYPES = ['Detached', 'Semi-Detached', 'Terraced', 'Flat', 'Bungalow'];

const COMMON_TASKS = {
  extension: [
    'Planning',
    'Foundations',
    'Structural Work',
    'Roofing',
    'Windows/Doors',
    'Insulation',
    'Plastering',
    'Electrics',
    'Plumbing',
  ],
  bathroom: [
    'Strip Out',
    'Plumbing First Fix',
    'Electrics',
    'Tiling',
    'Suite Installation',
    'Plastering',
    'Decoration',
  ],
  kitchen: [
    'Remove Old Kitchen',
    'Electrical Work',
    'Plumbing',
    'Plastering',
    'Units Installation',
    'Worktops',
    'Appliances',
    'Decoration',
  ],
  roofing: [
    'Strip Tiles/Slates',
    'Repair Battens',
    'Felt/Membrane',
    'New Tiles/Slates',
    'Ridge Tiles',
    'Guttering',
    'Fascias/Soffits',
  ],
  renovation: [
    'Structural Assessment',
    'Demolition',
    'Building Work',
    'Plumbing',
    'Electrical',
    'Plastering',
    'Decoration',
    'Flooring',
  ],
  other: [
    'Demolition/Removal',
    'Structural Work',
    'Roofing',
    'Windows/Doors',
    'Plumbing',
    'Electrical',
    'Plastering',
    'Decoration',
  ],
};

interface SiteNote {
  id: string;
  timestamp: number;
  address: string;
  jobType: string;
  propertyType: string;
  size: string;
  tasks: string[];
  notes: string;
  photos: string[];
  voiceNotes: string;
  syncStatus: 'local' | 'syncing' | 'synced';
  status: 'draft' | 'generated' | 'completed'; // Track quote generation status
  lastModified: number;
}

export default function SiteNotesScreen({ navigation, route }: any) {
  const { existingQuote } = route.params || {}; // For editing existing drafts

  // If existingQuote is explicitly null, start fresh (New Assessment button)
  const isNewAssessment = existingQuote === null;
  const quote = isNewAssessment ? null : existingQuote;

  const [currentQuoteId, setCurrentQuoteId] = useState<string | null>(quote?.id || null);
  const [address, setAddress] = useState(quote?.address || '');
  const [selectedJobType, setSelectedJobType] = useState(quote?.jobType || '');
  const [selectedPropertyType, setSelectedPropertyType] = useState(quote?.propertyType || '');
  const [size, setSize] = useState(quote?.size || '');
  const [selectedTasks, setSelectedTasks] = useState<string[]>(quote?.tasks || []);
  const [additionalNotes, setAdditionalNotes] = useState(quote?.notes || '');
  const [photos, setPhotos] = useState<string[]>(quote?.photos || []);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState(quote?.voiceNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-save draft whenever form data changes
  useEffect(() => {
    const hasAnyData =
      address.trim() ||
      selectedJobType ||
      selectedPropertyType ||
      size.trim() ||
      selectedTasks.length > 0 ||
      additionalNotes.trim() ||
      voiceTranscript.trim() ||
      photos.length > 0;

    // Only auto-save if there's meaningful data AND it's not a fresh new assessment
    const shouldAutoSave = hasAnyData && !isSaving && (!isNewAssessment || currentQuoteId);

    if (shouldAutoSave) {
      const timeoutId = setTimeout(() => {
        autoSaveDraft();
      }, 1000); // Auto-save after 1 second of no changes

      return () => clearTimeout(timeoutId);
    }
  }, [
    address,
    selectedJobType,
    selectedPropertyType,
    size,
    selectedTasks,
    additionalNotes,
    voiceTranscript,
    photos,
  ]);

  // Auto-save draft function
  const autoSaveDraft = async () => {
    try {
      setIsSaving(true);

      const quoteId =
        currentQuoteId || `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const draftQuote: SiteNote = {
        id: quoteId,
        timestamp: currentQuoteId ? existingQuote?.timestamp || Date.now() : Date.now(),
        lastModified: Date.now(),
        address,
        jobType: selectedJobType,
        propertyType: selectedPropertyType,
        size,
        tasks: selectedTasks,
        notes: additionalNotes,
        photos,
        voiceNotes: voiceTranscript,
        syncStatus: 'local',
        status: 'draft',
      };

      // Get existing saved quotes
      const existingQuotesJson = await AsyncStorage.getItem('saved_quotes');
      const existingQuotes = existingQuotesJson ? JSON.parse(existingQuotesJson) : [];

      // Update or add the draft
      const updatedQuotes = existingQuotes.filter((q: any) => q.id !== quoteId);
      updatedQuotes.push(draftQuote);

      // Sort by last modified (most recent first)
      updatedQuotes.sort((a: any, b: any) => b.lastModified - a.lastModified);

      await AsyncStorage.setItem('saved_quotes', JSON.stringify(updatedQuotes));

      if (!currentQuoteId) {
        setCurrentQuoteId(quoteId);
        console.log('📝 Created new draft quote:', quoteId);
      } else {
        console.log('💾 Auto-saved draft quote:', quoteId);
      }

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error auto-saving draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Check for required fields
  const canGenerateQuote = () => {
    return (
      address.trim() !== '' &&
      selectedJobType !== '' &&
      (selectedTasks.length > 0 ||
        additionalNotes.trim().length > 50 ||
        voiceTranscript.trim().length > 50)
    );
  };

  // Toggle task selection
  const toggleTask = (task: string) => {
    setSelectedTasks(prev => {
      const newTasks = prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task];
      setHasUnsavedChanges(true);
      return newTasks;
    });
  };

  // Handle photo capture
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
      setHasUnsavedChanges(true);
    }
  };

  // Mock voice recording (will implement real voice-to-text in next step)
  const handleVoiceRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      // Mock transcript for now
      const mockTranscript =
        'Need to remove existing conservatory roof, install new insulated roof system with anthracite grey windows and doors.';
      setVoiceTranscript(prev => prev + ' ' + mockTranscript);
      setHasUnsavedChanges(true);
      Alert.alert(
        'Voice Note Added',
        'Your voice note has been transcribed and added to the notes.'
      );
    } else {
      // Start recording
      setIsRecording(true);
      Alert.alert('Recording Started', 'Speak clearly about the work required...');
    }
  };

  // Save notes locally
  const handleSaveLocal = async () => {
    const siteNote: SiteNote = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      address,
      jobType: selectedJobType,
      propertyType: selectedPropertyType,
      size,
      tasks: selectedTasks,
      notes: additionalNotes,
      photos,
      voiceNotes: voiceTranscript,
      syncStatus: 'local',
    };

    try {
      // Get existing notes
      const existingNotes = await AsyncStorage.getItem('site_notes');
      const notes = existingNotes ? JSON.parse(existingNotes) : [];

      // Add new note
      notes.push(siteNote);

      // Save back
      await AsyncStorage.setItem('site_notes', JSON.stringify(notes));

      Alert.alert('Saved', 'Site notes saved locally. You can generate a quote when online.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save notes locally');
    }
  };

  // Check network connectivity
  const checkNetworkConnectivity = async (): Promise<boolean> => {
    try {
      // Simple connectivity check
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  // Generate quote (navigate to AI processing)
  const handleGenerateQuote = async () => {
    if (!canGenerateQuote()) {
      Alert.alert(
        'More Information Needed',
        'Please provide address, job type, and describe the work required.'
      );
      return;
    }

    setIsSaving(true);

    // Check network connectivity first
    const isOnline = await checkNetworkConnectivity();

    if (!isOnline) {
      // Save the complete draft for later submission
      const offlineQuote = {
        id: currentQuoteId || `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: existingQuote?.timestamp || Date.now(),
        lastModified: Date.now(),
        address,
        jobType: selectedJobType,
        propertyType: selectedPropertyType,
        size,
        tasks: selectedTasks,
        notes: additionalNotes + '\n' + voiceTranscript,
        photos,
        voiceNotes: voiceTranscript,
        syncStatus: 'local',
        status: 'draft', // Keep as draft since we couldn't generate
        pendingGeneration: true, // Flag for later processing
      };

      try {
        const existingQuotesJson = await AsyncStorage.getItem('saved_quotes');
        const existingQuotes = existingQuotesJson ? JSON.parse(existingQuotesJson) : [];

        const updatedQuotes = existingQuotes.filter((q: any) => q.id !== offlineQuote.id);
        updatedQuotes.push(offlineQuote);
        updatedQuotes.sort((a: any, b: any) => b.lastModified - a.lastModified);

        await AsyncStorage.setItem('saved_quotes', JSON.stringify(updatedQuotes));

        setIsSaving(false);

        Alert.alert(
          '📱 Saved for Later',
          "No internet connection detected. I've saved all your quote details safely! You can try generating the quote again when you have connectivity.",
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
        return;
      } catch (error) {
        console.error('Error saving offline quote:', error);
        Alert.alert('Error', 'Failed to save quote details. Please try again.');
        setIsSaving(false);
        return;
      }
    }

    // Online - proceed with normal flow
    if (currentQuoteId) {
      try {
        const existingQuotesJson = await AsyncStorage.getItem('saved_quotes');
        const existingQuotes = existingQuotesJson ? JSON.parse(existingQuotesJson) : [];

        const updatedQuotes = existingQuotes.map((quote: any) =>
          quote.id === currentQuoteId
            ? { ...quote, status: 'generated', lastModified: Date.now() }
            : quote
        );

        await AsyncStorage.setItem('saved_quotes', JSON.stringify(updatedQuotes));
      } catch (error) {
        console.error('Error updating quote status:', error);
      }
    }

    // Prepare notes data
    const siteNotes = {
      id: currentQuoteId,
      address,
      jobType: selectedJobType,
      propertyType: selectedPropertyType,
      size,
      tasks: selectedTasks,
      notes: additionalNotes + '\n' + voiceTranscript,
      photos,
      timestamp: existingQuote?.timestamp || Date.now(),
    };

    // Save to AsyncStorage for persistence
    await AsyncStorage.setItem('current_site_notes', JSON.stringify(siteNotes));

    // Navigate to task extraction/quote generation
    navigation.navigate('TaskList', { siteNotes });
    setIsSaving(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🏗️ Site Assessment</Text>
            <View style={styles.headerRight}>
              {isSaving && (
                <View style={styles.autoSaveIndicator}>
                  <ActivityIndicator size="small" color={designTokens.colors.primary[500]} />
                  <Text style={styles.autoSaveText}>Auto-saving...</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Coming Soon', 'Saved notes feature will be added in next update')
                }
              >
                <Ionicons
                  name="folder-outline"
                  size={24}
                  color={designTokens.colors.text.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Address Input */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Property Address</Text>
            <View style={styles.addressRow}>
              <TextInput
                style={styles.addressInput}
                placeholder="Enter property address..."
                value={address}
                onChangeText={text => {
                  setAddress(text);
                  setHasUnsavedChanges(true);
                }}
                placeholderTextColor={designTokens.colors.text.tertiary}
              />
              <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                <Ionicons
                  name="camera-outline"
                  size={24}
                  color={designTokens.colors.primary[500]}
                />
              </TouchableOpacity>
            </View>
            {photos.length > 0 && (
              <Text style={styles.photoCount}>{photos.length} photo(s) added</Text>
            )}
          </Card>

          {/* Job Type Selection */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Job Type</Text>
            <View style={styles.jobTypeGrid}>
              {JOB_TYPES.map(job => (
                <TouchableOpacity
                  key={job.id}
                  style={[
                    styles.jobTypeButton,
                    selectedJobType === job.id && styles.jobTypeButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedJobType(job.id);
                    setHasUnsavedChanges(true);
                  }}
                >
                  <Ionicons
                    name={job.icon as any}
                    size={24}
                    color={
                      selectedJobType === job.id ? 'white' : designTokens.colors.text.secondary
                    }
                  />
                  <Text
                    style={[
                      styles.jobTypeLabel,
                      selectedJobType === job.id && styles.jobTypeLabelActive,
                    ]}
                  >
                    {job.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Quick Details */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>🏠 Quick Details</Text>

            {/* Property Type */}
            <Text style={styles.fieldLabel}>Property Type</Text>
            <View style={styles.propertyTypeRow}>
              {PROPERTY_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.propertyTypeButton,
                    selectedPropertyType === type && styles.propertyTypeButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedPropertyType(type);
                    setHasUnsavedChanges(true);
                  }}
                >
                  <Text
                    style={[
                      styles.propertyTypeText,
                      selectedPropertyType === type && styles.propertyTypeTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Size Input */}
            <Text style={styles.fieldLabel}>Approximate Size</Text>
            <TextInput
              style={styles.sizeInput}
              placeholder="e.g., 45m² or describe as small/medium/large"
              value={size}
              onChangeText={text => {
                setSize(text);
                setHasUnsavedChanges(true);
              }}
              placeholderTextColor={designTokens.colors.text.tertiary}
            />
          </Card>

          {/* Common Tasks */}
          {selectedJobType && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>🔧 What needs doing?</Text>
              <View style={styles.tasksGrid}>
                {COMMON_TASKS[selectedJobType as keyof typeof COMMON_TASKS].map(task => (
                  <TouchableOpacity
                    key={task}
                    style={[
                      styles.taskButton,
                      selectedTasks.includes(task) && styles.taskButtonActive,
                    ]}
                    onPress={() => toggleTask(task)}
                  >
                    <Ionicons
                      name={selectedTasks.includes(task) ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={
                        selectedTasks.includes(task)
                          ? designTokens.colors.primary[500]
                          : designTokens.colors.text.tertiary
                      }
                    />
                    <Text style={styles.taskText}>{task}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          )}

          {/* Additional Notes */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Additional Notes</Text>
            <View style={styles.notesActions}>
              <TouchableOpacity
                style={[styles.actionButton, isRecording && styles.actionButtonActive]}
                onPress={handleVoiceRecording}
              >
                <Ionicons
                  name={isRecording ? 'stop-circle' : 'mic-outline'}
                  size={24}
                  color={isRecording ? 'white' : designTokens.colors.primary[500]}
                />
                <Text
                  style={[styles.actionButtonText, isRecording && styles.actionButtonTextActive]}
                >
                  {isRecording ? 'Stop' : 'Voice'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleTakePhoto}>
                <Ionicons
                  name="camera-outline"
                  size={24}
                  color={designTokens.colors.primary[500]}
                />
                <Text style={styles.actionButtonText}>Photo</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.notesInput}
              placeholder="Type additional details here or use voice notes..."
              value={additionalNotes}
              onChangeText={text => {
                setAdditionalNotes(text);
                setHasUnsavedChanges(true);
              }}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={designTokens.colors.text.tertiary}
            />

            {voiceTranscript !== '' && (
              <View style={styles.voiceTranscriptBox}>
                <Text style={styles.voiceTranscriptLabel}>Voice Notes:</Text>
                <Text style={styles.voiceTranscript}>{voiceTranscript}</Text>
              </View>
            )}
          </Card>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              title="Save Offline"
              onPress={handleSaveLocal}
              variant="secondary"
              style={styles.saveButton}
              icon={
                <Ionicons
                  name="save-outline"
                  size={20}
                  color={designTokens.colors.text.secondary}
                />
              }
            />
            <Button
              title="Generate Quote"
              onPress={handleGenerateQuote}
              variant="primary"
              disabled={!canGenerateQuote() || isSaving}
              style={styles.generateButton}
              icon={
                isSaving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Ionicons name="sparkles" size={20} color="white" />
                )
              }
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.background.primary,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
  },
  title: {
    fontSize: designTokens.typography.fontSize['2xl'],
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
  },
  section: {
    marginHorizontal: designTokens.spacing.md,
    marginBottom: designTokens.spacing.md,
    padding: designTokens.spacing.md,
  },
  sectionTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.md,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: designTokens.colors.border.primary,
    borderRadius: designTokens.borderRadius.lg,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.primary,
  },
  photoButton: {
    marginLeft: designTokens.spacing.sm,
    padding: designTokens.spacing.sm,
  },
  photoCount: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    marginTop: designTokens.spacing.xs,
  },
  jobTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.sm,
  },
  jobTypeButton: {
    width: '31%',
    padding: designTokens.spacing.md,
    borderWidth: 1,
    borderColor: designTokens.colors.border.primary,
    borderRadius: designTokens.borderRadius.lg,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  jobTypeButtonActive: {
    backgroundColor: designTokens.colors.primary[500],
    borderColor: designTokens.colors.primary[500],
  },
  jobTypeLabel: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.secondary,
    marginTop: designTokens.spacing.xs,
  },
  jobTypeLabelActive: {
    color: 'white',
  },
  fieldLabel: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.secondary,
    marginBottom: designTokens.spacing.xs,
    marginTop: designTokens.spacing.sm,
  },
  propertyTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.xs,
  },
  propertyTypeButton: {
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.xs,
    borderWidth: 1,
    borderColor: designTokens.colors.border.primary,
    borderRadius: designTokens.borderRadius.full,
    backgroundColor: 'white',
  },
  propertyTypeButtonActive: {
    backgroundColor: designTokens.colors.primary[500],
    borderColor: designTokens.colors.primary[500],
  },
  propertyTypeText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
  },
  propertyTypeTextActive: {
    color: 'white',
  },
  sizeInput: {
    borderWidth: 1,
    borderColor: designTokens.colors.border.primary,
    borderRadius: designTokens.borderRadius.lg,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.primary,
  },
  tasksGrid: {
    flexDirection: 'column',
    gap: designTokens.spacing.xs,
  },
  taskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designTokens.spacing.sm,
    borderWidth: 1,
    borderColor: designTokens.colors.border.primary,
    borderRadius: designTokens.borderRadius.md,
    backgroundColor: 'white',
  },
  taskButtonActive: {
    backgroundColor: designTokens.colors.primary[50],
    borderColor: designTokens.colors.primary[500],
  },
  taskText: {
    marginLeft: designTokens.spacing.sm,
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.primary,
  },
  notesActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.sm,
    marginBottom: designTokens.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    borderWidth: 1,
    borderColor: designTokens.colors.primary[500],
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: 'white',
    gap: designTokens.spacing.xs,
  },
  actionButtonActive: {
    backgroundColor: designTokens.colors.primary[500],
  },
  actionButtonText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.primary[500],
    fontWeight: designTokens.typography.fontWeight.medium as any,
  },
  actionButtonTextActive: {
    color: 'white',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: designTokens.colors.border.primary,
    borderRadius: designTokens.borderRadius.lg,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.primary,
    minHeight: 100,
  },
  voiceTranscriptBox: {
    marginTop: designTokens.spacing.md,
    padding: designTokens.spacing.sm,
    backgroundColor: designTokens.colors.primary[50],
    borderRadius: designTokens.borderRadius.md,
  },
  voiceTranscriptLabel: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.primary[600],
    marginBottom: designTokens.spacing.xs,
  },
  voiceTranscript: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.primary,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.lg,
    gap: designTokens.spacing.sm,
  },
  saveButton: {
    flex: 1,
  },
  generateButton: {
    flex: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  autoSaveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
  },
  autoSaveText: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.secondary,
    fontStyle: 'italic',
  },
});
