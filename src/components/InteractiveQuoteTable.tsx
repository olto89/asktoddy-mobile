/**
 * InteractiveQuoteTable - Editable quote display in chat
 * Allows users to refine quotes before generating PDF
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import designTokens from '../styles/designTokens';

interface QuoteItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category: 'materials' | 'labor' | 'tools';
}

interface InteractiveQuoteProps {
  analysis: any;
  onGeneratePDF: (updatedAnalysis: any) => void;
  onUpdateQuote: (updatedAnalysis: any) => void;
}

export default function InteractiveQuoteTable({
  analysis,
  onGeneratePDF,
  onUpdateQuote,
}: InteractiveQuoteProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [items, setItems] = useState<QuoteItem[]>(() => {
    const allItems: QuoteItem[] = [];

    // Extract materials from detailed items or fallback to summary
    if (
      analysis.costBreakdown?.materials?.items &&
      Array.isArray(analysis.costBreakdown.materials.items)
    ) {
      analysis.costBreakdown.materials.items.forEach((item: any, index: number) => {
        allItems.push({
          id: `mat-${index}`,
          name: item.name || 'Material Item',
          description: item.description || 'Construction materials',
          quantity: typeof item.quantity === 'string' ? 1 : item.quantity || 1,
          unit: typeof item.quantity === 'string' ? item.quantity : 'unit',
          unitPrice: item.unitPrice || item.totalPrice || 0,
          total: item.totalPrice || item.total || 0,
          category: 'materials',
        });
      });
    } else if (analysis.costBreakdown?.materials) {
      // Fallback for simple materials data
      const materialsTotal = analysis.costBreakdown.materials.max || 0;
      allItems.push({
        id: 'mat-1',
        name: 'Materials & Supplies',
        description: 'Construction materials and supplies',
        quantity: 1,
        unit: 'lot',
        unitPrice: materialsTotal,
        total: materialsTotal,
        category: 'materials',
      });
    }

    // Extract labor from detailed items or fallback to summary
    if (analysis.costBreakdown?.labor?.items && Array.isArray(analysis.costBreakdown.labor.items)) {
      analysis.costBreakdown.labor.items.forEach((item: any, index: number) => {
        allItems.push({
          id: `lab-${index}`,
          name: item.name || 'Labor Item',
          description: item.description || 'Construction work',
          quantity: item.hours || 1,
          unit: item.hours ? 'hours' : 'job',
          unitPrice: item.hourlyRate || item.total / (item.hours || 1) || 0,
          total: item.total || 0,
          category: 'labor',
        });
      });
    } else if (analysis.costBreakdown?.labor) {
      // Fallback for simple labor data
      const laborTotal = analysis.costBreakdown.labor.max || 0;
      allItems.push({
        id: 'lab-1',
        name: 'Professional Labor',
        description: 'Installation and construction work',
        quantity: 1,
        unit: 'job',
        unitPrice: laborTotal,
        total: laborTotal,
        category: 'labor',
      });
    }

    return allItems;
  });

  const [timeline, setTimeline] = useState(
    analysis.timeline?.professional || analysis.timeline?.diy || '1-2 weeks'
  );
  const [notes, setNotes] = useState('');

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const vat = subtotal * 0.2;
    const total = subtotal + vat;
    return { subtotal, vat, total };
  };

  const handleItemEdit = (itemId: string, field: string, value: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const numValue = parseFloat(value) || 0;
          if (field === 'quantity' || field === 'unitPrice') {
            const quantity = field === 'quantity' ? numValue : item.quantity;
            const unitPrice = field === 'unitPrice' ? numValue : item.unitPrice;
            return {
              ...item,
              [field]: numValue,
              total: quantity * unitPrice,
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleAddItem = () => {
    const newItem: QuoteItem = {
      id: `custom-${Date.now()}`,
      name: 'New Item',
      description: 'Tap to edit',
      quantity: 1,
      unit: 'unit',
      unitPrice: 0,
      total: 0,
      category: 'materials',
    };
    setItems([...items, newItem]);
    setEditingItem(newItem.id);
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert('Delete Item', 'Are you sure you want to remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setItems(items.filter(item => item.id !== itemId)),
      },
    ]);
  };

  const handleGeneratePDF = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const totals = calculateTotals();
    const updatedAnalysis = {
      ...analysis,
      costBreakdown: {
        ...analysis.costBreakdown,
        materials: {
          min: items.filter(i => i.category === 'materials').reduce((sum, i) => sum + i.total, 0),
          max: items.filter(i => i.category === 'materials').reduce((sum, i) => sum + i.total, 0),
        },
        labor: {
          min: items.filter(i => i.category === 'labor').reduce((sum, i) => sum + i.total, 0),
          max: items.filter(i => i.category === 'labor').reduce((sum, i) => sum + i.total, 0),
        },
        total: {
          min: totals.total,
          max: totals.total,
        },
      },
      timeline: {
        professional: timeline,
        diy: timeline,
      },
      notes: notes,
      items: items,
    };

    onGeneratePDF(updatedAnalysis);
  };

  const totals = calculateTotals();

  return (
    <View style={styles.containerWrapper}>
      {/* Scroll Instructions */}
      <View style={styles.scrollInstructions}>
        <View style={styles.instructionRow}>
          <Ionicons name="resize" size={16} color={designTokens.colors.text.secondary} />
          <Text style={styles.instructionText}>Swipe horizontally to see all columns</Text>
        </View>
        <View style={styles.instructionRow}>
          <Ionicons name="hand-left" size={16} color={designTokens.colors.text.secondary} />
          <Text style={styles.instructionText}>Tap any cell to edit values</Text>
        </View>
      </View>

      {/* Horizontal scroll container with gradient edges */}
      <View style={styles.scrollContainer}>
        {/* Left gradient edge */}
        <View style={styles.leftGradient} pointerEvents="none" />

        <ScrollView
          style={styles.container}
          horizontal
          showsHorizontalScrollIndicator={true}
          persistentScrollbar={true}
        >
          <View style={styles.tableContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>📊 Interactive Quote</Text>
              <Text style={styles.headerSubtitle}>Edit items • Add rows • Generate PDF</Text>
            </View>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.itemNameCell]}>Item</Text>
              <Text style={[styles.tableHeaderText, styles.quantityCell]}>Qty</Text>
              <Text style={[styles.tableHeaderText, styles.unitCell]}>Unit</Text>
              <Text style={[styles.tableHeaderText, styles.priceCell]}>Price</Text>
              <Text style={[styles.tableHeaderText, styles.totalCell]}>Total</Text>
              <Text style={[styles.tableHeaderText, styles.actionCell]}></Text>
            </View>

            {/* Table Rows */}
            {items.map(item => (
              <View key={item.id} style={styles.tableRow}>
                {editingItem === item.id ? (
                  <>
                    <TextInput
                      style={[styles.tableCell, styles.itemNameCell, styles.editCell]}
                      value={item.name}
                      onChangeText={val => handleItemEdit(item.id, 'name', val)}
                      placeholder="Item name"
                    />
                    <TextInput
                      style={[styles.tableCell, styles.quantityCell, styles.editCell]}
                      value={item.quantity.toString()}
                      onChangeText={val => handleItemEdit(item.id, 'quantity', val)}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[styles.tableCell, styles.unitCell, styles.editCell]}
                      value={item.unit}
                      onChangeText={val => handleItemEdit(item.id, 'unit', val)}
                    />
                    <TextInput
                      style={[styles.tableCell, styles.priceCell, styles.editCell]}
                      value={item.unitPrice.toString()}
                      onChangeText={val => handleItemEdit(item.id, 'unitPrice', val)}
                      keyboardType="numeric"
                    />
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.tableCell, styles.itemNameCell]}
                      onPress={() => setEditingItem(item.id)}
                    >
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemDescription}>{item.description}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.tableCell, styles.quantityCell]}
                      onPress={() => setEditingItem(item.id)}
                    >
                      <Text style={styles.cellText}>{item.quantity}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.tableCell, styles.unitCell]}
                      onPress={() => setEditingItem(item.id)}
                    >
                      <Text style={styles.cellText}>{item.unit}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.tableCell, styles.priceCell]}
                      onPress={() => setEditingItem(item.id)}
                    >
                      <Text style={styles.cellText}>£{item.unitPrice.toFixed(2)}</Text>
                    </TouchableOpacity>
                  </>
                )}

                <Text style={[styles.tableCell, styles.totalCell, styles.totalText]}>
                  £{item.total.toFixed(2)}
                </Text>

                <TouchableOpacity
                  style={[styles.tableCell, styles.actionCell]}
                  onPress={() =>
                    editingItem === item.id ? setEditingItem(null) : handleDeleteItem(item.id)
                  }
                >
                  <Ionicons
                    name={editingItem === item.id ? 'checkmark' : 'trash-outline'}
                    size={18}
                    color={
                      editingItem === item.id
                        ? designTokens.colors.success
                        : designTokens.colors.error
                    }
                  />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add Item Button */}
            <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem}>
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={designTokens.colors.primary[500]}
              />
              <Text style={styles.addItemText}>Add Item</Text>
            </TouchableOpacity>

            {/* Totals Section */}
            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>£{totals.subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>VAT (20%):</Text>
                <Text style={styles.totalValue}>£{totals.vat.toFixed(2)}</Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Total:</Text>
                <Text style={styles.grandTotalValue}>£{totals.total.toFixed(2)}</Text>
              </View>
            </View>

            {/* Timeline Section */}
            <View style={styles.timelineSection}>
              <Text style={styles.sectionTitle}>Timeline</Text>
              <TextInput
                style={styles.timelineInput}
                value={timeline}
                onChangeText={setTimeline}
                placeholder="e.g., 1-2 weeks"
              />
            </View>

            {/* Notes Section */}
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>Additional Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any special requirements or notes..."
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.updateButton]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const totals = calculateTotals();
                  const updatedAnalysis = { ...analysis, items, timeline, notes, ...totals };
                  onUpdateQuote(updatedAnalysis);
                }}
              >
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Update Quote</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.generateButton]}
                onPress={handleGeneratePDF}
              >
                <Ionicons name="document-text" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Generate PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Right gradient edge */}
        <View style={styles.rightGradient} pointerEvents="none" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    marginVertical: designTokens.spacing.md,
  },
  scrollInstructions: {
    backgroundColor: designTokens.colors.grey[50],
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.lg,
    marginBottom: designTokens.spacing.sm,
    borderWidth: 1,
    borderColor: designTokens.colors.grey[200],
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: designTokens.spacing.xs / 2,
  },
  instructionText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    marginLeft: designTokens.spacing.sm,
    fontStyle: 'italic',
  },
  scrollContainer: {
    position: 'relative',
  },
  container: {
    maxHeight: 500,
  },
  leftGradient: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'transparent',
    zIndex: 1,
    shadowColor: designTokens.colors.grey[400],
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  rightGradient: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'transparent',
    zIndex: 1,
    shadowColor: designTokens.colors.grey[400],
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  tableContainer: {
    backgroundColor: designTokens.colors.background,
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.md,
    minWidth: 600,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: designTokens.spacing.lg,
  },
  headerTitle: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    marginTop: designTokens.spacing.xs,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: designTokens.colors.grey[100],
    paddingVertical: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.md,
    marginBottom: designTokens.spacing.sm,
  },
  tableHeaderText: {
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
    fontSize: designTokens.typography.fontSize.sm,
    paddingHorizontal: designTokens.spacing.sm,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.grey[200],
    paddingVertical: designTokens.spacing.sm,
    alignItems: 'center',
  },
  tableCell: {
    paddingHorizontal: designTokens.spacing.sm,
  },
  itemNameCell: {
    flex: 2,
    minWidth: 150,
  },
  quantityCell: {
    width: 60,
  },
  unitCell: {
    width: 60,
  },
  priceCell: {
    width: 80,
  },
  totalCell: {
    width: 80,
  },
  actionCell: {
    width: 40,
    alignItems: 'center',
  },
  itemName: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.primary,
  },
  itemDescription: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.secondary,
  },
  cellText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.primary,
  },
  totalText: {
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.primary[500],
  },
  editCell: {
    backgroundColor: designTokens.colors.grey[50],
    borderRadius: designTokens.borderRadius.sm,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: designTokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.grey[200],
    marginTop: designTokens.spacing.sm,
  },
  addItemText: {
    marginLeft: designTokens.spacing.sm,
    color: designTokens.colors.primary[500],
    fontWeight: designTokens.typography.fontWeight.medium as any,
  },
  totalsSection: {
    marginTop: designTokens.spacing.lg,
    paddingTop: designTokens.spacing.lg,
    borderTopWidth: 2,
    borderTopColor: designTokens.colors.grey[300],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: designTokens.spacing.xs,
  },
  totalLabel: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
  },
  totalValue: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.primary,
  },
  grandTotalRow: {
    marginTop: designTokens.spacing.sm,
    paddingTop: designTokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.grey[300],
  },
  grandTotalLabel: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.text.primary,
  },
  grandTotalValue: {
    fontSize: designTokens.typography.fontSize.xl,
    fontWeight: designTokens.typography.fontWeight.bold as any,
    color: designTokens.colors.primary[500],
  },
  timelineSection: {
    marginTop: designTokens.spacing.lg,
  },
  sectionTitle: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.sm,
  },
  timelineInput: {
    borderWidth: 1,
    borderColor: designTokens.colors.grey[300],
    borderRadius: designTokens.borderRadius.md,
    padding: designTokens.spacing.md,
    fontSize: designTokens.typography.fontSize.base,
  },
  notesSection: {
    marginTop: designTokens.spacing.lg,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: designTokens.colors.grey[300],
    borderRadius: designTokens.borderRadius.md,
    padding: designTokens.spacing.md,
    fontSize: designTokens.typography.fontSize.base,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: designTokens.spacing.xl,
    gap: designTokens.spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg,
    gap: designTokens.spacing.sm,
  },
  updateButton: {
    backgroundColor: designTokens.colors.grey[600],
  },
  generateButton: {
    backgroundColor: designTokens.colors.primary[500],
  },
  actionButtonText: {
    color: '#fff',
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
  },
});
