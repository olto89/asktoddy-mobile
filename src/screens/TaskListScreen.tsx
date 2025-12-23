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
import designTokens from '../styles/designTokens';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { AIService } from '../services/ai/AIServiceEdge';

interface Task {
  id: string;
  description: string;
  category: string;
  estimatedCost: {
    min: number;
    max: number;
  };
  materials?: string[];
  laborDays?: number;
  selected: boolean;
}

export default function TaskListScreen({ navigation, route }: any) {
  const { siteNotes } = route.params;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);
  const [totalCost, setTotalCost] = useState({ min: 0, max: 0 });
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  useEffect(() => {
    generateTasksFromNotes();
  }, []);

  useEffect(() => {
    // Calculate total when tasks change
    const selected = tasks.filter(t => t.selected);
    const total = selected.reduce(
      (acc, task) => ({
        min: acc.min + task.estimatedCost.min,
        max: acc.max + task.estimatedCost.max,
      }),
      { min: 0, max: 0 }
    );
    setTotalCost(total);
  }, [tasks]);

  const generateTasksFromNotes = async () => {
    try {
      const aiService = AIService;

      // Prepare the prompt
      const prompt = `Analyze this construction project and generate a detailed task list with cost estimates:

Property: ${siteNotes.address}
Job Type: ${siteNotes.jobType}
Property Type: ${siteNotes.propertyType || 'Not specified'}
Size: ${siteNotes.size || 'Not specified'}
Selected Tasks: ${siteNotes.tasks.join(', ')}
Additional Notes: ${siteNotes.notes}

Please provide:
1. A comprehensive task list with UK market cost estimates
2. Break down each task with materials and labor
3. Identify any additional tasks that might be needed
4. Provide realistic cost ranges for each task`;

      // Call AI service
      const response = await aiService.processChat(prompt);

      console.log('🤖 AI Response received:', response);
      setAiAnalysis(response);

      // Parse AI response into structured tasks
      const parsedTasks = parseAIResponseToTasks(response);
      setTasks(parsedTasks);
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

    // Edge function now returns fully structured ProjectAnalysis
    if (aiResponse?.costBreakdown?.materials?.items) {
      console.log('✨ Using structured edge function data');

      // Convert materials to tasks
      aiResponse.costBreakdown.materials.items.forEach((item: any, index: number) => {
        tasks.push({
          id: `material-${index}`,
          description: item.name,
          category: item.category.charAt(0).toUpperCase() + item.category.slice(1),
          estimatedCost: {
            min: Math.round(item.totalPrice * 0.9),
            max: Math.round(item.totalPrice * 1.1),
          },
          materials: [item.name],
          laborDays: 0,
          selected: true,
        });
      });

      // Add labor as a separate task
      if (aiResponse.costBreakdown.labor) {
        tasks.push({
          id: 'labor-task',
          description: 'Professional labor and installation',
          category: 'Labor',
          estimatedCost: {
            min: aiResponse.costBreakdown.labor.min,
            max: aiResponse.costBreakdown.labor.max,
          },
          materials: ['Professional installation'],
          laborDays: Math.round(aiResponse.costBreakdown.labor.estimatedHours / 8),
          selected: true,
        });
      }

      // Add project phases as tasks if available
      if (aiResponse.timeline?.phases) {
        aiResponse.timeline.phases.forEach((phase: any, index: number) => {
          tasks.push({
            id: `phase-${index}`,
            description: phase.description,
            category: 'Project Phase',
            estimatedCost: {
              min: 0,
              max: 0,
            },
            materials: [],
            laborDays: parseInt(phase.duration) || 1,
            selected: false, // Don't select phases by default
          });
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

    // Save the generated quote with 'generated' status
    try {
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
        status: 'generated' as const, // Mark as generated
        generatedTasks: selectedTasks,
        totalCost,
        aiAnalysis,
      };

      const existingQuotesJson = await AsyncStorage.getItem('saved_quotes');
      const existingQuotes = existingQuotesJson ? JSON.parse(existingQuotesJson) : [];

      // Update or add the generated quote
      const updatedQuotes = existingQuotes.filter((q: any) => q.id !== generatedQuote.id);
      updatedQuotes.push(generatedQuote);

      // Sort by last modified
      updatedQuotes.sort((a: any, b: any) => b.lastModified - a.lastModified);

      await AsyncStorage.setItem('saved_quotes', JSON.stringify(updatedQuotes));

      console.log('💾 Saved generated quote:', generatedQuote.id);
    } catch (error) {
      console.error('Error saving generated quote:', error);
    }

    navigation.navigate('EditQuote', {
      tasks: selectedTasks,
      totalCost,
      siteNotes,
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={designTokens.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>📋 Generated Tasks</Text>
          <View style={{ width: 24 }} />
        </View>

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
                <Text style={[styles.costRange, !task.selected && styles.costRangeInactive]}>
                  £{task.estimatedCost.min.toLocaleString()} - £
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

        {/* Total Cost */}
        <Card style={styles.totalCard}>
          <Text style={styles.totalLabel}>Estimated Total</Text>
          <Text style={styles.totalAmount}>
            £{totalCost.min.toLocaleString()} - £{totalCost.max.toLocaleString()}
          </Text>
          <Text style={styles.totalNote}>*Prices include materials and labor</Text>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Edit Quote"
            onPress={handleEditQuote}
            variant="primary"
            fullWidth
            icon={<Ionicons name="create-outline" size={20} color="white" />}
          />
        </View>
      </ScrollView>
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
  costRange: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.primary[600],
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
  totalNote: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    marginTop: designTokens.spacing.sm,
  },
  actions: {
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.lg,
  },
});
