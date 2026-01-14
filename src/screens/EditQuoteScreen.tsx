import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import designTokens from '../styles/designTokens';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

interface Task {
  id: string;
  description: string;
  category: string;
  estimatedCost: {
    min: number;
    max: number;
  };
  finalPrice?: number; // User's quoted price for this line item
  materials?: string[];
  laborDays?: number;
  selected: boolean;
}

export default function EditQuoteScreen({ navigation, route }: any) {
  const { tasks = [], totalCost = { min: 0, max: 0 }, siteNotes, savedQuote } = route.params;

  // Initialize tasks with finalPrice defaulting to max cost
  const initializeTasks = (taskList: Task[]): Task[] => {
    return taskList.map(task => ({
      ...task,
      finalPrice: task.finalPrice ?? task.estimatedCost.max,
    }));
  };

  const [editedTasks, setEditedTasks] = useState<Task[]>(initializeTasks(tasks));
  const [projectNotes, setProjectNotes] = useState(savedQuote?.projectNotes || '');
  const [customerName, setCustomerName] = useState(savedQuote?.customerName || '');
  const [quoteName, setQuoteName] = useState('');

  useEffect(() => {
    // Set initial quote name based on site notes
    setQuoteName(
      savedQuote?.quoteName ||
        `${siteNotes?.jobType || 'Project'} - ${siteNotes?.address || 'Quote'}`
    );
  }, [siteNotes, savedQuote]);

  const updateTaskFinalPrice = (taskId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedTasks(prev =>
      prev.map(task => (task.id === taskId ? { ...task, finalPrice: numValue } : task))
    );
  };

  const updateTaskDescription = (taskId: string, description: string) => {
    setEditedTasks(prev =>
      prev.map(task => (task.id === taskId ? { ...task, description } : task))
    );
  };

  const updateTaskMaterials = (taskId: string, materialsText: string) => {
    // Convert comma-separated string to array
    const materials = materialsText
      .split(',')
      .map(m => m.trim())
      .filter(m => m.length > 0);
    setEditedTasks(prev => prev.map(task => (task.id === taskId ? { ...task, materials } : task)));
  };

  const removeTask = (taskId: string) => {
    setEditedTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const calculateFinalTotal = () => {
    return editedTasks.reduce((acc, task) => acc + (task.finalPrice || 0), 0);
  };

  const calculateRange = () => {
    return editedTasks.reduce(
      (acc, task) => ({
        min: acc.min + task.estimatedCost.min,
        max: acc.max + task.estimatedCost.max,
      }),
      { min: 0, max: 0 }
    );
  };

  const handleSaveQuote = async () => {
    try {
      const rangeTotal = calculateRange();
      const finalTotal = calculateFinalTotal();
      const updatedQuote = {
        ...route.params.savedQuote, // Keep existing quote data
        quoteName,
        customerName,
        generatedTasks: editedTasks, // Update the tasks with finalPrice per item
        totalCost: rangeTotal,
        finalCost: finalTotal, // Auto-calculated from line items
        projectNotes,
        lastModified: Date.now(),
        status: 'generated', // Keep as generated quote
      };

      // Update the existing quote in AsyncStorage
      const existingQuotes = await AsyncStorage.getItem('saved_quotes');
      const quotes = existingQuotes ? JSON.parse(existingQuotes) : [];

      // Find and update the existing quote
      const updatedQuotes = quotes.map((q: any) => (q.id === updatedQuote.id ? updatedQuote : q));

      await AsyncStorage.setItem('saved_quotes', JSON.stringify(updatedQuotes));

      // Navigate back with updated data so the previous screen can refresh
      Alert.alert('Quote Updated', 'Your changes have been saved.', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to TaskList with updated quote data
            navigation.navigate('TaskList', {
              siteNotes: route.params.siteNotes,
              savedQuote: updatedQuote,
              isViewingGenerated: true,
            });
          },
        },
      ]);
    } catch (error) {
      console.error('Error saving quote:', error);
      Alert.alert('Error', 'Failed to save quote. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={designTokens.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>✏️ Edit Quote</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Quote Details */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Quote Details</Text>

          <Text style={styles.fieldLabel}>Quote Name</Text>
          <TextInput
            style={styles.textInput}
            value={quoteName}
            onChangeText={setQuoteName}
            placeholder="Enter quote name..."
            placeholderTextColor={designTokens.colors.text.tertiary}
          />

          <Text style={styles.fieldLabel}>Customer Name (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Customer name..."
            placeholderTextColor={designTokens.colors.text.tertiary}
          />

          <Text style={styles.fieldLabel}>Project Notes</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={projectNotes}
            onChangeText={setProjectNotes}
            placeholder="Additional notes about this project..."
            placeholderTextColor={designTokens.colors.text.tertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </Card>

        {/* Tasks */}
        <View style={styles.tasksContainer}>
          <Text style={styles.sectionTitle}>Tasks & Costs</Text>
          {editedTasks.length === 0 ? (
            <Card style={styles.emptyTasksCard}>
              <View style={styles.emptyTasksContent}>
                <Ionicons
                  name="construct-outline"
                  size={48}
                  color={designTokens.colors.text.tertiary}
                />
                <Text style={styles.emptyTasksTitle}>No Tasks Available</Text>
                <Text style={styles.emptyTasksText}>
                  This quote doesn't have any tasks to edit. You may need to regenerate the quote.
                </Text>
                <Button
                  title="Regenerate Quote"
                  onPress={() => {
                    if (siteNotes) {
                      navigation.navigate('TaskList', { siteNotes });
                    } else {
                      Alert.alert('Error', 'Cannot regenerate quote - missing site information');
                    }
                  }}
                  variant="secondary"
                  style={{ marginTop: designTokens.spacing.md }}
                />
              </View>
            </Card>
          ) : (
            editedTasks.map((task, index) => (
              <Card key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskNumber}>{index + 1}.</Text>
                  <Text style={styles.taskCategory}>{task.category}</Text>
                  <TouchableOpacity onPress={() => removeTask(task.id)}>
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={designTokens.colors.error[500]}
                    />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.taskDescriptionInput}
                  value={task.description}
                  onChangeText={text => updateTaskDescription(task.id, text)}
                  multiline
                  placeholder="Task description..."
                  placeholderTextColor={designTokens.colors.text.tertiary}
                />

                <View style={styles.costSection}>
                  <View style={styles.priceInputRow}>
                    <Text style={styles.priceLabel}>Your Price:</Text>
                    <View style={styles.priceInputContainer}>
                      <Text style={styles.priceCurrency}>£</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={(task.finalPrice || 0).toString()}
                        onChangeText={text => updateTaskFinalPrice(task.id, text)}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={designTokens.colors.text.tertiary}
                      />
                    </View>
                  </View>
                  <Text style={styles.rangeHint}>
                    AI estimate: £{task.estimatedCost.min.toLocaleString()} - £
                    {task.estimatedCost.max.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.materialsContainer}>
                  <Text style={styles.materialsLabel}>Materials (comma-separated):</Text>
                  <TextInput
                    style={styles.materialsInput}
                    value={task.materials?.join(', ') || ''}
                    onChangeText={text => updateTaskMaterials(task.id, text)}
                    placeholder="e.g., Concrete, Steel, Timber..."
                    placeholderTextColor={designTokens.colors.text.tertiary}
                    multiline
                  />
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Cost Summary */}
        <Card style={styles.totalCard}>
          <Text style={styles.quoteTotalLabel}>Quote Total</Text>
          <Text style={styles.quoteTotalAmount}>£{calculateFinalTotal().toLocaleString()}</Text>
          <Text style={styles.quoteTotalNote}>Auto-calculated from line items above</Text>

          <View style={styles.rangeContainer}>
            <Text style={styles.rangeLabel}>AI Estimated Range:</Text>
            <Text style={styles.rangeValue}>
              £{calculateRange().min.toLocaleString()} - £{calculateRange().max.toLocaleString()}
            </Text>
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Save Quote"
            onPress={handleSaveQuote}
            variant="primary"
            fullWidth
            icon={<Ionicons name="save-outline" size={20} color="white" />}
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
  fieldLabel: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.secondary,
    marginBottom: designTokens.spacing.xs,
    marginTop: designTokens.spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: designTokens.colors.border.primary,
    borderRadius: designTokens.borderRadius.lg,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.primary,
    backgroundColor: 'white',
  },
  multilineInput: {
    minHeight: 80,
  },
  tasksContainer: {
    paddingHorizontal: designTokens.spacing.md,
  },
  taskCard: {
    marginBottom: designTokens.spacing.md,
    padding: designTokens.spacing.md,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  taskNumber: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.primary[600],
    marginRight: designTokens.spacing.sm,
  },
  taskCategory: {
    flex: 1,
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    fontStyle: 'italic',
  },
  taskDescriptionInput: {
    borderWidth: 1,
    borderColor: designTokens.colors.border.primary,
    borderRadius: designTokens.borderRadius.md,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.sm,
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.primary,
    backgroundColor: 'white',
    marginBottom: designTokens.spacing.sm,
    minHeight: 60,
  },
  costSection: {
    marginTop: designTokens.spacing.sm,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  priceLabel: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.secondary,
  },
  priceInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceCurrency: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.primary[600],
    marginRight: designTokens.spacing.xs,
  },
  priceInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: designTokens.colors.primary[500],
    borderRadius: designTokens.borderRadius.md,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.primary[600],
    backgroundColor: 'white',
  },
  rangeHint: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.tertiary,
    marginTop: designTokens.spacing.xs,
    fontStyle: 'italic',
  },
  materialsContainer: {
    marginTop: designTokens.spacing.sm,
  },
  materialsLabel: {
    fontSize: designTokens.typography.fontSize.xs,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.secondary,
    marginBottom: designTokens.spacing.xs,
  },
  materialsInput: {
    borderWidth: 1,
    borderColor: designTokens.colors.border.primary,
    borderRadius: designTokens.borderRadius.md,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.sm,
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.primary,
    backgroundColor: 'white',
    minHeight: 40,
  },
  totalCard: {
    marginHorizontal: designTokens.spacing.md,
    marginTop: designTokens.spacing.lg,
    padding: designTokens.spacing.lg,
    backgroundColor: designTokens.colors.primary[50],
    borderColor: designTokens.colors.primary[200],
  },
  quoteTotalLabel: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.secondary,
  },
  quoteTotalAmount: {
    fontSize: designTokens.typography.fontSize['3xl'],
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.primary[600],
    marginTop: designTokens.spacing.xs,
  },
  quoteTotalNote: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.tertiary,
    marginTop: designTokens.spacing.xs,
    fontStyle: 'italic',
  },
  rangeContainer: {
    marginTop: designTokens.spacing.md,
    paddingTop: designTokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.primary[200],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rangeLabel: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
  },
  rangeValue: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.secondary,
  },
  actions: {
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.lg,
  },
  emptyTasksCard: {
    marginBottom: designTokens.spacing.md,
    padding: designTokens.spacing.xl,
  },
  emptyTasksContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTasksTitle: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
    marginTop: designTokens.spacing.md,
    marginBottom: designTokens.spacing.sm,
    textAlign: 'center',
  },
  emptyTasksText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
