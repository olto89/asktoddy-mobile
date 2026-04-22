// AskToddy Mobile Icon Registry
// Centralized icon constants for consistent Ionicon usage across the app
// Uses Ionicons outline variants for a professional stencil-style appearance

import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

// Standard icon size presets
export const IconSize = {
  inline: 16,
  small: 20,
  medium: 24,
  large: 32,
  xlarge: 48,
} as const;

// Semantic icon name mappings
export const AppIcons = {
  // Branding
  brand: 'construct-outline' as IoniconName,

  // Site Assessment sections
  siteAssessment: 'clipboard-outline' as IoniconName,
  propertyAddress: 'location-outline' as IoniconName,
  jobType: 'clipboard-outline' as IoniconName,
  constructionMethod: 'build-outline' as IoniconName,
  quickDetails: 'home-outline' as IoniconName,
  whatNeedsDoing: 'hammer-outline' as IoniconName,
  additionalNotes: 'create-outline' as IoniconName,
  sitePhotos: 'camera-outline' as IoniconName,

  // Results & Quote sections
  costEstimate: 'cash-outline' as IoniconName,
  timeline: 'time-outline' as IoniconName,
  toolsRequired: 'construct-outline' as IoniconName,
  recommendations: 'bulb-outline' as IoniconName,
  professionalRequired: 'warning-outline' as IoniconName,
  analysisFailed: 'warning-outline' as IoniconName,

  // Task processing
  analyzing: 'sparkles' as IoniconName,
  extractingTasks: 'flash-outline' as IoniconName,
  calculatingCosts: 'cash-outline' as IoniconName,
  buildingQuote: 'clipboard-outline' as IoniconName,
  quoteGenerated: 'sparkles' as IoniconName,

  // Home features
  chatAndQuote: 'chatbubble-outline' as IoniconName,
  detailedAnalysis: 'clipboard-outline' as IoniconName,
  smartRecommendations: 'build-outline' as IoniconName,
  customPricing: 'bulb-outline' as IoniconName,

  // Pricing
  plans: 'construct-outline' as IoniconName,
  whyUpgrade: 'cash-outline' as IoniconName,

  // Share & Edit
  shareQuote: 'share-outline' as IoniconName,
  editQuote: 'create-outline' as IoniconName,
  interactiveQuote: 'stats-chart-outline' as IoniconName,

  // Camera
  cameraAccess: 'camera-outline' as IoniconName,
  cameraInstruction: 'camera-outline' as IoniconName,
  gallery: 'images-outline' as IoniconName,
  flipCamera: 'camera-reverse-outline' as IoniconName,
  tip: 'bulb-outline' as IoniconName,

  // Auth & Verification
  emailVerification: 'mail-outline' as IoniconName,
  verificationSuccess: 'checkmark-circle' as IoniconName,
  celebration: 'ribbon-outline' as IoniconName,
  nextSteps: 'mail-outline' as IoniconName,
  freeIncludes: 'sparkles' as IoniconName,

  // Upgrade modal
  quotaExceeded: 'stats-chart-outline' as IoniconName,
  premiumFeature: 'sparkles' as IoniconName,
  upgradeGeneral: 'rocket-outline' as IoniconName,
  roi: 'cash-outline' as IoniconName,

  // Confidence guide
  confidenceExcellent: 'ribbon-outline' as IoniconName,
  confidenceGood: 'thumbs-up-outline' as IoniconName,
  confidenceImprove: 'create-outline' as IoniconName,

  // Company branding
  companyBranding: 'business-outline' as IoniconName,
  companyLogo: 'image-outline' as IoniconName,

  // Navigation & status
  savedForLater: 'phone-portrait-outline' as IoniconName,
  needsConnection: 'cloud-offline-outline' as IoniconName,
  pendingGeneration: 'hourglass-outline' as IoniconName,
  anonymousAvatar: 'rocket-outline' as IoniconName,
  quoteComplete: 'checkmark-circle-outline' as IoniconName,
} as const;

export default AppIcons;
