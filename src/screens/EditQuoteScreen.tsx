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
  materials?: string[];
  laborDays?: number;
  selected: boolean;
}

export default function EditQuoteScreen({ navigation, route }: any) {
  const { tasks = [], totalCost = { min: 0, max: 0 }, siteNotes, savedQuote } = route.params;
  const [editedTasks, setEditedTasks] = useState<Task[]>(tasks);
  const [projectNotes, setProjectNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [quoteName, setQuoteName] = useState('');

  useEffect(() => {
    // Set initial quote name based on site notes
    setQuoteName(`${siteNotes?.jobType || 'Project'} - ${siteNotes?.address || 'Quote'}`);
  }, [siteNotes]);

  const updateTaskCost = (taskId: string, field: 'min' | 'max', value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              estimatedCost: {
                ...task.estimatedCost,
                [field]: numValue,
              },
            }
          : task
      )
    );
  };

  const updateTaskDescription = (taskId: string, description: string) => {
    setEditedTasks(prev =>
      prev.map(task => (task.id === taskId ? { ...task, description } : task))
    );
  };

  const removeTask = (taskId: string) => {
    setEditedTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const calculateTotal = () => {
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
      const updatedQuote = {
        ...route.params.savedQuote, // Keep existing quote data
        quoteName,
        customerName,
        generatedTasks: editedTasks, // Update the tasks
        totalCost: calculateTotal(),
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

      // Simple success message and go back to QuoteView
      Alert.alert('Quote Updated', 'Your changes have been saved.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving quote:', error);
      Alert.alert('Error', 'Failed to save quote. Please try again.');
    }
  };

  const currentTotal = calculateTotal();

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

                <View style={styles.costInputs}>
                  <View style={styles.costInput}>
                    <Text style={styles.costLabel}>Min Cost (£)</Text>
                    <TextInput
                      style={styles.costField}
                      value={task.estimatedCost.min.toString()}
                      onChangeText={text => updateTaskCost(task.id, 'min', text)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={designTokens.colors.text.tertiary}
                    />
                  </View>

                  <View style={styles.costInput}>
                    <Text style={styles.costLabel}>Max Cost (£)</Text>
                    <TextInput
                      style={styles.costField}
                      value={task.estimatedCost.max.toString()}
                      onChangeText={text => updateTaskCost(task.id, 'max', text)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={designTokens.colors.text.tertiary}
                    />
                  </View>
                </View>

                {task.materials && task.materials.length > 0 && (
                  <View style={styles.materialsContainer}>
                    <Text style={styles.materialsLabel}>Materials:</Text>
                    <Text style={styles.materialsText}>{task.materials.join(', ')}</Text>
                  </View>
                )}
              </Card>
            ))
          )}
        </View>

        {/* Updated Total */}
        <Card style={styles.totalCard}>
          <Text style={styles.totalLabel}>Updated Total</Text>
          <Text style={styles.totalAmount}>
            £{currentTotal.min.toLocaleString()} - £{currentTotal.max.toLocaleString()}
          </Text>
          <Text style={styles.totalNote}>*Prices include materials and labor</Text>
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
  costInputs: {
    flexDirection: 'row',
    gap: designTokens.spacing.sm,
  },
  costInput: {
    flex: 1,
  },
  costLabel: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.secondary,
    marginBottom: designTokens.spacing.xs,
  },
  costField: {
    borderWidth: 1,
    borderColor: designTokens.colors.border.primary,
    borderRadius: designTokens.borderRadius.md,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.primary,
    backgroundColor: 'white',
  },
  materialsContainer: {
    marginTop: designTokens.spacing.sm,
    padding: designTokens.spacing.sm,
    backgroundColor: designTokens.colors.background.secondary,
    borderRadius: designTokens.borderRadius.md,
  },
  materialsLabel: {
    fontSize: designTokens.typography.fontSize.xs,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.secondary,
    marginBottom: designTokens.spacing.xs,
  },
  materialsText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.primary,
    lineHeight: 18,
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
