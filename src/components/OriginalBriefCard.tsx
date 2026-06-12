import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import designTokens from '../styles/designTokens';
import Card from './ui/Card';

/**
 * Read-only "Original brief" view for a generated/completed quote.
 *
 * Surfaces the assessment the user originally submitted (notes, selected work,
 * property details, photos, voice) so they can look back on a finished quote and
 * see WHY it came out the way it did. Strictly view-only — no inputs, no save,
 * no resubmit. All data is read from the already-stored siteNotes; this component
 * adds no business logic and persists nothing.
 */

interface SiteNotesLike {
  notes?: string;
  tasks?: string[];
  propertyType?: string;
  size?: string;
  specLevel?: string;
  constructionMethodLabel?: string;
  constructionMethod?: string;
  numberOfRooms?: string;
  numberOfFloors?: string;
  photos?: string[];
  voiceNotes?: string;
  voiceRecordings?: unknown[];
}

interface Props {
  siteNotes: SiteNotesLike;
  /** Collapsed by default so it doesn't crowd the line-item view. */
  defaultExpanded?: boolean;
}

const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export default function OriginalBriefCard({ siteNotes, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Split the notes blob into discrete lines so we can render them as bullets.
  // Today notes is a single string (typed notes + voice transcript joined by
  // newlines); this also makes the display ready for the future notes-array work.
  const noteLines = (siteNotes.notes || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const selectedTasks = (siteNotes.tasks || []).filter(Boolean);

  // Structured property details, only those actually provided.
  const details: { label: string; value: string }[] = [];
  if (siteNotes.propertyType) details.push({ label: 'Property', value: siteNotes.propertyType });
  if (siteNotes.size) details.push({ label: 'Size', value: siteNotes.size });
  if (siteNotes.specLevel)
    details.push({ label: 'Finish level', value: capitalise(siteNotes.specLevel) });
  if (siteNotes.constructionMethodLabel || siteNotes.constructionMethod)
    details.push({
      label: 'Construction',
      value: siteNotes.constructionMethodLabel || siteNotes.constructionMethod || '',
    });
  if (siteNotes.numberOfRooms) details.push({ label: 'Rooms', value: siteNotes.numberOfRooms });
  if (siteNotes.numberOfFloors) details.push({ label: 'Floors', value: siteNotes.numberOfFloors });

  const photos = (siteNotes.photos || []).filter(Boolean);
  const hasVoice =
    Boolean(siteNotes.voiceNotes && siteNotes.voiceNotes.trim()) ||
    (Array.isArray(siteNotes.voiceRecordings) && siteNotes.voiceRecordings.length > 0);

  const hasAnything =
    noteLines.length > 0 ||
    selectedTasks.length > 0 ||
    details.length > 0 ||
    photos.length > 0 ||
    hasVoice;

  // Nothing was captured beyond address/job type (already shown elsewhere) — hide
  // the section entirely rather than show an empty card.
  if (!hasAnything) return null;

  return (
    <Card variant="outlined" style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(prev => !prev)}
        accessibilityRole="button"
        accessibilityLabel="Original brief"
        accessibilityState={{ expanded }}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name="document-text-outline"
            size={20}
            color={designTokens.colors.text.secondary}
          />
          <Text style={styles.headerTitle}>Original brief</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={designTokens.colors.text.tertiary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {noteLines.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Your notes</Text>
              {noteLines.map((line, index) => (
                <View key={index} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{line}</Text>
                </View>
              ))}
            </View>
          )}

          {selectedTasks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Selected work</Text>
              {selectedTasks.map((task, index) => (
                <View key={index} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{task}</Text>
                </View>
              ))}
            </View>
          )}

          {details.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Property details</Text>
              {details.map(detail => (
                <View key={detail.label} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{detail.label}</Text>
                  <Text style={styles.detailValue}>{detail.value}</Text>
                </View>
              ))}
            </View>
          )}

          {photos.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Photos ({photos.length})</Text>
              <View style={styles.photoRow}>
                {photos.map((uri, index) => (
                  <Image key={index} source={{ uri }} style={styles.photo} />
                ))}
              </View>
            </View>
          )}

          {hasVoice && (
            <View style={styles.voiceRow}>
              <Ionicons name="mic-outline" size={16} color={designTokens.colors.text.tertiary} />
              <Text style={styles.voiceText}>Voice notes were included with this assessment</Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    // Align width with the summary card above (which is inset 16px) instead of
    // being full-bleed to the screen edges.
    marginHorizontal: designTokens.spacing.md,
    marginTop: designTokens.spacing.md,
    // Match the gap above this card (summary card's marginBottom 16 + this card's
    // marginTop 16 = 32) so it sits symmetrically between the summary and the
    // "Tasks & Costs" heading, rather than crowding the heading.
    marginBottom: designTokens.spacing.xl,
    padding: designTokens.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.text.primary,
    marginLeft: designTokens.spacing.sm,
  },
  body: {
    marginTop: designTokens.spacing.md,
  },
  section: {
    marginBottom: designTokens.spacing.md,
  },
  sectionLabel: {
    fontSize: designTokens.typography.fontSize.xs,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: designTokens.spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: designTokens.spacing.xs,
  },
  bullet: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    marginRight: designTokens.spacing.sm,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: designTokens.spacing.xs,
  },
  detailLabel: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.tertiary,
  },
  detailValue: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.primary,
    fontWeight: designTokens.typography.fontWeight.medium,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: designTokens.spacing.md,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: designTokens.borderRadius.md,
    marginRight: designTokens.spacing.sm,
    marginBottom: designTokens.spacing.sm,
    backgroundColor: designTokens.colors.background.secondary,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.tertiary,
    marginLeft: designTokens.spacing.sm,
  },
});
