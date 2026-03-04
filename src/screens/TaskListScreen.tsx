import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import designTokens from '../styles/designTokens';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { AIService } from '../services/ai/AIServiceEdge';
import { useAuth } from '../contexts/AuthContext';
import LoginSignupModal from '../components/modals/LoginSignupModal';
import UpgradePromptModal from '../components/modals/UpgradePromptModal';

interface Task {
  id: string;
  description: string;
  category: string;
  estimatedCost: {
    min: number;
    max: number;
  };
  finalPrice?: number; // User's quoted price (defaults to max)
  materials?: string[];
  laborDays?: number;
  selected: boolean;
}

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
  const [pendingQuoteGeneration, setPendingQuoteGeneration] = useState(false);
  const [previousAuthState, setPreviousAuthState] = useState(isAnonymous);

  useEffect(() => {
    if (isViewingGenerated && savedQuote) {
      // Load existing generated quote data - NO AI CALL NEEDED
      console.log('🔄 Loading existing quote, skipping AI generation');
      loadExistingQuoteData();
    } else if (!isViewingGenerated) {
      // Generate new quote from site notes
      console.log('🚀 Generating new quote with AI');
      generateTasksFromNotes();
    }
  }, [savedQuote]); // Re-run when savedQuote changes (e.g., after editing)

  // Watch for auth state changes and retry quote generation if needed
  useEffect(() => {
    // Detect transition from anonymous to authenticated
    if (previousAuthState === true && isAnonymous === false) {
      console.log('🔄 User authenticated! Auth transition detected');
      setPreviousAuthState(false);

      // If we have pending quote generation, retry after a small delay
      if (pendingQuoteGeneration && canGenerateQuote()) {
        console.log('⏱️ Waiting for auth state to stabilize...');
        setTimeout(() => {
          console.log('🚀 Retrying quote generation after auth...');
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
    console.log('📋 Loading existing quote data:', savedQuote.id);

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

      const existingQuotesJson = await AsyncStorage.getItem('saved_quotes');
      const existingQuotes = existingQuotesJson ? JSON.parse(existingQuotesJson) : [];

      // Update or add the generated quote
      const updatedQuotes = existingQuotes.filter((q: any) => q.id !== generatedQuote.id);
      updatedQuotes.push(generatedQuote);

      // Sort by last modified
      updatedQuotes.sort((a: any, b: any) => b.lastModified - a.lastModified);

      await AsyncStorage.setItem('saved_quotes', JSON.stringify(updatedQuotes));

      setCurrentQuote(generatedQuote);
      console.log('💾 Auto-saved generated quote:', generatedQuote.id);
    } catch (error) {
      console.error('Error auto-saving generated quote:', error);
    }
  };

  // Helper function to convert image URIs to base64
  const convertImagesToBase64 = async (
    imageUris: string[]
  ): Promise<{ base64: string; mimeType: string }[]> => {
    const images: { base64: string; mimeType: string }[] = [];

    for (const uri of imageUris) {
      try {
        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Determine mime type from extension
        const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';

        images.push({ base64, mimeType });
        console.log(`📸 Converted image to base64: ${uri.substring(0, 50)}...`);
      } catch (error) {
        console.error(`Failed to convert image: ${uri}`, error);
      }
    }

    return images;
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
        console.log(
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
      console.log('🔍 Quote generation check:', {
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

      // Convert photos to base64 for AI analysis
      let images: { base64: string; mimeType: string }[] = [];
      if (siteNotes.photos && siteNotes.photos.length > 0) {
        console.log(`📸 Converting ${siteNotes.photos.length} photos to base64...`);
        images = await convertImagesToBase64(siteNotes.photos);
        console.log(`✅ Converted ${images.length} photos successfully`);
      }

      // Convert voice recordings to base64 for AI analysis
      let audioFiles: { base64: string; mimeType: string }[] = [];
      if (siteNotes.voiceRecordings && siteNotes.voiceRecordings.length > 0) {
        console.log(
          `🎤 Converting ${siteNotes.voiceRecordings.length} voice recordings to base64...`
        );
        audioFiles = await convertAudioToBase64(siteNotes.voiceRecordings);
        console.log(`✅ Converted ${audioFiles.length} audio files successfully`);
      }

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

      // Prepare comprehensive prompt with ALL user input
      const prompt = `You are a UK construction cost estimator. Analyze this project in detail and provide accurate quotes based on ALL the information provided.

PROJECT DETAILS:
📍 Location: ${siteNotes.address}
🏠 Property Type: ${siteNotes.propertyType || 'Not specified'}
📐 Size/Dimensions: ${siteNotes.size || 'Not specified'}
🔧 Job Type: ${siteNotes.jobType}
${constructionMethodInfo}

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
• Provide realistic UK construction costs for 2024/2025
• Consider quality levels appropriate for the property type
${images.length > 0 ? '• ANALYZE THE ATTACHED PHOTOS to assess the current condition and scope of work' : ''}
${audioFiles.length > 0 ? '• LISTEN TO THE ATTACHED VOICE RECORDINGS for verbal descriptions and requirements' : ''}
${siteNotes.constructionMethod ? `• IMPORTANT: Apply ${siteNotes.constructionMethodMultiplier}x price adjustment for ${siteNotes.constructionMethodLabel} construction method` : ''}

Provide detailed cost breakdown with materials, labor, and realistic price ranges based on current UK market rates.`;

      // Call AI service with images and audio if available
      const hasMedia = images.length > 0 || audioFiles.length > 0;
      const response = await aiService.analyzeImage({
        message: prompt,
        images: images.length > 0 ? images : undefined,
        audio: audioFiles.length > 0 ? audioFiles : undefined,
        analysisType: hasMedia ? 'image' : 'chat',
      });

      console.log('🤖 AI Response received:', response);
      setAiAnalysis(response);

      // Parse AI response into structured tasks
      const parsedTasks = parseAIResponseToTasks(response);
      setTasks(parsedTasks);

      // Auto-save the generated quote
      await autoSaveGeneratedQuote(parsedTasks, response);

      // Increment quote usage for tracking
      await incrementQuoteUsage();
    } catch (error) {
      console.error('Error generating tasks:', error);
      // Fallback to template-based tasks
      generateTemplateTasks();
    } finally {
      setIsProcessing(false);
    }
  };

  const parseAIResponseToTasks = (aiResponse: any): Task[] => {
    const tasks: Task[] = [];

    console.log('📋 Edge Function returned structured data:', aiResponse);

    // Check if we have JSON-parsed tasks from Gemini
    if (aiResponse?.tasks && Array.isArray(aiResponse.tasks)) {
      console.log('✨ Using AI-generated JSON tasks from Gemini');

      // Convert Gemini tasks to app format
      aiResponse.tasks.forEach((task: any, index: number) => {
        const maxCost = task.max_cost || 500;
        tasks.push({
          id: `task-${index}`,
          description: task.description,
          category: task.category || 'General',
          estimatedCost: {
            min: task.min_cost || 100,
            max: maxCost,
          },
          finalPrice: maxCost, // Default to max estimate
          materials: task.materials || [],
          laborDays: task.labor_days || 1,
          selected: true,
        });
      });

      // Store summary for display
      if (aiResponse.summary) {
        setAiAnalysis({
          ...aiResponse,
          confidence: aiResponse.summary.confidence || 75,
          locationMultiplier: aiResponse.summary.location_multiplier || 1.0,
          sizeMultiplier: aiResponse.summary.size_multiplier || 1.0,
        });
      }
    }
    // Fallback to materials if no tasks
    else if (aiResponse?.costBreakdown?.materials?.items) {
      console.log('⚠️ No tasks from Gemini, using material items');

      // Convert materials to tasks
      aiResponse.costBreakdown.materials.items.forEach((item: any, index: number) => {
        const maxCost = Math.round(item.totalPrice * 1.1);
        tasks.push({
          id: `material-${index}`,
          description: item.name,
          category: item.category.charAt(0).toUpperCase() + item.category.slice(1),
          estimatedCost: {
            min: Math.round(item.totalPrice * 0.9),
            max: maxCost,
          },
          finalPrice: maxCost, // Default to max estimate
          materials: [item.name],
          laborDays: 0,
          selected: true,
        });
      });

      // Add labor as a separate task
      if (aiResponse.costBreakdown.labor) {
        const laborMax = aiResponse.costBreakdown.labor.max;
        tasks.push({
          id: 'labor-task',
          description: 'Professional labor and installation',
          category: 'Labor',
          estimatedCost: {
            min: aiResponse.costBreakdown.labor.min,
            max: laborMax,
          },
          finalPrice: laborMax, // Default to max estimate
          materials: ['Professional installation'],
          laborDays: Math.round(aiResponse.costBreakdown.labor.estimatedHours / 8),
          selected: true,
        });
      }

      // Add user-selected tasks from the form if they're not already covered
      if (siteNotes.tasks && siteNotes.tasks.length > 0) {
        console.log('🔍 Processing user tasks:', siteNotes.tasks);
        siteNotes.tasks.forEach((userTask: any, index: number) => {
          // Ensure userTask is a valid string
          if (!userTask || typeof userTask !== 'string') {
            console.warn('Skipping invalid task:', userTask);
            return;
          }

          // Check if this task is already covered by AI materials/labor
          const alreadyCovered = tasks.some(
            task =>
              task.description.toLowerCase().includes(userTask.toLowerCase()) ||
              userTask.toLowerCase().includes(task.description.toLowerCase())
          );

          if (!alreadyCovered) {
            // Add user task with estimated cost based on project total
            const avgCost =
              (aiResponse.costBreakdown.total.min + aiResponse.costBreakdown.total.max) / 2;
            const taskCost = Math.round(avgCost * 0.15); // Roughly 15% of total per additional task
            const maxTaskCost = Math.round(taskCost * 1.2);

            tasks.push({
              id: `user-task-${index}`,
              description: userTask,
              category: 'Additional Work',
              estimatedCost: {
                min: Math.round(taskCost * 0.8),
                max: maxTaskCost,
              },
              finalPrice: maxTaskCost, // Default to max estimate
              materials: [userTask],
              laborDays: 2,
              selected: true, // User selected these
            });
          }
        });
      }
    }

    // Fallback only if no structured data
    if (tasks.length === 0) {
      console.log('⚠️ No structured data, using fallback');
      generateTemplateTasks();
      return [];
    }

    console.log(`📋 Generated ${tasks.length} tasks from structured data`);
    return tasks;
  };

  const getTaskTemplates = (jobType: string) => {
    const templates: any = {
      extension: [
        {
          description: 'Planning permission and building regulations',
          category: 'Planning',
          estimatedCost: { min: 1500, max: 3000 },
          materials: ['Planning documents', 'Architectural drawings'],
          laborDays: 0,
        },
        {
          description: 'Foundations and groundwork',
          category: 'Structural',
          estimatedCost: { min: 8000, max: 12000 },
          materials: ['Concrete', 'Steel reinforcement', 'DPM'],
          laborDays: 10,
        },
        {
          description: 'Structural walls and roof',
          category: 'Structural',
          estimatedCost: { min: 15000, max: 20000 },
          materials: ['Blocks', 'Mortar', 'Roof timbers', 'Tiles'],
          laborDays: 20,
        },
        {
          description: 'Windows and doors',
          category: 'Fixtures',
          estimatedCost: { min: 4000, max: 7000 },
          materials: ['UPVC windows', 'Composite doors'],
          laborDays: 3,
        },
        {
          description: 'Electrical and plumbing first fix',
          category: 'Services',
          estimatedCost: { min: 3000, max: 5000 },
          materials: ['Cables', 'Pipes', 'Consumer unit'],
          laborDays: 5,
        },
        {
          description: 'Insulation and plastering',
          category: 'Finishing',
          estimatedCost: { min: 3000, max: 4500 },
          materials: ['Insulation boards', 'Plasterboard', 'Plaster'],
          laborDays: 7,
        },
      ],
      bathroom: [
        {
          description: 'Strip out existing bathroom',
          category: 'Demolition',
          estimatedCost: { min: 300, max: 500 },
          materials: ['Skip hire'],
          laborDays: 1,
        },
        {
          description: 'Plumbing first fix',
          category: 'Services',
          estimatedCost: { min: 800, max: 1200 },
          materials: ['Pipes', 'Fittings'],
          laborDays: 2,
        },
        {
          description: 'Tiling walls and floor',
          category: 'Finishing',
          estimatedCost: { min: 1500, max: 2500 },
          materials: ['Tiles', 'Adhesive', 'Grout'],
          laborDays: 3,
        },
        {
          description: 'Install bathroom suite',
          category: 'Fixtures',
          estimatedCost: { min: 1500, max: 3000 },
          materials: ['Toilet', 'Basin', 'Bath/Shower'],
          laborDays: 2,
        },
        {
          description: 'Electrical work and lighting',
          category: 'Services',
          estimatedCost: { min: 500, max: 800 },
          materials: ['Lights', 'Switches', 'Extractor fan'],
          laborDays: 1,
        },
      ],
      kitchen: [
        {
          description: 'Remove old kitchen',
          category: 'Demolition',
          estimatedCost: { min: 400, max: 600 },
          materials: ['Skip hire'],
          laborDays: 1,
        },
        {
          description: 'Electrical rewiring',
          category: 'Services',
          estimatedCost: { min: 1200, max: 2000 },
          materials: ['Cables', 'Sockets', 'Consumer unit update'],
          laborDays: 2,
        },
        {
          description: 'Plumbing for appliances',
          category: 'Services',
          estimatedCost: { min: 600, max: 1000 },
          materials: ['Pipes', 'Valves'],
          laborDays: 1,
        },
        {
          description: 'Install kitchen units',
          category: 'Fixtures',
          estimatedCost: { min: 3000, max: 8000 },
          materials: ['Base units', 'Wall units', 'Doors'],
          laborDays: 3,
        },
        {
          description: 'Worktops and splashback',
          category: 'Finishing',
          estimatedCost: { min: 1500, max: 3000 },
          materials: ['Worktop', 'Splashback tiles'],
          laborDays: 2,
        },
        {
          description: 'Appliances installation',
          category: 'Fixtures',
          estimatedCost: { min: 2000, max: 5000 },
          materials: ['Oven', 'Hob', 'Dishwasher', 'Fridge'],
          laborDays: 1,
        },
      ],
      patio: [
        {
          description: 'Site clearance and preparation',
          category: 'Groundwork',
          estimatedCost: { min: 300, max: 600 },
          materials: ['Skip hire', 'Weed killer'],
          laborDays: 1,
        },
        {
          description: 'Excavation and sub-base',
          category: 'Groundwork',
          estimatedCost: { min: 800, max: 1500 },
          materials: ['Hardcore', 'MOT Type 1', 'Sand'],
          laborDays: 2,
        },
        {
          description: 'Edging and borders',
          category: 'Structure',
          estimatedCost: { min: 400, max: 800 },
          materials: ['Edging blocks', 'Cement', 'Sand'],
          laborDays: 1,
        },
        {
          description: 'Paving slabs installation',
          category: 'Surface',
          estimatedCost: { min: 2000, max: 4500 },
          materials: ['Paving slabs', 'Mortar', 'Jointing compound'],
          laborDays: 3,
        },
        {
          description: 'Pointing and finishing',
          category: 'Finishing',
          estimatedCost: { min: 300, max: 500 },
          materials: ['Pointing compound', 'Sealant'],
          laborDays: 1,
        },
      ],
      driveway: [
        {
          description: 'Site clearance and excavation',
          category: 'Groundwork',
          estimatedCost: { min: 1000, max: 2000 },
          materials: ['Skip hire', 'Machinery hire'],
          laborDays: 2,
        },
        {
          description: 'Sub-base installation',
          category: 'Groundwork',
          estimatedCost: { min: 1500, max: 3000 },
          materials: ['MOT Type 1', 'Hardcore', 'Compactor hire'],
          laborDays: 2,
        },
        {
          description: 'Edging and kerbs',
          category: 'Structure',
          estimatedCost: { min: 600, max: 1200 },
          materials: ['Kerb stones', 'Edging', 'Cement'],
          laborDays: 1,
        },
        {
          description: 'Block paving / surface',
          category: 'Surface',
          estimatedCost: { min: 3000, max: 6000 },
          materials: ['Block pavers', 'Kiln dried sand', 'Edge restraints'],
          laborDays: 4,
        },
        {
          description: 'Drainage installation',
          category: 'Services',
          estimatedCost: { min: 500, max: 1000 },
          materials: ['Channel drain', 'Soakaway crate', 'Pipes'],
          laborDays: 1,
        },
        {
          description: 'Drop kerb (council application)',
          category: 'Planning',
          estimatedCost: { min: 800, max: 1500 },
          materials: ['Council fees', 'Dropped kerb stones'],
          laborDays: 1,
        },
      ],
      conservatory: [
        {
          description: 'Planning and building regulations',
          category: 'Planning',
          estimatedCost: { min: 500, max: 1500 },
          materials: ['Planning documents', 'Building regs fees'],
          laborDays: 0,
        },
        {
          description: 'Foundations and base',
          category: 'Structural',
          estimatedCost: { min: 3000, max: 5000 },
          materials: ['Concrete', 'DPM', 'Steel reinforcement'],
          laborDays: 5,
        },
        {
          description: 'Dwarf walls construction',
          category: 'Structural',
          estimatedCost: { min: 1500, max: 3000 },
          materials: ['Bricks', 'Blocks', 'Mortar', 'DPC'],
          laborDays: 3,
        },
        {
          description: 'Frame and glazing installation',
          category: 'Structure',
          estimatedCost: { min: 6000, max: 12000 },
          materials: ['UPVC/Aluminium frame', 'Double glazing units'],
          laborDays: 4,
        },
        {
          description: 'Roof system',
          category: 'Structure',
          estimatedCost: { min: 3000, max: 6000 },
          materials: ['Polycarbonate/Glass roof', 'Roof bars', 'Guttering'],
          laborDays: 2,
        },
        {
          description: 'Electrical installation',
          category: 'Services',
          estimatedCost: { min: 800, max: 1500 },
          materials: ['Cables', 'Sockets', 'Lighting'],
          laborDays: 1,
        },
        {
          description: 'Flooring and finishing',
          category: 'Finishing',
          estimatedCost: { min: 1500, max: 3000 },
          materials: ['Floor tiles', 'Underfloor heating', 'Skirting'],
          laborDays: 2,
        },
      ],
      roofing: [
        {
          description: 'Scaffolding',
          category: 'Access',
          estimatedCost: { min: 800, max: 1200 },
          materials: ['Scaffold hire'],
          laborDays: 1,
        },
        {
          description: 'Strip existing roof covering',
          category: 'Demolition',
          estimatedCost: { min: 1000, max: 1500 },
          materials: ['Skip hire'],
          laborDays: 2,
        },
        {
          description: 'Replace battens and felt',
          category: 'Structural',
          estimatedCost: { min: 2000, max: 3000 },
          materials: ['Battens', 'Breathable membrane'],
          laborDays: 3,
        },
        {
          description: 'Install new tiles/slates',
          category: 'Covering',
          estimatedCost: { min: 4000, max: 7000 },
          materials: ['Tiles/Slates', 'Ridge tiles', 'Hip tiles'],
          laborDays: 5,
        },
        {
          description: 'Guttering and fascias',
          category: 'Finishing',
          estimatedCost: { min: 1200, max: 2000 },
          materials: ['UPVC guttering', 'Fascia boards'],
          laborDays: 2,
        },
      ],
      renovation: [
        {
          description: 'Structural assessment',
          category: 'Planning',
          estimatedCost: { min: 500, max: 1000 },
          materials: ['Survey report'],
          laborDays: 0,
        },
        {
          description: 'Demolition and strip out',
          category: 'Demolition',
          estimatedCost: { min: 2000, max: 4000 },
          materials: ['Skip hire', 'Waste removal'],
          laborDays: 5,
        },
        {
          description: 'Structural repairs',
          category: 'Structural',
          estimatedCost: { min: 5000, max: 15000 },
          materials: ['Timber', 'Steel beams', 'Concrete'],
          laborDays: 10,
        },
        {
          description: 'Complete rewiring',
          category: 'Services',
          estimatedCost: { min: 3000, max: 5000 },
          materials: ['Cables', 'Consumer unit', 'Sockets'],
          laborDays: 5,
        },
        {
          description: 'Plumbing and heating',
          category: 'Services',
          estimatedCost: { min: 4000, max: 7000 },
          materials: ['Boiler', 'Radiators', 'Pipes'],
          laborDays: 7,
        },
        {
          description: 'Plastering all walls',
          category: 'Finishing',
          estimatedCost: { min: 3000, max: 5000 },
          materials: ['Plasterboard', 'Plaster', 'Beading'],
          laborDays: 7,
        },
        {
          description: 'Flooring throughout',
          category: 'Finishing',
          estimatedCost: { min: 3000, max: 6000 },
          materials: ['Flooring', 'Underlay', 'Skirting'],
          laborDays: 5,
        },
      ],
      other: [
        {
          description: 'Initial survey and planning',
          category: 'Planning',
          estimatedCost: { min: 300, max: 500 },
          materials: [],
          laborDays: 0,
        },
        {
          description: 'General building work',
          category: 'General',
          estimatedCost: { min: 2000, max: 5000 },
          materials: ['Various materials'],
          laborDays: 5,
        },
        {
          description: 'Finishing and decoration',
          category: 'Finishing',
          estimatedCost: { min: 1000, max: 2000 },
          materials: ['Paint', 'Decorating materials'],
          laborDays: 3,
        },
      ],
    };

    return templates[jobType] || templates.other;
  };

  const generateTemplateTasks = () => {
    const tasks = getTaskTemplates(siteNotes.jobType);
    setTasks(
      tasks.map((t: any, i: number) => ({
        ...t,
        id: `task-${i}`,
        finalPrice: t.estimatedCost.max, // Default to max estimate
        selected: true,
      }))
    );
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
      },
    });
  };

  if (isProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={designTokens.colors.primary[500]} />
          <Text style={styles.processingTitle}>🤖 Analyzing Your Notes...</Text>
          <Text style={styles.processingText}>Extracting tasks and calculating costs</Text>
          <View style={styles.processingSteps}>
            <Text style={styles.processingStep}>⚡ Extracting Tasks</Text>
            <Text style={styles.processingStep}>💰 Calculating Costs</Text>
            <Text style={styles.processingStep}>📋 Building Quote</Text>
          </View>
        </View>
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
                  Your Price: £{(task.finalPrice || task.estimatedCost.max).toLocaleString()}
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

        {/* Total Cost with Confidence */}
        <Card style={styles.totalCard}>
          {/* Final Cost (if set) */}
          {finalCost !== null && (
            <View style={styles.finalCostDisplay}>
              <Text style={styles.finalCostDisplayLabel}>Your Quote Price</Text>
              <Text style={styles.finalCostDisplayAmount}>£{finalCost.toLocaleString()}</Text>
            </View>
          )}

          <Text style={styles.totalLabel}>
            {finalCost !== null ? 'Estimated Range' : 'Estimated Total'}
          </Text>
          <Text style={[styles.totalAmount, finalCost !== null && styles.totalAmountSmall]}>
            £{totalCost.min.toLocaleString()} - £{totalCost.max.toLocaleString()}
          </Text>
          <Text style={styles.totalNote}>*Prices include materials and labor</Text>

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
            <Text style={styles.actionHint}>
              ✨ Your quote has been generated and saved! Choose your next step:
            </Text>
          )}
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
        </View>
      </ScrollView>

      {/* Login/Signup Modal for Anonymous Users */}
      <LoginSignupModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
          // The useEffect will handle retrying when auth state updates
          console.log('✅ Login successful, waiting for auth state update...');
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
          // TODO: Navigate to payment flow
          Alert.alert('Coming Soon', 'Payment integration coming in next update');
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
  processingTitle: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
    marginTop: designTokens.spacing.lg,
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
  processingStep: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    marginTop: designTokens.spacing.md,
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
  finalCostDisplayLabel: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    fontWeight: designTokens.typography.fontWeight.medium as any,
  },
  finalCostDisplayAmount: {
    fontSize: designTokens.typography.fontSize['3xl'],
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.primary[600],
    marginTop: designTokens.spacing.xs,
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
  actionHint: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    marginBottom: designTokens.spacing.md,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: designTokens.spacing.md,
    marginBottom: designTokens.spacing.lg,
  },
  actionButton: {
    flex: 1,
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
});
