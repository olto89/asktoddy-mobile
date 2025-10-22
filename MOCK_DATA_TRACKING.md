# Mock Data and Hardcoded Values Tracking

This document tracks all mocked, hardcoded, and placeholder data that needs to be replaced with real implementations for production.

## 🔧 Development Mock Responses

### ChatScreen.tsx (Lines 110-136, 266-274)

**Location**: `src/screens/ChatScreen.tsx`
**Type**: Mock AI Analysis Response
**Status**: ⚠️ DEVELOPMENT ONLY

```typescript
// Mock response for development
if (isDevelopment) {
  analysis = {
    projectType: detectProjectType(userMessage.content),
    description: `I can help you with your ${detectProjectType(userMessage.content).toLowerCase()} project!`,
    costBreakdown: {
      materials: { min: 1500, max: 3500 }, // HARDCODED COSTS
      labor: { min: 2000, max: 4500 }, // HARDCODED COSTS
      total: { min: 3500, max: 8000 }, // HARDCODED COSTS
    },
    timeline: {
      diy: '2-3 weeks', // HARDCODED TIMELINE
      professional: '1-2 weeks', // HARDCODED TIMELINE
    },
    recommendations: [
      // HARDCODED RECOMMENDATIONS
      'Get multiple quotes from local contractors',
      'Consider seasonal pricing variations',
      'Check building regulations in your area',
    ],
    requiresProfessional: true, // HARDCODED
    professionalReasons: ['Safety requirements', 'Building regulations'], // HARDCODED
    confidence: 85, // HARDCODED
    aiProvider: 'development-mock', // HARDCODED
  };
}
```

**Production Replacement**: Replace with real Supabase Edge Function call to `analyze-construction`

### Document Generation Mock (Lines 266-274)

**Location**: `src/screens/ChatScreen.tsx`
**Type**: Mock Document Generation
**Status**: ⚠️ DEVELOPMENT ONLY

```typescript
if (isDevelopment) {
  // Mock document generation
  Alert.alert(
    'Success (Development)',
    `Your ${type} would be generated in production. Download link would be sent to your email.`
  );
}
```

**Production Replacement**: Replace with real `generate-document` Edge Function call

## 🔗 Hardcoded URLs and Endpoints

### Supabase Configuration

**Location**: `src/services/supabase.ts`
**Type**: Environment-based but hardcoded redirect
**Status**: ⚠️ NEEDS REVIEW

```typescript
emailRedirectTo: 'asktoddy://auth/callback',  // HARDCODED DEEP LINK
```

**Production Consideration**: Verify this URL scheme works in production app stores

### Default Context Values

**Location**: `src/screens/ChatScreen.tsx` (Lines 143-147)
**Type**: Hardcoded user context
**Status**: ⚠️ NEEDS USER SETTINGS

```typescript
context: {
  location: 'London',                    // HARDCODED LOCATION
  projectType: detectProjectType(userMessage.content),
  preferredProvider: 'auto',             // HARDCODED PROVIDER
}
```

**Production Replacement**:

- Get location from user profile/GPS
- Get preferred provider from user settings
- Project type detection is fine (algorithm-based)

## 📊 Hardcoded Data in Edge Functions

### UK Pricing Data

**Location**: `supabase/functions/get-pricing/data/uk-pricing-data.ts`
**Type**: Static market data
**Status**: ⚠️ STATIC DATA - NEEDS API INTEGRATION

```typescript
export const UK_REGIONS: RegionData[] = [
  { name: 'London', multiplier: 1.35, averageDeliveryCharge: 85 }, // HARDCODED
  { name: 'South East', multiplier: 1.25, averageDeliveryCharge: 75 }, // HARDCODED
  // ... more hardcoded regional data
];

export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  {
    category: 'Timber',
    averagePricePerUnit: 45, // HARDCODED PRICE
    unit: 'cubic metre',
    // ... more hardcoded pricing
  },
];
```

**Production Replacement**:

- Integrate with real supplier APIs
- Implement live pricing feeds
- Add price update mechanisms

### AI Provider Configuration

**Location**: `supabase/functions/analyze-construction/middleware.ts`
**Type**: Hardcoded provider settings
**Status**: ⚠️ HARDCODED ENDPOINTS

```typescript
private selectOptimalProvider(request: AnalysisRequest): string {
  // Hardcoded provider selection logic
  if (request.imageUri && !request.message) {
    return 'gemini'; // HARDCODED - Gemini for image-only
  }
  return 'gemini';   // HARDCODED - Default to Gemini
}
```

**Production Replacement**: Make this configurable based on:

- User preferences
- Provider availability
- Cost optimization
- Response quality metrics

## 🏠 Hardcoded Project Types

### Project Type Detection

**Location**: `src/screens/ChatScreen.tsx` (Lines 201-211)
**Type**: Simple keyword matching
**Status**: ⚠️ BASIC ALGORITHM

```typescript
const detectProjectType = (message: string): string => {
  const lower = message.toLowerCase();
  if (lower.includes('kitchen')) return 'Kitchen Renovation'; // HARDCODED
  if (lower.includes('bathroom')) return 'Bathroom Renovation'; // HARDCODED
  if (lower.includes('extension')) return 'Home Extension'; // HARDCODED
  // ... more hardcoded project types
  return 'General Construction'; // HARDCODED DEFAULT
};
```

**Production Replacement**:

- Use NLP/ML for better project classification
- Integrate with actual AI analysis
- Add more sophisticated project categories

## 🎨 Hardcoded UI Content

### Welcome Message

**Location**: `src/screens/ChatScreen.tsx` (Lines 42-47)
**Type**: Static welcome message
**Status**: ✅ OK - CAN STAY

```typescript
{
  id: '1',
  role: 'assistant',
  content: "Hi! I'm Toddy, your construction assistant...", // HARDCODED MESSAGE
  timestamp: new Date().toISOString(),
}
```

**Production Status**: This is fine to keep hardcoded as a welcome message

### Error Messages

**Location**: Various locations
**Type**: Static error messages
**Status**: ✅ OK - BUT SHOULD BE LOCALIZED

Example:

```typescript
Alert.alert('Error', 'Failed to generate document. Please try again.'); // HARDCODED
```

**Production Consideration**: Add internationalization/localization

## 🏗️ Authentication Hardcoded Values

### User Metadata

**Location**: `src/services/supabase.ts` (Lines 30-33)
**Type**: Default user metadata
**Status**: ⚠️ HARDCODED DEFAULTS

```typescript
data: {
  subscription_tier: 'free',           // HARDCODED DEFAULT TIER
  created_via: 'mobile_app',          // HARDCODED SOURCE
}
```

**Production Replacement**:

- Make subscription tier dynamic
- Add proper onboarding flow
- Collect user preferences

## 📍 Location Hardcoded Values

### Default Location

**Location**: Multiple files
**Type**: UK-centric defaults
**Status**: ⚠️ GEOGRAPHIC ASSUMPTION

```typescript
location: 'London',                    // HARDCODED in ChatScreen
location: 'UK',                       // HARDCODED in CameraScreen
```

**Production Replacement**:

- Implement GPS-based location detection
- Add location selection UI
- Support multiple countries

## 🔄 Production Replacement Checklist

### High Priority (Breaks Core Functionality)

- [ ] Replace ChatScreen mock responses with real Edge Function calls
- [ ] Replace document generation mocks with real PDF generation
- [ ] Implement real location detection instead of hardcoded 'London'
- [ ] Add user settings for AI provider preference

### Medium Priority (Improves Quality)

- [ ] Replace static UK pricing data with live API feeds
- [ ] Improve project type detection with ML/NLP
- [ ] Add supplier API integrations for real-time pricing
- [ ] Implement proper user onboarding flow

### Low Priority (Polish)

- [ ] Add internationalization for error messages
- [ ] Make subscription tiers dynamic
- [ ] Add more sophisticated provider selection logic
- [ ] Implement usage analytics and optimization

## 🔧 Environment Detection Pattern

We use this pattern throughout the codebase to enable mocks in development:

```typescript
const isDevelopment = __DEV__ || process.env.EXPO_PUBLIC_APP_ENV === 'development';

if (isDevelopment) {
  // Mock/development code
} else {
  // Production code
}
```

This ensures mocks only run in development and can be easily identified and replaced.

## 📝 Notes for Production Migration

1. **Search for "HARDCODED"** comments in the codebase to find values that need replacement
2. **Look for "development-mock"** or "isDevelopment"\*\* to find mock code paths
3. **Check .env** files for hardcoded environment values
4. **Review Edge Functions** for static data that should be dynamic
5. **Test with real APIs** before removing development mocks

---

**Last Updated**: 2025-10-15  
**Status**: Active Development - Multiple Mock Systems in Place
