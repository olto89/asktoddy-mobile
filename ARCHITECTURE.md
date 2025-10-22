# AskToddy Mobile - Architecture Guide

## 🏗️ Architecture Principles

### 1. **API-First Design**

- All business logic in Supabase Edge Functions
- Mobile app is a lightweight client
- Clear separation of concerns

### 2. **Domain-Driven Structure**

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen-level components
├── navigation/     # Navigation logic
├── services/       # External integrations
├── hooks/          # Reusable business logic
├── contexts/       # Global state management
├── styles/         # Design tokens and themes
└── config/         # App configuration
```

### 3. **Service Layer Pattern**

```
services/
├── ai/            # AI processing (Edge Function client)
├── supabase.ts    # Database client
├── location/      # GPS and location services
└── pricing/       # UK pricing data
```

## 🧹 Code Quality Standards

### File Organization Rules

1. **Maximum File Size**: 300 lines
2. **Maximum Function Length**: 50 lines
3. **Complexity Limit**: 10 (cyclomatic complexity)

### Naming Conventions

```typescript
// Components: PascalCase
export const CameraScreen = () => {};

// Hooks: camelCase starting with 'use'
export const useImageAnalysis = () => {};

// Services: PascalCase classes, camelCase functions
export class AIService {}
export const analyzeImage = () => {};

// Constants: SCREAMING_SNAKE_CASE
export const API_ENDPOINTS = {};

// Files: kebab-case
// camera-screen.tsx, use-image-analysis.ts
```

### Import Organization

```typescript
// 1. React/React Native
import React from 'react';
import { View, Text } from 'react-native';

// 2. Third-party libraries
import { Camera } from 'expo-camera';

// 3. Internal services
import { AIService } from '../services/ai';

// 4. Internal components
import { Button } from '../components/ui/Button';

// 5. Types
import type { AnalysisRequest } from '../types';
```

## 🔄 Development Workflow

### 1. **Before Starting Work**

```bash
npm run session:start    # Updates context and docs
git pull origin main     # Get latest changes
```

### 2. **During Development**

- Code is auto-formatted on save (Prettier)
- ESLint warnings appear in editor
- Pre-commit hooks enforce quality

### 3. **Before Committing**

```bash
npm run quality         # Type check + lint + format check
npm run test           # Run tests (when available)
npm run context:save   # Save session context
```

### 4. **Commit Process**

- Pre-commit hooks run automatically
- Code is auto-formatted and linted
- TypeScript compilation checked

## 📱 Component Architecture

### Screen Structure

```typescript
// screens/camera-screen.tsx
import React from 'react';
import { useCamera } from '../hooks/useCamera';
import { CameraView } from '../components/CameraView';

export const CameraScreen = () => {
  const { camera, takePhoto, isLoading } = useCamera();

  return (
    <CameraView
      ref={camera}
      onTakePhoto={takePhoto}
      loading={isLoading}
    />
  );
};
```

### Hook Pattern

```typescript
// hooks/use-camera.ts
import { useRef, useState } from 'react';
import { Camera } from 'expo-camera';

export const useCamera = () => {
  const cameraRef = useRef<Camera>(null);
  const [isLoading, setIsLoading] = useState(false);

  const takePhoto = async () => {
    // Business logic here
  };

  return { camera: cameraRef, takePhoto, isLoading };
};
```

### Service Pattern

```typescript
// services/ai/ai-service-edge.ts
class AIServiceEdge {
  private baseUrl: string;

  async analyzeImage(request: AnalysisRequest): Promise<ProjectAnalysis> {
    // HTTP client logic
  }
}

export const AIService = new AIServiceEdge();
```

## 🔒 Security Guidelines

### 1. **API Keys**

- ❌ Never in client code
- ✅ Always in Supabase Edge Function secrets

### 2. **Environment Variables**

```typescript
// ❌ Don't expose secrets
EXPO_PUBLIC_SECRET_KEY=abc123

// ✅ Only expose public config
EXPO_PUBLIC_SUPABASE_URL=https://...
EXPO_PUBLIC_APP_ENV=staging
```

### 3. **Data Validation**

```typescript
// Always validate API responses
const response = await fetch(endpoint);
if (!response.ok) {
  throw new Error(`API error: ${response.status}`);
}
const data = await response.json();
// Validate data structure before using
```

## 📊 Performance Guidelines

### 1. **Bundle Size**

- Prefer Edge Functions over heavy client libraries
- Use dynamic imports for large components
- Monitor bundle size in builds

### 2. **Memory Management**

- Clean up camera resources
- Unsubscribe from listeners in useEffect cleanup
- Avoid memory leaks in navigation

### 3. **Network Efficiency**

- Batch API calls when possible
- Implement proper loading states
- Handle offline scenarios

## 🧪 Testing Strategy

### 1. **Unit Tests**

```typescript
// hooks/__tests__/use-camera.test.ts
import { renderHook } from '@testing-library/react-hooks';
import { useCamera } from '../use-camera';

describe('useCamera', () => {
  it('should initialize camera correctly', () => {
    const { result } = renderHook(() => useCamera());
    expect(result.current.isLoading).toBe(false);
  });
});
```

### 2. **Integration Tests**

- Test Edge Function endpoints
- Test navigation flows
- Test API error handling

## 🚀 Deployment Standards

### 1. **Environment Management**

```bash
npm run env:use staging     # Switch environments
npm run deploy:staging      # Deploy Edge Functions
npm run build:staging       # Build mobile app
```

### 2. **Quality Gates**

- All TypeScript errors resolved
- All ESLint rules passing
- All tests passing
- Bundle size within limits

### 3. **Documentation**

- Architecture decisions recorded
- API changes documented
- Breaking changes highlighted

## 📋 Code Review Checklist

### Functionality

- [ ] Code works as expected
- [ ] Handles error cases gracefully
- [ ] Follows existing patterns

### Quality

- [ ] No TypeScript errors
- [ ] ESLint rules satisfied
- [ ] Code is readable and maintainable
- [ ] Proper error handling

### Architecture

- [ ] Follows domain structure
- [ ] Services properly separated
- [ ] No business logic in components
- [ ] Proper abstraction levels

### Performance

- [ ] No unnecessary re-renders
- [ ] Efficient data fetching
- [ ] Proper resource cleanup
- [ ] Bundle size impact considered

---

_This document is updated automatically. Last updated: 2025-10-21_
