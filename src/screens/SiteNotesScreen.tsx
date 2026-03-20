import React, { useState, useEffect, useRef } from 'react';
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
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import designTokens from '../styles/designTokens';
import { AppIcons, IconSize } from '../styles/iconRegistry';
import { useAuth } from '../contexts/AuthContext';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import type { VoiceRecording } from '../hooks/useVoiceRecording';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { quoteStorage } from '../services/QuoteStorageService';
import type { SiteNote, DraftFormData } from '../types/Quote';

// Job type templates for guided capture
const JOB_TYPES = [
  { id: 'extension', label: 'Extension', icon: 'home-outline' },
  { id: 'bathroom', label: 'Bathroom', icon: 'water-outline' },
  { id: 'kitchen', label: 'Kitchen', icon: 'restaurant-outline' },
  { id: 'patio', label: 'Patio', icon: 'grid-outline' },
  { id: 'driveway', label: 'Driveway', icon: 'car-outline' },
  { id: 'conservatory', label: 'Conservatory', icon: 'sunny-outline' },
  { id: 'roofing', label: 'Roofing', icon: 'umbrella-outline' },
  { id: 'renovation', label: 'Renovation', icon: 'hammer-outline' },
  { id: 'other', label: 'Other', icon: 'construct-outline' },
];

const PROPERTY_TYPES = ['Detached', 'Semi-Detached', 'Terraced', 'Flat', 'Bungalow'];

// Construction methods with price multipliers per job type
const CONSTRUCTION_METHODS: Record<string, { id: string; label: string; multiplier: number }[]> = {
  extension: [
    { id: 'brick', label: 'Brick/Block', multiplier: 1.0 },
    { id: 'timber_frame', label: 'Timber Frame', multiplier: 0.9 },
    { id: 'steel_frame', label: 'Steel Frame', multiplier: 1.3 },
    { id: 'sips', label: 'SIPs Panel', multiplier: 1.15 },
    { id: 'modular', label: 'Modular/Prefab', multiplier: 0.85 },
  ],
  bathroom: [
    { id: 'standard', label: 'Standard', multiplier: 1.0 },
    { id: 'wet_room', label: 'Wet Room', multiplier: 1.25 },
    { id: 'accessible', label: 'Accessible/Mobility', multiplier: 1.35 },
  ],
  kitchen: [
    { id: 'flat_pack', label: 'Flat Pack', multiplier: 0.7 },
    { id: 'semi_custom', label: 'Semi-Custom', multiplier: 1.0 },
    { id: 'bespoke', label: 'Bespoke/Handmade', multiplier: 1.6 },
  ],
  patio: [
    { id: 'concrete_slabs', label: 'Concrete Slabs', multiplier: 0.8 },
    { id: 'block_paving', label: 'Block Paving', multiplier: 1.0 },
    { id: 'porcelain', label: 'Porcelain Tiles', multiplier: 1.3 },
    { id: 'natural_stone', label: 'Natural Stone', multiplier: 1.5 },
    { id: 'resin_bound', label: 'Resin Bound', multiplier: 1.2 },
  ],
  driveway: [
    { id: 'gravel', label: 'Gravel', multiplier: 0.5 },
    { id: 'tarmac', label: 'Tarmac', multiplier: 0.8 },
    { id: 'block_paving', label: 'Block Paving', multiplier: 1.0 },
    { id: 'resin_bound', label: 'Resin Bound', multiplier: 1.3 },
    { id: 'concrete', label: 'Pattern Concrete', multiplier: 0.9 },
  ],
  conservatory: [
    { id: 'upvc', label: 'uPVC', multiplier: 0.85 },
    { id: 'aluminium', label: 'Aluminium', multiplier: 1.15 },
    { id: 'timber', label: 'Hardwood Timber', multiplier: 1.4 },
    { id: 'orangery', label: 'Orangery Style', multiplier: 1.5 },
  ],
  roofing: [
    { id: 'concrete_tiles', label: 'Concrete Tiles', multiplier: 0.85 },
    { id: 'clay_tiles', label: 'Clay Tiles', multiplier: 1.1 },
    { id: 'slate', label: 'Natural Slate', multiplier: 1.4 },
    { id: 'flat_epdm', label: 'Flat Roof (EPDM)', multiplier: 0.9 },
    { id: 'flat_grp', label: 'Flat Roof (GRP)', multiplier: 1.0 },
  ],
  renovation: [
    { id: 'cosmetic', label: 'Cosmetic Only', multiplier: 0.6 },
    { id: 'standard', label: 'Standard Refurb', multiplier: 1.0 },
    { id: 'structural', label: 'Structural Work', multiplier: 1.4 },
    { id: 'full', label: 'Full Renovation', multiplier: 1.6 },
  ],
  other: [{ id: 'standard', label: 'Standard', multiplier: 1.0 }],
};

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
  patio: [
    'Site Clearance',
    'Ground Preparation',
    'Sub-base/Hardcore',
    'Edging/Border',
    'Paving/Slabs',
    'Pointing/Jointing',
    'Drainage',
    'Outdoor Lighting',
  ],
  driveway: [
    'Site Clearance',
    'Excavation',
    'Sub-base Installation',
    'Edging/Kerbs',
    'Block Paving',
    'Tarmac/Resin',
    'Drainage',
    'Drop Kerb',
  ],
  conservatory: [
    'Planning/Building Regs',
    'Foundations',
    'Dwarf Walls',
    'Frame Installation',
    'Glazing',
    'Roof System',
    'Electrics',
    'Flooring',
    'Heating',
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

// Standalone save function so unmount cleanup can call it without stale closures
async function saveDraftToStorage(formData: DraftFormData): Promise<string> {
  const quoteId =
    formData.currentQuoteId || `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const methodData = CONSTRUCTION_METHODS[formData.selectedJobType]?.find(
    m => m.id === formData.selectedConstructionMethod
  );

  // If the quote already exists, preserve any generated data (tasks, costs, AI analysis)
  // that was saved by TaskListScreen — our form-only save must not overwrite those fields
  let existingGeneratedData: Partial<SiteNote> = {};
  if (formData.currentQuoteId) {
    try {
      const existing = await quoteStorage.getById(formData.currentQuoteId);
      if (existing) {
        existingGeneratedData = {
          generatedTasks: existing.generatedTasks,
          totalCost: existing.totalCost,
          finalCost: existing.finalCost,
          aiAnalysis: existing.aiAnalysis,
          siteNotes: existing.siteNotes,
          pendingGeneration: existing.pendingGeneration,
          quoteName: existing.quoteName,
          customerName: existing.customerName,
          projectNotes: existing.projectNotes,
        };
      }
    } catch (error) {
      console.error('Failed to read existing quote for merge:', error);
    }
  }

  const draftQuote: SiteNote = {
    ...existingGeneratedData,
    id: quoteId,
    timestamp: formData.currentQuoteId ? formData.existingTimestamp || Date.now() : Date.now(),
    lastModified: Date.now(),
    address: formData.address,
    jobType: formData.selectedJobType,
    constructionMethod: formData.selectedConstructionMethod || undefined,
    constructionMethodMultiplier: methodData?.multiplier || 1.0,
    propertyType: formData.selectedPropertyType,
    size: formData.size,
    tasks: formData.selectedTasks,
    notes: formData.additionalNotes,
    photos: formData.photos,
    voiceNotes: formData.voiceTranscript,
    voiceRecordings: formData.voiceRecordings,
    syncStatus: 'local',
    status: formData.existingStatus || 'draft',
  };

  await quoteStorage.save(draftQuote);
  return quoteId;
}

export default function SiteNotesScreen({ navigation, route }: any) {
  const { isAnonymous } = useAuth();
  const { existingQuote } = route.params || {}; // For editing existing drafts

  // If existingQuote is explicitly null, start fresh (New Assessment button)
  const isNewAssessment = existingQuote === null;
  const quote = isNewAssessment ? null : existingQuote;

  const [currentQuoteId, setCurrentQuoteId] = useState<string | null>(quote?.id || null);
  const [address, setAddress] = useState(quote?.address || '');
  const [selectedJobType, setSelectedJobType] = useState(quote?.jobType || '');
  const [selectedConstructionMethod, setSelectedConstructionMethod] = useState(
    quote?.constructionMethod || ''
  );
  const [selectedPropertyType, setSelectedPropertyType] = useState(quote?.propertyType || '');
  const [size, setSize] = useState(quote?.size || '');
  const [selectedTasks, setSelectedTasks] = useState<string[]>(quote?.tasks || []);
  const [additionalNotes, setAdditionalNotes] = useState(quote?.notes || '');
  const [photos, setPhotos] = useState<string[]>(quote?.photos || []);
  const [voiceTranscript, setVoiceTranscript] = useState(quote?.voiceNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { isOnline } = useNetworkStatus();

  const {
    isRecording,
    recordingDuration,
    voiceRecordings,
    playingUri,
    startRecording,
    stopRecording,
    playRecording,
    stopPlayback,
    removeRecording,
    formatDuration,
    setVoiceRecordings,
  } = useVoiceRecording(quote?.voiceRecordings || [], {
    onRecordingSaved: () => setHasUnsavedChanges(true),
    onRecordingRemoved: () => setHasUnsavedChanges(true),
  });

  // Track all form data in a ref so unmount cleanup can read current values
  const formDataRef = useRef<DraftFormData>({
    currentQuoteId,
    address,
    selectedJobType,
    selectedConstructionMethod,
    selectedPropertyType,
    size,
    selectedTasks,
    additionalNotes,
    photos,
    voiceTranscript,
    voiceRecordings,
    existingTimestamp: quote?.timestamp,
    existingStatus: quote?.status,
  });

  useEffect(() => {
    formDataRef.current = {
      currentQuoteId,
      address,
      selectedJobType,
      selectedConstructionMethod,
      selectedPropertyType,
      size,
      selectedTasks,
      additionalNotes,
      photos,
      voiceTranscript,
      voiceRecordings,
      existingTimestamp: quote?.timestamp,
      existingStatus: quote?.status,
    };
  }, [
    currentQuoteId,
    address,
    selectedJobType,
    selectedConstructionMethod,
    selectedPropertyType,
    size,
    selectedTasks,
    additionalNotes,
    photos,
    voiceTranscript,
    voiceRecordings,
    quote?.timestamp,
    quote?.status,
  ]);

  // Track isAnonymous in a ref so unmount cleanup can read it
  const isAnonymousRef = useRef(isAnonymous);
  useEffect(() => {
    isAnonymousRef.current = isAnonymous;
  }, [isAnonymous]);

  // Save draft on unmount so navigating away preserves work
  useEffect(() => {
    return () => {
      if (isAnonymousRef.current) return;

      const data = formDataRef.current;
      const hasAnyData =
        data.address.trim() ||
        data.selectedJobType ||
        data.selectedConstructionMethod ||
        data.selectedPropertyType ||
        data.size.trim() ||
        data.selectedTasks.length > 0 ||
        data.additionalNotes.trim() ||
        data.voiceTranscript.trim() ||
        data.voiceRecordings.length > 0 ||
        data.photos.length > 0;

      if (hasAnyData) {
        // Fire-and-forget — component is unmounting
        saveDraftToStorage(data).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ref for the auto-save debounce timer so handleGenerateQuote can cancel it
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rate-limit ref: track the last time a quote was generated
  const lastGenerationRef = useRef<number>(0);

  // Guard ref to prevent overlapping auto-saves
  const isSavingRef = useRef(false);

  // Auto-save draft whenever form data changes
  useEffect(() => {
    const hasAnyData =
      address.trim() ||
      selectedJobType ||
      selectedConstructionMethod ||
      selectedPropertyType ||
      size.trim() ||
      selectedTasks.length > 0 ||
      additionalNotes.trim() ||
      voiceTranscript.trim() ||
      voiceRecordings.length > 0 ||
      photos.length > 0;

    // Only auto-save if authenticated and has meaningful data
    const shouldAutoSave = !isAnonymous && hasAnyData;

    if (shouldAutoSave) {
      autoSaveTimerRef.current = setTimeout(() => {
        autoSaveTimerRef.current = null;
        if (!isSavingRef.current) {
          autoSaveDraft();
        }
      }, 1000); // Auto-save after 1 second of no changes

      return () => {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
          autoSaveTimerRef.current = null;
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isAnonymous,
    address,
    selectedJobType,
    selectedConstructionMethod,
    selectedPropertyType,
    size,
    selectedTasks,
    additionalNotes,
    voiceTranscript,
    voiceRecordings,
    photos,
  ]);

  // Auto-save draft function — reads from formDataRef to avoid stale closures
  const autoSaveDraft = async () => {
    if (isSavingRef.current) return; // Already saving
    try {
      isSavingRef.current = true;
      setSaveStatus('saving');

      const data = formDataRef.current;
      const quoteId = await saveDraftToStorage(data);

      if (!data.currentQuoteId) {
        setCurrentQuoteId(quoteId);
        console.log('📝 Created new draft quote:', quoteId);
      } else {
        console.log('💾 Auto-saved draft quote:', quoteId);
      }

      setHasUnsavedChanges(false);
      setSaveStatus('saved');

      // Auto-hide "Saved" after 2 seconds
      setTimeout(() => {
        setSaveStatus(prev => (prev === 'saved' ? 'idle' : prev));
      }, 2000);
    } catch (error) {
      console.error('Error auto-saving draft:', error);
      setSaveStatus('idle');
    } finally {
      isSavingRef.current = false;
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
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      if (!permissionResult.canAskAgain) {
        Alert.alert(
          'Camera Access',
          'AskToddy needs camera access to photograph your project. Please enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      } else {
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
      }
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

  const handleVoiceRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Pick photo from gallery
  const handlePickFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      if (!permissionResult.canAskAgain) {
        Alert.alert(
          'Photo Library Access',
          'AskToddy needs access to your photo library to select project images. Please enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      } else {
        Alert.alert('Permission needed', 'Photo library permission is required to select photos');
      }
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map(asset => asset.uri);
      setPhotos(prev => [...prev, ...newPhotos]);
      setHasUnsavedChanges(true);
    }
  };

  // Remove a specific photo
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  // Clear voice transcript
  const clearVoiceTranscript = () => {
    Alert.alert('Clear Voice Notes', 'Are you sure you want to remove all voice notes?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setVoiceTranscript('');
          setHasUnsavedChanges(true);
        },
      },
    ]);
  };

  // Save notes locally
  const handleSaveLocal = async () => {
    const siteNote: SiteNote = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      address,
      jobType: selectedJobType,
      constructionMethod: selectedConstructionMethod || undefined,
      propertyType: selectedPropertyType,
      size,
      tasks: selectedTasks,
      notes: additionalNotes,
      photos,
      voiceNotes: voiceTranscript,
      voiceRecordings,
      syncStatus: 'local',
      status: 'draft',
      lastModified: Date.now(),
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
    // Rate limit: prevent rapid-fire taps (10-second cooldown)
    const now = Date.now();
    if (now - lastGenerationRef.current < 10000) {
      Alert.alert('Please Wait', 'Please wait before generating another quote.');
      return;
    }
    lastGenerationRef.current = now;

    if (!canGenerateQuote()) {
      Alert.alert(
        'More Information Needed',
        'Please provide address, job type, and describe the work required.'
      );
      return;
    }

    // Cancel any pending auto-save to prevent racing with the generate flow
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
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
        await quoteStorage.save(offlineQuote as SiteNote);

        setIsSaving(false);

        Alert.alert(
          'Saved for Later',
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
    // Ensure we have a quote ID before navigating (prevents duplicate quotes)
    let quoteId = currentQuoteId;
    if (!quoteId) {
      quoteId = await saveDraftToStorage(formDataRef.current);
      setCurrentQuoteId(quoteId);
      // Update formDataRef so unmount cleanup uses the same ID
      formDataRef.current.currentQuoteId = quoteId;
    }

    // Mark as generated in storage
    try {
      const existing = await quoteStorage.getById(quoteId);
      if (existing) {
        await quoteStorage.save({ ...existing, status: 'generated', lastModified: Date.now() });
      }
    } catch (error) {
      console.error('Error updating quote status:', error);
    }

    // Update formDataRef so unmount cleanup preserves 'generated' status
    formDataRef.current.existingStatus = 'generated';

    // Get the construction method data for quote generation
    const selectedMethodData = CONSTRUCTION_METHODS[selectedJobType]?.find(
      m => m.id === selectedConstructionMethod
    );

    // Prepare notes data
    const siteNotes = {
      id: quoteId,
      address,
      jobType: selectedJobType,
      constructionMethod: selectedConstructionMethod || undefined,
      constructionMethodLabel: selectedMethodData?.label || undefined,
      constructionMethodMultiplier: selectedMethodData?.multiplier || 1.0,
      propertyType: selectedPropertyType,
      size,
      tasks: selectedTasks,
      notes: additionalNotes + '\n' + voiceTranscript,
      photos,
      voiceRecordings,
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
            <View style={styles.titleRow}>
              <Ionicons
                name={AppIcons.siteAssessment}
                size={IconSize.large}
                color={designTokens.colors.text.primary}
              />
              <Text style={styles.title}>Site Assessment</Text>
            </View>
            <View style={styles.headerRight}>
              {saveStatus === 'saving' && (
                <View style={styles.autoSaveIndicator}>
                  <ActivityIndicator size="small" color={designTokens.colors.primary[500]} />
                  <Text style={styles.autoSaveText}>Saving...</Text>
                </View>
              )}
              {saveStatus === 'saved' && (
                <View style={styles.autoSaveIndicator}>
                  <Ionicons name="checkmark-circle" size={16} color={designTokens.colors.success} />
                  <Text
                    style={[
                      styles.autoSaveText,
                      { color: designTokens.colors.success, fontStyle: 'normal' },
                    ]}
                  >
                    Saved
                  </Text>
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

          {/* Offline Banner */}
          {isOnline === false && (
            <View style={styles.offlineBanner}>
              <Ionicons name={AppIcons.needsConnection} size={16} color="#92400e" />
              <Text style={styles.offlineBannerText}>Offline — your work is saved locally</Text>
            </View>
          )}

          {/* Address Input */}
          <Card style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons
                name={AppIcons.propertyAddress}
                size={IconSize.medium}
                color={designTokens.colors.text.primary}
              />
              <Text style={styles.sectionTitle}>Property Address</Text>
            </View>
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
          </Card>

          {/* Job Type Selection */}
          <Card style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons
                name={AppIcons.jobType}
                size={IconSize.medium}
                color={designTokens.colors.text.primary}
              />
              <Text style={styles.sectionTitle}>Job Type</Text>
            </View>
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
                    setSelectedConstructionMethod(''); // Reset method when job type changes
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
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {job.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Construction Method - Only show when job type is selected */}
          {selectedJobType && CONSTRUCTION_METHODS[selectedJobType]?.length > 1 && (
            <Card style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Ionicons
                  name={AppIcons.constructionMethod}
                  size={IconSize.medium}
                  color={designTokens.colors.text.primary}
                />
                <Text style={styles.sectionTitle}>Construction Method</Text>
              </View>
              <Text style={styles.methodHint}>
                Select the construction approach (affects pricing)
              </Text>
              <View style={styles.methodGrid}>
                {CONSTRUCTION_METHODS[selectedJobType].map(method => (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.methodButton,
                      selectedConstructionMethod === method.id && styles.methodButtonActive,
                    ]}
                    onPress={() => {
                      setSelectedConstructionMethod(method.id);
                      setHasUnsavedChanges(true);
                    }}
                  >
                    <Text
                      style={[
                        styles.methodLabel,
                        selectedConstructionMethod === method.id && styles.methodLabelActive,
                      ]}
                    >
                      {method.label}
                    </Text>
                    {method.multiplier !== 1.0 && (
                      <Text
                        style={[
                          styles.methodMultiplier,
                          selectedConstructionMethod === method.id && styles.methodMultiplierActive,
                        ]}
                      >
                        {method.multiplier > 1 ? '+' : ''}
                        {Math.round((method.multiplier - 1) * 100)}%
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          )}

          {/* Quick Details */}
          <Card style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons
                name={AppIcons.quickDetails}
                size={IconSize.medium}
                color={designTokens.colors.text.primary}
              />
              <Text style={styles.sectionTitle}>Quick Details</Text>
            </View>

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
              <View style={styles.sectionTitleRow}>
                <Ionicons
                  name={AppIcons.whatNeedsDoing}
                  size={IconSize.medium}
                  color={designTokens.colors.text.primary}
                />
                <Text style={styles.sectionTitle}>What needs doing?</Text>
              </View>
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
            <View style={styles.sectionTitleRow}>
              <Ionicons
                name={AppIcons.additionalNotes}
                size={IconSize.medium}
                color={designTokens.colors.text.primary}
              />
              <Text style={styles.sectionTitle}>Additional Notes</Text>
            </View>
            <View style={styles.notesActions}>
              {/* Voice recording temporarily disabled — investigating TestFlight issue */}

              <TouchableOpacity style={styles.actionButton} onPress={handleTakePhoto}>
                <Ionicons
                  name="camera-outline"
                  size={24}
                  color={designTokens.colors.primary[500]}
                />
                <Text style={styles.actionButtonText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handlePickFromGallery}>
                <Ionicons
                  name="images-outline"
                  size={24}
                  color={designTokens.colors.primary[500]}
                />
                <Text style={styles.actionButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>

            {/* Photo Thumbnails */}
            {photos.length > 0 && (
              <View style={styles.photoSection}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons
                    name={AppIcons.sitePhotos}
                    size={IconSize.medium}
                    color={designTokens.colors.text.primary}
                  />
                  <Text style={styles.photoSectionTitle}>Site Photos ({photos.length})</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.photoScrollView}
                  contentContainerStyle={styles.photoScrollContent}
                >
                  {photos.map((uri, index) => (
                    <View key={index} style={styles.photoThumbnailContainer}>
                      <Image source={{ uri }} style={styles.photoThumbnail} />
                      <TouchableOpacity
                        style={styles.photoRemoveButton}
                        onPress={() => removePhoto(index)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color={designTokens.colors.error[500]}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Voice recordings UI temporarily disabled — investigating TestFlight issue */}

            <TextInput
              style={styles.notesInput}
              placeholder="Type additional details here..."
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
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: designTokens.spacing.sm,
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
  sectionTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: designTokens.spacing.sm,
    marginBottom: designTokens.spacing.md,
  },
  sectionTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
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
    textAlign: 'center',
  },
  jobTypeLabelActive: {
    color: 'white',
  },
  // Construction Method styles
  methodHint: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.tertiary,
    marginBottom: designTokens.spacing.sm,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.sm,
  },
  methodButton: {
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    borderWidth: 1,
    borderColor: designTokens.colors.border.primary,
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: 'white',
    minWidth: '45%',
    flexGrow: 1,
  },
  methodButtonActive: {
    backgroundColor: designTokens.colors.primary[500],
    borderColor: designTokens.colors.primary[500],
  },
  methodLabel: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.primary,
    textAlign: 'center',
  },
  methodLabelActive: {
    color: 'white',
    fontWeight: designTokens.typography.fontWeight.semibold as any,
  },
  methodMultiplier: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.tertiary,
    textAlign: 'center',
    marginTop: 2,
  },
  methodMultiplierActive: {
    color: 'rgba(255, 255, 255, 0.8)',
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
  // Photo Section Styles
  photoSection: {
    marginTop: designTokens.spacing.md,
    marginBottom: designTokens.spacing.md,
  },
  photoSectionTitle: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.secondary,
    marginBottom: designTokens.spacing.sm,
  },
  photoScrollView: {
    flexGrow: 0,
  },
  photoScrollContent: {
    gap: designTokens.spacing.sm,
  },
  photoThumbnailContainer: {
    position: 'relative',
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: designTokens.borderRadius.md,
    backgroundColor: designTokens.colors.background.secondary,
  },
  photoRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  // Voice Transcript Styles
  voiceTranscriptBox: {
    marginTop: designTokens.spacing.md,
    marginBottom: designTokens.spacing.md,
    padding: designTokens.spacing.md,
    backgroundColor: designTokens.colors.primary[50],
    borderRadius: designTokens.borderRadius.lg,
    borderWidth: 1,
    borderColor: designTokens.colors.primary[200],
  },
  voiceTranscriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  voiceTranscriptTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
  },
  voiceTranscriptLabel: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.primary[600],
  },
  voiceClearButton: {
    padding: designTokens.spacing.xs,
  },
  voiceTranscript: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.primary,
    lineHeight: 20,
  },
  // Voice Recordings Styles
  voiceRecordingsSection: {
    marginTop: designTokens.spacing.md,
    marginBottom: designTokens.spacing.md,
  },
  voiceRecordingsTitle: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.secondary,
    marginBottom: designTokens.spacing.sm,
  },
  voiceRecordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.primary[50],
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.sm,
    marginBottom: designTokens.spacing.xs,
    borderWidth: 1,
    borderColor: designTokens.colors.primary[200],
  },
  playButton: {
    marginRight: designTokens.spacing.sm,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingLabel: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.primary,
  },
  recordingDuration: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.secondary,
  },
  recordingDeleteButton: {
    padding: designTokens.spacing.xs,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.error[50],
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.md,
    marginTop: designTokens.spacing.md,
    marginBottom: designTokens.spacing.md,
    borderWidth: 1,
    borderColor: designTokens.colors.error[200],
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: designTokens.colors.error[500],
    marginRight: designTokens.spacing.sm,
  },
  recordingText: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.error[700],
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
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
    marginHorizontal: designTokens.spacing.md,
    marginBottom: designTokens.spacing.sm,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    backgroundColor: '#fef3c7',
    borderRadius: designTokens.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  offlineBannerText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: '#92400e',
    fontWeight: designTokens.typography.fontWeight.medium as any,
  },
});
