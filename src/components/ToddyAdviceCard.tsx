import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import designTokens from '../styles/designTokens';
import Card from './ui/Card';
import Button from './ui/Button';
import {
  toddyAdviceService,
  ToddyAdvice,
  ToddyAdviceContext,
} from '../services/ai/ToddyAdviceService';

// Enable layout animations on Android (no-op on the new arch / iOS).
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Status = 'idle' | 'loading' | 'loaded' | 'error';

interface Props {
  context: ToddyAdviceContext;
  /** Advice already cached on the quote (re-opened saved quote) — shown without re-fetching. */
  initialAdvice?: ToddyAdvice | null;
  /** Called once when fresh advice is generated, so the caller can persist it. */
  onAdviceGenerated?: (advice: ToddyAdvice) => void;
  /** Injectable for tests; defaults to the real service. */
  fetchAdvice?: (context: ToddyAdviceContext) => Promise<ToddyAdvice>;
}

const formatGBP = (n: number) => `£${Math.round(n).toLocaleString('en-GB')}`;

export default function ToddyAdviceCard({
  context,
  initialAdvice = null,
  onAdviceGenerated,
  fetchAdvice = toddyAdviceService.getAdvice.bind(toddyAdviceService),
}: Props) {
  const [advice, setAdvice] = useState<ToddyAdvice | null>(initialAdvice);
  const [status, setStatus] = useState<Status>(initialAdvice ? 'loaded' : 'idle');
  const [errorMessage, setErrorMessage] = useState('');
  // Cached advice starts collapsed (available but not crowding the quote);
  // freshly generated advice opens itself.
  const [expanded, setExpanded] = useState(false);

  const animate = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  const handleGenerate = async () => {
    animate();
    setStatus('loading');
    setErrorMessage('');
    try {
      const result = await fetchAdvice(context);
      animate();
      setAdvice(result);
      setStatus('loaded');
      setExpanded(true);
      onAdviceGenerated?.(result);
    } catch (error) {
      animate();
      setStatus('error');
      setErrorMessage((error as Error)?.message || "Couldn't load advice. Please try again.");
    }
  };

  const toggleExpanded = () => {
    animate();
    setExpanded(prev => !prev);
  };

  const hasAdvice = status === 'loaded' && advice;

  return (
    <Card variant="outlined" style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={hasAdvice ? toggleExpanded : undefined}
        activeOpacity={hasAdvice ? 0.7 : 1}
        disabled={!hasAdvice}
        accessibilityRole="button"
        accessibilityLabel="Toddy's advice"
        accessibilityState={{ expanded: hasAdvice ? expanded : undefined }}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={18} color={designTokens.colors.primary[500]} />
          <Text style={styles.headerTitle}>Toddy&apos;s advice</Text>
        </View>
        {hasAdvice && (
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={designTokens.colors.text.tertiary}
          />
        )}
      </TouchableOpacity>

      {/* Idle — the call to action */}
      {status === 'idle' && (
        <View style={styles.body}>
          <Text style={styles.prompt}>
            Get a suggested winning price range and a few tips to protect your margin.
          </Text>
          <Button
            title="Get Toddy's advice"
            onPress={handleGenerate}
            variant="primary"
            size="md"
            style={styles.cta}
            icon={
              <Ionicons name="sparkles-outline" size={16} color="white" style={styles.ctaIcon} />
            }
          />
        </View>
      )}

      {/* Loading — keep the label visible alongside the spinner */}
      {status === 'loading' && (
        <View style={[styles.body, styles.loadingRow]}>
          <ActivityIndicator size="small" color={designTokens.colors.primary[500]} />
          <Text style={styles.loadingText}>Toddy&apos;s thinking…</Text>
        </View>
      )}

      {/* Error — non-destructive; quote is untouched */}
      {status === 'error' && (
        <View style={styles.body}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Button
            title="Try again"
            onPress={handleGenerate}
            variant="outline"
            size="md"
            style={styles.cta}
          />
        </View>
      )}

      {/* Loaded — Toddy's framed advice, collapsible */}
      {hasAdvice && expanded && (
        <View style={styles.body}>
          <Text style={styles.lead}>
            Based on what you&apos;ve shared, I&apos;d estimate the winning range for this job is{' '}
            <Text style={styles.range}>
              {formatGBP(advice!.winRange.min)}–{formatGBP(advice!.winRange.max)}
            </Text>
            {advice!.rationale ? ` — ${advice!.rationale}.` : '.'}
          </Text>

          {advice!.tips.length > 0 && (
            <View style={styles.tipsSection}>
              <Text style={styles.tipsHeading}>A few ways to protect your margin:</Text>
              {advice!.tips.map((tip, index) => (
                <View key={index} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.footnote}>Guidance only — your quote total is unchanged.</Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    // Align with the summary / original-brief cards above.
    marginHorizontal: designTokens.spacing.md,
    marginTop: designTokens.spacing.md,
    marginBottom: designTokens.spacing.md,
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
  prompt: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    lineHeight: 20,
    marginBottom: designTokens.spacing.md,
  },
  cta: {
    alignSelf: 'flex-start',
  },
  ctaIcon: {
    marginRight: 6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    marginLeft: designTokens.spacing.sm,
  },
  errorText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    lineHeight: 20,
    marginBottom: designTokens.spacing.md,
  },
  lead: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    lineHeight: 24,
  },
  range: {
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.text.primary,
  },
  tipsSection: {
    marginTop: designTokens.spacing.md,
  },
  tipsHeading: {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.text.primary,
    marginBottom: designTokens.spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: designTokens.spacing.sm,
  },
  bullet: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.primary[500],
    marginRight: designTokens.spacing.sm,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.secondary,
    lineHeight: 22,
  },
  footnote: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: designTokens.spacing.md,
  },
});
