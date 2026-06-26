import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { quoteStorage } from '../services/QuoteStorageService';
import designTokens from '../styles/designTokens';
import { AppIcons, IconSize } from '../styles/iconRegistry';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { AIService } from '../services/ai/AIServiceEdge';
import { useAuth } from '../contexts/AuthContext';
import LoginSignupModal from '../components/modals/LoginSignupModal';
import UpgradePromptModal from '../components/modals/UpgradePromptModal';
import OriginalBriefCard from '../components/OriginalBriefCard';
import ToddyAdviceCard from '../components/ToddyAdviceCard';
import type { ToddyAdvice, ToddyAdviceContext } from '../services/ai/ToddyAdviceService';
import { calculateVAT, calculateIncVAT, formatGBP } from '../utils/vat';
import { logger } from '../services/Logger';
import { Task, parseAIResponseToTasks } from './taskListHelpers';

export default function TaskListScreen({ navigation, route }: any) {
  const { siteNotes, savedQuote, isViewingGenerated } = route.params;
  const { canGenerateQuote, incrementQuoteUsage, isAnonymous, freemiumUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isProcessing, setIsProcessing] = useState(!isViewingGenerated); // Skip processing if viewing existing
  const [totalCost, setTotalCost] = useState({ min: 0, max: 0 });
  const [finalCost, setFinalCost] = useState<number | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [currentQuote, setCurrentQuote] = useState<any>(savedQuote || null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  // True when we couldn't produce a genuine AI quote (offline, server fallback,
  // or an unparseable response). We then prompt the user to retry rather than
  // showing misleading hardcoded template figures.
  const [generationFailed, setGenerationFailed] = useState(false);
  const [saveError, setSaveError] = useState(false);
  // Opt-in: list each line item's materials on the customer PDF. Off by default
  // so existing quote PDFs don't change unless the user chooses to show them.
  const [showMaterialBreakdown, setShowMaterialBreakdown] = useState<boolean>(
    savedQuote?.showMaterialBreakdown ?? false
  );
  const lastSaveArgsRef = useRef<{ generatedTasks: Task[]; aiResponse: any } | null>(null);
  const [pendingQuoteGeneration, setPendingQuoteGeneration] = useState(false);
  const [previousAuthState, setPreviousAuthState] = useState(isAnonymous);
  const [processingStage, setProcessingStage] = useState<
    'preparing' | 'compressing' | 'sending' | 'generating' | 'finalising'
  >('preparing');

  // Guard against setState on unmounted component
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Keep the navigation header title in sync with what's actually happening, so
  // it doesn't read "Quote Generated" while the AI is still working (or failed).
  useEffect(() => {
    const headerState =
      isProcessing && !isViewingGenerated
        ? 'generating'
        : generationFailed
          ? 'failed'
          : 'generated';
    navigation.setParams?.({ headerState });
  }, [isProcessing, isViewingGenerated, generationFailed, navigation]);

  useEffect(() => {
    if (isViewingGenerated && savedQuote) {
      // Load existing generated quote data - NO AI CALL NEEDED
      logger.debug('🔄 Loading existing quote, skipping AI generation');
      loadExistingQuoteData();
    } else if (!isViewingGenerated) {
      // Generate new quote from site notes
      logger.debug('🚀 Generating new quote with AI');
      generateTasksFromNotes();
    }
  }, [savedQuote]); // Re-run when savedQuote changes (e.g., after editing)

  // Watch for auth state changes and retry quote generation if needed
  useEffect(() => {
    // Detect transition from anonymous to authenticated
    if (previousAuthState === true && isAnonymous === false) {
      logger.debug('🔄 User authenticated! Auth transition detected');
      setPreviousAuthState(false);

      // If we have pending quote generation, retry after a small delay
      if (pendingQuoteGeneration && canGenerateQuote()) {
        logger.debug('⏱️ Waiting for auth state to stabilize...');
        setTimeout(() => {
          logger.debug('🚀 Retrying quote generation after auth...');
          setPendingQuoteGeneration(false);
          setIsProcessing(true); // Show loading state during AI processing
          generateTasksFromNotes();
        }, 500); // Small delay to ensure auth state is fully propagated
      }
    }
  }, [isAnonymous, freemiumUser.tier, pendingQuoteGeneration, previousAuthState]);

  useEffect(() => {
    // Calculate totals when tasks change
    const selected = tasks.filter(t => t.selected);

    // AI estimated range
    const total = selected.reduce(
      (acc, task) => ({
        min: acc.min + task.estimatedCost.min,
        max: acc.max + task.estimatedCost.max,
      }),
      { min: 0, max: 0 }
    );
    setTotalCost(total);

    // Your Price total (sum of finalPrice values)
    const yourPriceTotal = selected.reduce(
      (acc, task) => acc + (task.finalPrice || task.estimatedCost.max),
      0
    );
    setFinalCost(yourPriceTotal);
  }, [tasks]);

  const loadExistingQuoteData = () => {
    logger.debug('📋 Loading existing quote data:', savedQuote.id);

    if (savedQuote.generatedTasks) {
      setTasks(savedQuote.generatedTasks);
    }

    if (savedQuote.totalCost) {
      setTotalCost(savedQuote.totalCost);
    }

    if (savedQuote.finalCost) {
      setFinalCost(savedQuote.finalCost);
    }

    if (savedQuote.aiAnalysis) {
      setAiAnalysis(savedQuote.aiAnalysis);
    }

    // Update current quote reference
    setCurrentQuote(savedQuote);

    setIsProcessing(false);
  };

  const autoSaveGeneratedQuote = async (generatedTasks: Task[], aiResponse: any) => {
    // Remember the inputs so the user can retry if the save fails.
    lastSaveArgsRef.current = { generatedTasks, aiResponse };
    try {
      // Calculate total cost
      const calculatedTotal = generatedTasks
        .filter(t => t.selected)
        .reduce(
          (acc, task) => ({
            min: acc.min + task.estimatedCost.min,
            max: acc.max + task.estimatedCost.max,
          }),
          { min: 0, max: 0 }
        );

      const generatedQuote = {
        id: siteNotes.id || `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: siteNotes.timestamp || Date.now(),
        lastModified: Date.now(),
        // Headline fields captured on the assessment form — kept at top level so
        // the PDF/share header (which reads quote.quoteName / quote.customerName)
        // picks them up without an edit-screen round-trip.
        quoteName: siteNotes.quoteName,
        customerName: siteNotes.customerName,
        address: siteNotes.address,
        jobType: siteNotes.jobType,
        propertyType: siteNotes.propertyType,
        size: siteNotes.size,
        tasks: siteNotes.tasks,
        notes: siteNotes.notes,
        photos: siteNotes.photos || [],
        voiceNotes: siteNotes.voiceNotes || '',
        syncStatus: 'local' as const,
        status: 'generated' as const,
        generatedTasks,
        totalCost: calculatedTotal,
        aiAnalysis: aiResponse,
        siteNotes,
      };

      await quoteStorage.save(generatedQuote);

      setCurrentQuote(generatedQuote);
      setSaveError(false);
      logger.debug('💾 Auto-saved generated quote:', generatedQuote.id);
    } catch (error) {
      console.error('Error auto-saving generated quote:', error);
      // Surface the failure so the user knows their quote wasn't saved and can retry.
      setSaveError(true);
    }
  };

  const handleRetrySave = () => {
    const args = lastSaveArgsRef.current;
    if (args) {
      autoSaveGeneratedQuote(args.generatedTasks, args.aiResponse);
    }
  };

  // Cache Toddy's advice onto the saved quote so re-opening it shows the advice
  // instantly without re-billing a Gemini call. Best-effort: a persistence
  // failure must not disrupt the (already-displayed) advice.
  const persistToddyAdvice = async (advice: ToddyAdvice) => {
    if (!currentQuote) return;
    const updated = { ...currentQuote, toddyAdvice: advice, lastModified: Date.now() };
    setCurrentQuote(updated);
    try {
      await quoteStorage.save(updated);
      logger.debug('💾 Cached Toddy advice on quote:', updated.id);
    } catch (error) {
      logger.warn('⚠️ Failed to persist Toddy advice (advice still shown):', error);
    }
  };

  // Toggle "show materials on PDF" and persist it on the quote so the choice
  // sticks across sessions. Best-effort persistence — never block the toggle.
  const toggleMaterialBreakdown = async () => {
    const next = !showMaterialBreakdown;
    setShowMaterialBreakdown(next);
    if (!currentQuote) return;
    const updated = { ...currentQuote, showMaterialBreakdown: next, lastModified: Date.now() };
    setCurrentQuote(updated);
    try {
      await quoteStorage.save(updated);
    } catch (error) {
      logger.warn('⚠️ Failed to persist material-breakdown preference:', error);
    }
  };

  // Quote context sent to the advice edge function — selected line items + total.
  const buildToddyContext = (): ToddyAdviceContext => {
    const selected = tasks.filter(t => t.selected);
    return {
      jobType: siteNotes.jobType,
      propertyType: siteNotes.propertyType,
      size: siteNotes.size,
      notes: siteNotes.notes,
      lineItems: selected.map(t => ({
        description: t.description,
        price: t.finalPrice ?? t.estimatedCost.max,
      })),
      quoteTotal:
        finalCost ?? selected.reduce((sum, t) => sum + (t.finalPrice ?? t.estimatedCost.max), 0),
    };
  };

  // Helper function to compress and convert image URIs to base64
  const convertImagesToBase64 = async (
    imageUris: string[]
  ): Promise<{ base64: string; mimeType: string }[]> => {
    const MAX_WIDTH = 1024;

    // Process all images in parallel for faster compression
    const results = await Promise.all(
      imageUris.map(async (uri): Promise<{ base64: string; mimeType: string } | null> => {
        try {
          const manipulated = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: MAX_WIDTH } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );

          if (manipulated.base64) {
            logger.debug(
              `📸 Compressed image: ${uri.substring(0, 50)}... (${Math.round((manipulated.base64.length * 3) / 4 / 1024)}KB)`
            );
            return { base64: manipulated.base64, mimeType: 'image/jpeg' };
          }
        } catch (error) {
          try {
            const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
            const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
            logger.debug(`📸 Fallback (uncompressed): ${uri.substring(0, 50)}...`);
            return { base64, mimeType };
          } catch (fallbackError) {
            console.error(`Failed to convert image: ${uri}`, fallbackError);
          }
        }
        return null;
      })
    );

    return results.filter((r): r is { base64: string; mimeType: string } => r !== null);
  };

  // Helper function to convert audio recordings to base64
  const convertAudioToBase64 = async (
    recordings: { uri: string; duration: number }[]
  ): Promise<{ base64: string; mimeType: string }[]> => {
    const audioFiles: { base64: string; mimeType: string }[] = [];

    for (const recording of recordings) {
      try {
        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(recording.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Determine mime type from extension (expo-av records as .m4a on iOS, .3gp on Android)
        const extension = recording.uri.split('.').pop()?.toLowerCase() || 'm4a';
        let mimeType = 'audio/mp4'; // Default for m4a
        if (extension === '3gp') {
          mimeType = 'audio/3gpp';
        } else if (extension === 'wav') {
          mimeType = 'audio/wav';
        } else if (extension === 'mp3') {
          mimeType = 'audio/mp3';
        } else if (extension === 'aac') {
          mimeType = 'audio/aac';
        }

        audioFiles.push({ base64, mimeType });
        logger.debug(
          `🎤 Converted audio to base64: ${recording.uri.substring(0, 50)}... (${Math.round(recording.duration)}s)`
        );
      } catch (error) {
        console.error(`Failed to convert audio: ${recording.uri}`, error);
      }
    }

    return audioFiles;
  };

  const generateTasksFromNotes = async () => {
    try {
      // Debug auth state
      logger.debug('🔍 Quote generation check:', {
        isAnonymous,
        canGenerate: canGenerateQuote(),
        userTier: freemiumUser.tier,
        quotesUsed: freemiumUser.quotesUsed,
        quotesLimit: freemiumUser.quotesLimit,
      });

      // Check if user can generate quotes (freemium check)
      if (!canGenerateQuote()) {
        if (isAnonymous) {
          // Show login/signup modal for anonymous users
          setPendingQuoteGeneration(true); // Mark that we want to generate after login
          setShowLoginModal(true);
          setIsProcessing(false);
          return;
        } else {
          // Show upgrade modal for free users who hit limit
          setShowUpgradeModal(true);
          setIsProcessing(false);
          return;
        }
      }

      const aiService = AIService;

      // Convert photos and audio in parallel
      const hasPhotos = siteNotes.photos && siteNotes.photos.length > 0;
      const hasRecordings = siteNotes.voiceRecordings && siteNotes.voiceRecordings.length > 0;

      if (hasPhotos || hasRecordings) {
        setProcessingStage('compressing');
      }

      const [images, audioFiles] = await Promise.all([
        hasPhotos
          ? convertImagesToBase64(siteNotes.photos)
          : Promise.resolve([] as { base64: string; mimeType: string }[]),
        hasRecordings
          ? convertAudioToBase64(siteNotes.voiceRecordings)
          : Promise.resolve([] as { base64: string; mimeType: string }[]),
      ]);

      if (!mountedRef.current) return;

      // Build construction method info string
      const constructionMethodInfo = siteNotes.constructionMethod
        ? `🔨 Construction Method: ${siteNotes.constructionMethodLabel || siteNotes.constructionMethod} (${siteNotes.constructionMethodMultiplier}x price factor)`
        : '';

      // Build photo analysis instruction
      const photoInstruction =
        images.length > 0
          ? `📸 IMPORTANT: ${images.length} site photo(s) are attached. Analyze these images carefully to:
• Identify the current state of the property/area
• Assess the scope of work needed based on visual evidence
• Note any potential complications or additional requirements visible
• Use visual details to refine cost estimates`
          : '';

      // Build voice note instruction
      const voiceInstruction =
        audioFiles.length > 0
          ? `🎤 IMPORTANT: ${audioFiles.length} voice recording(s) are attached. Listen carefully to these audio notes from the contractor/user:
• Extract any specific requirements or preferences mentioned
• Note measurements, materials, or specifications described verbally
• Identify any concerns or special considerations mentioned
• Factor verbal descriptions into your cost estimates`
          : '';

      // Build structured context lines
      const specLevelInfo = siteNotes.specLevel
        ? `⭐ Finish Level: ${siteNotes.specLevel.charAt(0).toUpperCase() + siteNotes.specLevel.slice(1)}`
        : '';
      const roomsInfo = siteNotes.numberOfRooms
        ? `🚪 Number of Rooms: ${siteNotes.numberOfRooms}`
        : '';
      const floorsInfo = siteNotes.numberOfFloors
        ? `🏗️ Number of Floors: ${siteNotes.numberOfFloors}`
        : '';

      // Prepare comprehensive prompt with ALL user input
      const prompt = `You are a UK construction cost estimator. Analyze this project in detail and provide accurate quotes based on ALL the information provided.

PROJECT DETAILS:
📍 Location: ${siteNotes.address}
🏠 Property Type: ${siteNotes.propertyType || 'Not specified'}
📐 Size/Dimensions: ${siteNotes.size || 'Not specified'}
🔧 Job Type: ${siteNotes.jobType}
${constructionMethodInfo}
${specLevelInfo}
${roomsInfo}
${floorsInfo}

USER REQUIREMENTS:
✅ Selected Work Items: ${siteNotes.tasks && siteNotes.tasks.length > 0 ? siteNotes.tasks.join(', ') : 'None specified'}

📝 DETAILED NOTES: ${siteNotes.notes || 'None provided'}

🎤 VOICE NOTES (text): ${siteNotes.voiceNotes || 'None provided'}

${photoInstruction}

${voiceInstruction}

ANALYSIS REQUIREMENTS:
• Pay special attention to the dimensions/size - this heavily impacts material quantities and costs
• Consider the specific requirements mentioned in notes and voice notes
• Factor in the property type and location for accurate regional pricing
• Include all selected work items plus any obviously necessary additional tasks
• Provide realistic UK construction costs for 2025/2026
• Consider quality levels appropriate for the property type
${siteNotes.specLevel ? `• IMPORTANT: User specified "${siteNotes.specLevel}" finish level — adjust material quality and costs accordingly (budget=basic materials, standard=mid-range, premium=high-quality, luxury=top-of-line)` : ''}
${siteNotes.numberOfRooms ? `• Project involves ${siteNotes.numberOfRooms} room(s) — scale quantities and costs accordingly` : ''}
${siteNotes.numberOfFloors ? `• ${siteNotes.numberOfFloors}-storey build — factor in structural requirements for multi-storey construction` : ''}
${images.length > 0 ? '• ANALYZE THE ATTACHED PHOTOS to assess the current condition and scope of work' : ''}
${audioFiles.length > 0 ? '• LISTEN TO THE ATTACHED VOICE RECORDINGS for verbal descriptions and requirements' : ''}
${siteNotes.constructionMethod ? `• IMPORTANT: Apply ${siteNotes.constructionMethodMultiplier}x price adjustment for ${siteNotes.constructionMethodLabel} construction method` : ''}

All costs must EXCLUDE VAT (VAT is added separately).
Provide detailed cost breakdown with materials, labor, and realistic price ranges based on current UK market rates.`;

      // Call AI service with images and audio if available
      setProcessingStage('sending');
      const hasMedia = images.length > 0 || audioFiles.length > 0;

      // Transition to 'generating' after 2s so user sees progress during the AI wait
      const stageTimer = setTimeout(() => {
        if (mountedRef.current) setProcessingStage('generating');
      }, 2000);

      const response = await aiService.analyzeImage({
        message: prompt,
        images: images.length > 0 ? images : undefined,
        audio: audioFiles.length > 0 ? audioFiles : undefined,
        analysisType: hasMedia ? 'image' : 'chat',
      });

      clearTimeout(stageTimer);

      if (!mountedRef.current) return;

      setProcessingStage('finalising');
      logger.debug('🤖 AI Response received:', response);

      // Only an EXPLICIT server fallback (Gemini failed server-side) or an
      // unparseable/empty response counts as "no real quote". A genuine AI quote
      // with modest confidence is still a real quote and IS shown — we must not
      // discard it. (isFallbackResponse() also flags low confidence, which is too
      // broad for this routing decision.)
      const fallbackMarkers = response as { _isFallback?: boolean; provider?: string };
      const isServerFallback =
        fallbackMarkers?._isFallback === true || fallbackMarkers?.provider === 'fallback-template';
      const parsedTasks = isServerFallback ? [] : parseAIResponseToTasksInternal(response);

      if (parsedTasks.length === 0) {
        setGenerationFailed(true);
        return;
      }

      setTasks(parsedTasks);

      // Auto-save the generated quote (safe even if unmounted — only writes to storage)
      await autoSaveGeneratedQuote(parsedTasks, response);

      // Increment quote usage for tracking
      await incrementQuoteUsage();
    } catch (error: any) {
      if (!mountedRef.current) return;
      // Route auth / quota errors to their proper prompts — NOT the connectivity
      // retry screen. Only genuine connection/timeout/server errors get that.
      if (error?.code === 'USAGE_LIMIT_REACHED') {
        setShowUpgradeModal(true);
      } else if (error?.code === 'AUTH_REQUIRED') {
        setPendingQuoteGeneration(true);
        setShowLoginModal(true);
      } else {
        console.error('Error generating tasks:', error);
        setGenerationFailed(true);
      }
    } finally {
      if (mountedRef.current) {
        setIsProcessing(false);
      }
    }
  };

  const parseAIResponseToTasksInternal = (aiResponse: any): Task[] => {
    logger.debug('📋 Edge Function returned structured data:', aiResponse);

    // Use the exported pure function for core parsing
    const tasks = parseAIResponseToTasks(aiResponse);

    // Handle side effects: store summary for display
    if (aiResponse?.tasks && Array.isArray(aiResponse.tasks) && aiResponse.summary) {
      setAiAnalysis({
        ...aiResponse,
        confidence: aiResponse.summary.confidence || 75,
        locationMultiplier: aiResponse.summary.location_multiplier || 1.0,
        sizeMultiplier: aiResponse.summary.size_multiplier || 1.0,
      });
    }

    if (tasks.length === 0) {
      logger.debug('⚠️ No structured data in AI response');
      return [];
    }

    logger.debug(`📋 Generated ${tasks.length} tasks from structured data`);
    return tasks;
  };

  const handleRetryAnalysis = () => {
    setGenerationFailed(false);
    setTasks([]);
    setProcessingStage('preparing');
    setIsProcessing(true);
    generateTasksFromNotes();
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(task => (task.id === taskId ? { ...task, selected: !task.selected } : task))
    );
  };

  const handleEditQuote = async () => {
    const selectedTasks = tasks.filter(t => t.selected);

    // Navigate to edit screen with current data
    navigation.navigate('EditQuote', {
      tasks: selectedTasks,
      totalCost,
      siteNotes,
      savedQuote: currentQuote,
    });
  };

  const handleShareQuote = async () => {
    const selectedTasks = tasks.filter(t => t.selected);

    // Navigate to share screen with finalPrice per task and finalCost total
    navigation.navigate('ShareQuote', {
      quote: {
        ...currentQuote,
        tasks: selectedTasks,
        totalCost,
        finalCost, // Your Price total
        showMaterialBreakdown, // controls the per-item materials list on the PDF
      },
    });
  };

  if (isProcessing) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Skeleton: Summary Card */}
          <Card style={styles.summaryCard}>
            <View style={styles.skeletonBar} />
            <View style={[styles.skeletonBar, styles.skeletonBarShort]} />
          </Card>

          {/* Processing Status with stage progress */}
          <View style={styles.skeletonStatusBanner}>
            <ActivityIndicator size="small" color={designTokens.colors.primary[500]} />
            <Text style={styles.skeletonStatusText}>
              {processingStage === 'preparing' && 'Preparing your project details...'}
              {processingStage === 'compressing' && 'Compressing photos...'}
              {processingStage === 'sending' && 'Sending to AI...'}
              {processingStage === 'generating' && 'Generating your quote...'}
              {processingStage === 'finalising' && 'Finalising details...'}
            </Text>
          </View>

          {/* Skeleton: Task Cards */}
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={styles.skeletonTaskCard}>
              <View style={styles.skeletonTaskHeader}>
                <View style={styles.skeletonCheckbox} />
                <View style={{ flex: 1 }}>
                  <View style={styles.skeletonBar} />
                  <View style={[styles.skeletonBar, styles.skeletonBarShort, { marginTop: 6 }]} />
                </View>
              </View>
              <View style={styles.skeletonCostRow}>
                <View style={[styles.skeletonBar, { width: 120 }]} />
              </View>
            </View>
          ))}

          {/* Skeleton: Total Card */}
          <Card style={[styles.totalCard, { opacity: 0.6 }]}>
            <View style={[styles.skeletonBar, styles.skeletonBarShort]} />
            <View style={[styles.skeletonBar, { width: 180, height: 28, marginTop: 8 }]} />
            <View style={[styles.skeletonBar, styles.skeletonBarShort, { marginTop: 8 }]} />
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Couldn't produce a genuine AI quote — show a retry prompt rather than
  // misleading template numbers.
  if (generationFailed) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{siteNotes.address}</Text>
            <Text style={styles.summarySubtitle}>
              {siteNotes.jobType.charAt(0).toUpperCase() + siteNotes.jobType.slice(1)} •{' '}
              {siteNotes.propertyType || 'Property'}
            </Text>
          </Card>

          <Card style={styles.connectionErrorCard}>
            <Ionicons
              name="cloud-offline-outline"
              size={48}
              color={designTokens.colors.primary[500]}
            />
            <Text style={styles.connectionErrorTitle}>We couldn&apos;t build your quote</Text>
            <Text style={styles.connectionErrorText}>
              We want to give you an accurate cost breakdown, but couldn&apos;t connect on this
              occasion. Please check your Wi-Fi or mobile data and try again.
            </Text>
            <Button
              title="Try Again"
              onPress={handleRetryAnalysis}
              variant="primary"
              style={styles.connectionErrorButton}
              icon={
                <Ionicons
                  name="refresh-outline"
                  size={18}
                  color="white"
                  style={{ marginRight: 6 }}
                />
              }
            />
            <TouchableOpacity onPress={() => navigation.navigate('SiteNotes')}>
              <Text style={styles.connectionErrorLink}>Back to assessment</Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Project Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{siteNotes.address}</Text>
          <Text style={styles.summarySubtitle}>
            {siteNotes.jobType.charAt(0).toUpperCase() + siteNotes.jobType.slice(1)} •{' '}
            {siteNotes.propertyType || 'Property'}
          </Text>
        </Card>

        {/* Read-only original brief — only when viewing an already-generated
            quote, so users can look back on what they submitted. */}
        {isViewingGenerated && <OriginalBriefCard siteNotes={siteNotes} />}

        {/* On-demand "ask Toddy" advice — only once a quote exists. Sits below
            the brief and never competes with the quote itself; advice is
            fetched lazily on tap and cached on the quote. */}
        {tasks.length > 0 && (
          <ToddyAdviceCard
            context={buildToddyContext()}
            initialAdvice={currentQuote?.toddyAdvice ?? null}
            onAdviceGenerated={persistToddyAdvice}
          />
        )}

        {/* Auto-save failure banner */}
        {saveError && (
          <View style={[styles.fallbackBanner, styles.saveErrorBanner]}>
            <View style={styles.fallbackBannerContent}>
              <Ionicons name="warning-outline" size={20} color="#842029" />
              <Text style={[styles.fallbackBannerText, styles.saveErrorText]}>
                Couldn&apos;t save this quote to your device. Tap retry — if it keeps failing, take
                a screenshot so you don&apos;t lose your work.
              </Text>
            </View>
            <Button
              title="Retry save"
              onPress={handleRetrySave}
              variant="outline"
              size="sm"
              icon={
                <Ionicons
                  name="refresh-outline"
                  size={16}
                  color="#842029"
                  style={{ marginRight: 6 }}
                />
              }
              style={styles.saveErrorRetryButton}
            />
          </View>
        )}

        {/* Tasks List */}
        <View style={styles.tasksContainer}>
          <Text style={styles.sectionTitle}>Tasks & Costs</Text>
          {tasks.map(task => (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskCard, !task.selected && styles.taskCardInactive]}
              onPress={() => toggleTask(task.id)}
            >
              <View style={styles.taskHeader}>
                <Ionicons
                  name={task.selected ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={
                    task.selected
                      ? designTokens.colors.primary[500]
                      : designTokens.colors.text.tertiary
                  }
                />
                <View style={styles.taskInfo}>
                  <Text
                    style={[
                      styles.taskDescription,
                      !task.selected && styles.taskDescriptionInactive,
                    ]}
                  >
                    {task.description}
                  </Text>
                  <Text style={styles.taskCategory}>{task.category}</Text>
                </View>
              </View>

              <View style={styles.taskCost}>
                <Text style={[styles.yourPrice, !task.selected && styles.costRangeInactive]}>
                  Your Price (exc. VAT): £
                  {(task.finalPrice || task.estimatedCost.max).toLocaleString()}
                </Text>
                <Text style={[styles.costRange, !task.selected && styles.costRangeInactive]}>
                  AI estimate: £{task.estimatedCost.min.toLocaleString()} - £
                  {task.estimatedCost.max.toLocaleString()}
                </Text>
                {task.laborDays ? (
                  <Text style={styles.laborDays}>{task.laborDays} days</Text>
                ) : null}
              </View>

              {task.materials && task.materials.length > 0 && (
                <View style={styles.materialsContainer}>
                  {task.materials.slice(0, 3).map((material, index) => (
                    <View key={index} style={styles.materialChip}>
                      <Text style={styles.materialText}>{material}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Total Cost with VAT Breakdown */}
        <Card style={styles.totalCard}>
          {/* VAT Breakdown */}
          {finalCost !== null && (
            <View style={styles.finalCostDisplay}>
              <View style={styles.vatRow}>
                <Text style={styles.vatLabel}>Subtotal (exc. VAT)</Text>
                <Text style={styles.vatValue}>£{formatGBP(finalCost)}</Text>
              </View>
              <View style={styles.vatRow}>
                <Text style={styles.vatLabel}>VAT (20%)</Text>
                <Text style={styles.vatValue}>£{formatGBP(calculateVAT(finalCost))}</Text>
              </View>
              <View style={[styles.vatRow, styles.vatTotalRow]}>
                <Text style={styles.vatTotalLabel}>Total (inc. VAT)</Text>
                <Text style={styles.finalCostDisplayAmount}>
                  £{formatGBP(calculateIncVAT(finalCost))}
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.totalLabel}>
            {finalCost !== null ? 'Estimated Range' : 'Estimated Total'}
          </Text>
          <Text style={[styles.totalAmount, finalCost !== null && styles.totalAmountSmall]}>
            £{totalCost.min.toLocaleString()} - £{totalCost.max.toLocaleString()}
          </Text>
          <Text style={styles.totalNote}>
            *Prices include materials and labor. VAT at 20% added to total.
          </Text>

          {/* Confidence & Adjustments Indicator */}
          {aiAnalysis && (
            <View style={styles.confidenceContainer}>
              <View style={styles.confidenceRow}>
                <Text style={styles.confidenceLabel}>Quote Confidence:</Text>
                <View style={styles.confidenceBar}>
                  <View
                    style={[
                      styles.confidenceFill,
                      {
                        width: `${aiAnalysis.confidence || 75}%`,
                        backgroundColor:
                          (aiAnalysis.confidence || 75) > 80
                            ? designTokens.colors.success[500]
                            : (aiAnalysis.confidence || 75) > 60
                              ? designTokens.colors.warning[500]
                              : designTokens.colors.error[500],
                      },
                    ]}
                  />
                </View>
                <Text style={styles.confidencePercent}>{aiAnalysis.confidence || 75}%</Text>
              </View>

              {/* Show applied adjustments */}
              {(aiAnalysis.sizeMultiplier || aiAnalysis.locationMultiplier) && (
                <View style={styles.adjustmentsContainer}>
                  <Text style={styles.adjustmentsTitle}>Price Adjustments Applied:</Text>
                  {aiAnalysis.sizeMultiplier && aiAnalysis.sizeMultiplier !== 1 && (
                    <Text style={styles.adjustmentItem}>
                      • Size factor: {aiAnalysis.sizeMultiplier}x{' '}
                      {siteNotes.size && `(${siteNotes.size})`}
                    </Text>
                  )}
                  {aiAnalysis.locationMultiplier && aiAnalysis.locationMultiplier !== 1 && (
                    <Text style={styles.adjustmentItem}>
                      • Location factor: {aiAnalysis.locationMultiplier}x{' '}
                      {siteNotes.address && `(${siteNotes.address.split(',')[0]})`}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          {!isViewingGenerated && (
            <View style={styles.actionHintRow}>
              <Ionicons
                name={AppIcons.quoteGenerated}
                size={IconSize.small}
                color={designTokens.colors.text.secondary}
              />
              <Text style={styles.actionHint}>
                Your quote has been generated and saved! Choose your next step:
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.materialToggleRow}
            onPress={toggleMaterialBreakdown}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: showMaterialBreakdown }}
            accessibilityLabel="Show material breakdown on customer PDF"
          >
            <Ionicons
              name={showMaterialBreakdown ? 'checkbox' : 'square-outline'}
              size={22}
              color={
                showMaterialBreakdown
                  ? designTokens.colors.primary[500]
                  : designTokens.colors.text.tertiary
              }
            />
            <Text style={styles.materialToggleLabel}>Show material breakdown on customer PDF</Text>
          </TouchableOpacity>

          <View style={styles.actionButtons}>
            <Button
              title="Edit Quote"
              onPress={handleEditQuote}
              variant="secondary"
              style={styles.actionButton}
              icon={
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={designTokens.colors.text.primary}
                />
              }
            />
            <Button
              title="Share Quote"
              onPress={handleShareQuote}
              variant="primary"
              style={styles.actionButton}
              icon={<Ionicons name="share-outline" size={20} color="white" />}
            />
          </View>

          {/* New Assessment link */}
          <TouchableOpacity
            style={styles.newAssessmentLink}
            onPress={() => navigation.navigate('SiteNotes')}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={designTokens.colors.primary[500]}
            />
            <Text style={styles.newAssessmentText}>Start New Assessment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Login/Signup Modal for Anonymous Users */}
      <LoginSignupModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
          // The useEffect will handle retrying when auth state updates
          logger.debug('✅ Login successful, waiting for auth state update...');
        }}
        mode="signup"
        title="Sign Up to Generate Your Quote"
        subtitle="Join thousands of contractors saving time with AI quotes"
      />

      {/* Upgrade Modal for Free Users */}
      <UpgradePromptModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          navigation.navigate('Pricing');
        }}
        reason="quota_exceeded"
      />
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
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designTokens.spacing.xl,
  },
  processingTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: designTokens.spacing.sm,
    marginTop: designTokens.spacing.lg,
  },
  processingTitle: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
  },
  processingText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    marginTop: designTokens.spacing.sm,
  },
  processingSteps: {
    marginTop: designTokens.spacing.xl,
    alignItems: 'center',
  },
  processingStepRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: designTokens.spacing.sm,
    marginTop: designTokens.spacing.md,
  },
  processingStep: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
  },
  title: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
  },
  summaryCard: {
    marginHorizontal: designTokens.spacing.md,
    marginBottom: designTokens.spacing.md,
    padding: designTokens.spacing.md,
  },
  summaryTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
  },
  summarySubtitle: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    marginTop: designTokens.spacing.xs,
  },
  tasksContainer: {
    paddingHorizontal: designTokens.spacing.md,
  },
  sectionTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.md,
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.md,
    marginBottom: designTokens.spacing.sm,
    borderWidth: 1,
    borderColor: designTokens.colors.border.primary,
  },
  taskCardInactive: {
    opacity: 0.6,
    backgroundColor: designTokens.colors.background.secondary,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskInfo: {
    flex: 1,
    marginLeft: designTokens.spacing.sm,
  },
  taskDescription: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.primary,
  },
  taskDescriptionInactive: {
    color: designTokens.colors.text.tertiary,
  },
  taskCategory: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    marginTop: designTokens.spacing.xs,
  },
  taskCost: {
    marginTop: designTokens.spacing.sm,
    marginLeft: 32,
  },
  yourPrice: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.primary[600],
    marginBottom: 2,
  },
  costRange: {
    fontSize: designTokens.typography.fontSize.xs,
    fontWeight: designTokens.typography.fontWeight.normal as any,
    color: designTokens.colors.text.tertiary,
    fontStyle: 'italic',
  },
  costRangeInactive: {
    color: designTokens.colors.text.tertiary,
  },
  laborDays: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    marginTop: designTokens.spacing.xs,
  },
  materialsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: designTokens.spacing.sm,
    marginLeft: 32,
    gap: designTokens.spacing.xs,
  },
  materialChip: {
    backgroundColor: designTokens.colors.primary[50],
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.md,
  },
  materialText: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.primary[700],
  },
  totalCard: {
    marginHorizontal: designTokens.spacing.md,
    marginTop: designTokens.spacing.lg,
    padding: designTokens.spacing.lg,
    backgroundColor: designTokens.colors.primary[50],
    borderColor: designTokens.colors.primary[200],
  },
  totalLabel: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
  },
  totalAmount: {
    fontSize: designTokens.typography.fontSize['2xl'],
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.primary[600],
    marginTop: designTokens.spacing.xs,
  },
  totalAmountSmall: {
    fontSize: designTokens.typography.fontSize.lg,
    color: designTokens.colors.text.secondary,
  },
  finalCostDisplay: {
    marginBottom: designTokens.spacing.md,
    paddingBottom: designTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.primary[200],
  },
  finalCostDisplayAmount: {
    fontSize: designTokens.typography.fontSize['2xl'],
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.primary[600],
  },
  vatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.xs,
  },
  vatLabel: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
  },
  vatValue: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.primary,
  },
  vatTotalRow: {
    marginTop: designTokens.spacing.sm,
    paddingTop: designTokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.primary[200],
    marginBottom: 0,
  },
  vatTotalLabel: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
  },
  totalNote: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    marginTop: designTokens.spacing.sm,
  },
  actions: {
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.lg,
  },
  actionHintRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: designTokens.spacing.xs,
    marginBottom: designTokens.spacing.md,
  },
  actionHint: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
    flex: 1,
  },
  materialToggleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: designTokens.spacing.sm,
    marginBottom: designTokens.spacing.sm,
  },
  materialToggleLabel: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    marginLeft: designTokens.spacing.sm,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: designTokens.spacing.md,
    marginBottom: designTokens.spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  newAssessmentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: designTokens.spacing.md,
    gap: designTokens.spacing.xs,
  },
  newAssessmentText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.primary[500],
    fontWeight: designTokens.typography.fontWeight.medium as any,
  },
  menuLink: {
    alignSelf: 'center',
    padding: designTokens.spacing.sm,
  },
  menuLinkText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.primary[600],
    textAlign: 'center',
  },
  confidenceContainer: {
    marginTop: designTokens.spacing.md,
    paddingTop: designTokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.border.secondary,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  confidenceLabel: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    fontWeight: designTokens.typography.fontWeight.medium as any,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: designTokens.colors.background.secondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidencePercent: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
    minWidth: 35,
  },
  adjustmentsContainer: {
    marginTop: designTokens.spacing.sm,
  },
  adjustmentsTitle: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.secondary,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    marginBottom: designTokens.spacing.xs,
  },
  adjustmentItem: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.tertiary,
    marginLeft: designTokens.spacing.sm,
    lineHeight: 18,
  },
  fallbackBanner: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 1,
    borderRadius: designTokens.borderRadius.md,
    padding: designTokens.spacing.md,
    marginHorizontal: designTokens.spacing.md,
    marginBottom: designTokens.spacing.sm,
    gap: designTokens.spacing.sm,
  },
  fallbackBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  fallbackRetryButton: {
    alignSelf: 'flex-start',
    borderColor: '#856404',
  },
  fallbackBannerText: {
    flex: 1,
    fontSize: designTokens.typography.fontSize.sm,
    color: '#856404',
    lineHeight: 20,
  },
  saveErrorBanner: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
  },
  saveErrorText: {
    color: '#842029',
  },
  saveErrorRetryButton: {
    alignSelf: 'flex-start',
    borderColor: '#842029',
  },
  connectionErrorCard: {
    padding: designTokens.spacing.lg,
    alignItems: 'center',
    marginTop: designTokens.spacing.md,
  },
  connectionErrorTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
    marginTop: designTokens.spacing.md,
    marginBottom: designTokens.spacing.sm,
    textAlign: 'center',
  },
  connectionErrorText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: designTokens.spacing.lg,
  },
  connectionErrorButton: {
    width: '100%',
  },
  connectionErrorLink: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.primary[500],
    fontWeight: designTokens.typography.fontWeight.medium as any,
    marginTop: designTokens.spacing.md,
  },
  // Skeleton loading styles
  skeletonBar: {
    height: 14,
    borderRadius: 7,
    backgroundColor: designTokens.colors.background.secondary,
    width: '70%',
  },
  skeletonBarShort: {
    width: '45%',
    marginTop: 8,
  },
  skeletonStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
    marginHorizontal: designTokens.spacing.md,
    marginBottom: designTokens.spacing.md,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    backgroundColor: designTokens.colors.primary[50],
    borderRadius: designTokens.borderRadius.md,
    borderWidth: 1,
    borderColor: designTokens.colors.primary[200],
  },
  skeletonStatusText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.primary[600],
    fontWeight: designTokens.typography.fontWeight.medium as any,
  },
  skeletonTaskCard: {
    backgroundColor: 'white',
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.md,
    marginHorizontal: designTokens.spacing.md,
    marginBottom: designTokens.spacing.sm,
    borderWidth: 1,
    borderColor: designTokens.colors.border.primary,
    opacity: 0.6,
  },
  skeletonTaskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: designTokens.spacing.sm,
  },
  skeletonCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: designTokens.colors.background.secondary,
  },
  skeletonCostRow: {
    marginTop: designTokens.spacing.sm,
    marginLeft: 32,
  },
});
