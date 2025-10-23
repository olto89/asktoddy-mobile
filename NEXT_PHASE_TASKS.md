# AskToddy Mobile - Next Phase Task List

_Created: October 23, 2025_

## 🎯 Development Priorities

### Phase 1: Core Functionality (Week 1)

**Goal**: Complete the basic user journey from photo to quote

#### 1.1 Results Screen Implementation

- [ ] Create ResultsScreen component with proper data display
- [ ] Format cost breakdown (materials, labor, total)
- [ ] Display timeline with phases
- [ ] Show tool requirements with rental prices
- [ ] Add confidence indicator
- [ ] Include safety considerations and warnings

#### 1.2 Chat Integration

- [ ] Implement ChatScreen for follow-up questions
- [ ] Connect to Gemini chat endpoint
- [ ] Add message history display
- [ ] Enable image attachments in chat
- [ ] Implement typing indicators

#### 1.3 Data Persistence

- [ ] Save analysis results to Supabase
- [ ] Create user projects table
- [ ] Implement project retrieval
- [ ] Add offline caching with AsyncStorage
- [ ] Enable draft saving

---

### Phase 2: User Experience (Week 2)

**Goal**: Polish the app for better usability

#### 2.1 Navigation & Flow

- [ ] Add tab navigation for main sections
- [ ] Create project dashboard/history
- [ ] Implement proper back navigation
- [ ] Add breadcrumbs for complex flows
- [ ] Create quick actions menu

#### 2.2 Onboarding

- [ ] Design welcome screens
- [ ] Create feature highlights
- [ ] Add permission request flow
- [ ] Implement skip option
- [ ] Save onboarding completion state

#### 2.3 Settings & Profile

- [ ] Create SettingsScreen
- [ ] Add profile management
- [ ] Implement notification preferences
- [ ] Add measurement units toggle (metric/imperial)
- [ ] Create help/support section

---

### Phase 3: Technical Debt (Week 3)

**Goal**: Fix issues and improve code quality

#### 3.1 TypeScript Fixes

- [ ] Resolve all type errors in components
- [ ] Fix designTokens type definitions
- [ ] Add proper types for Supabase responses
- [ ] Type the navigation system properly
- [ ] Create shared type definitions file

#### 3.2 Performance

- [ ] Optimize image uploads (compression)
- [ ] Implement lazy loading for screens
- [ ] Add image caching
- [ ] Optimize bundle size
- [ ] Reduce Gemini response time

#### 3.3 Testing

- [ ] Set up Jest configuration
- [ ] Add unit tests for utilities
- [ ] Create component tests
- [ ] Add E2E tests with Detox
- [ ] Implement CI/CD pipeline

---

### Phase 4: Business Features (Week 4)

**Goal**: Add monetization and growth features

#### 4.1 Document Generation

- [ ] Integrate generate-document edge function
- [ ] Create PDF preview screen
- [ ] Add email/share functionality
- [ ] Implement quote templates
- [ ] Add company branding options

#### 4.2 Subscription System

- [ ] Design pricing tiers (Free/Pro/Business)
- [ ] Implement Stripe/RevenueCat
- [ ] Create paywall screens
- [ ] Add usage limits for free tier
- [ ] Implement receipt validation

#### 4.3 Analytics & Tracking

- [ ] Integrate Mixpanel/Amplitude
- [ ] Track user journey events
- [ ] Monitor feature usage
- [ ] Add crash reporting (Sentry)
- [ ] Implement A/B testing framework

---

## 🐛 Bug Fixes (Ongoing)

### Critical

- [ ] Fix TypeScript build errors
- [ ] Resolve ESLint configuration for CI/CD
- [ ] Fix deep linking on email verification
- [ ] Handle Gemini timeout errors gracefully

### High Priority

- [ ] Improve error messages for network failures
- [ ] Fix keyboard dismissal on login screen
- [ ] Handle expired sessions properly
- [ ] Fix image orientation issues from camera

### Medium Priority

- [ ] Add pull-to-refresh on relevant screens
- [ ] Improve loading state animations
- [ ] Fix status bar color on dark backgrounds
- [ ] Add haptic feedback for actions

---

## 🎨 UI/UX Improvements

### Visual Polish

- [ ] Implement dark mode support
- [ ] Add micro-animations
- [ ] Create custom loading indicators
- [ ] Improve empty state designs
- [ ] Add success animations

### Accessibility

- [ ] Add screen reader support
- [ ] Implement dynamic font sizing
- [ ] Add high contrast mode
- [ ] Ensure touch targets are 44pt minimum
- [ ] Add keyboard navigation support

---

## 📱 Platform Specific

### iOS Specific

- [ ] Implement App Clips for quick quotes
- [ ] Add Siri shortcuts
- [ ] Support iPad (currently disabled)
- [ ] Implement widgets
- [ ] Add Focus mode integration

### Android (Future)

- [ ] Configure Android build
- [ ] Test on various devices
- [ ] Implement Material Design
- [ ] Add Google Play integration
- [ ] Support Android tablets

---

## 🚀 Deployment & Distribution

### TestFlight

- [ ] Create external testing group
- [ ] Write TestFlight test notes
- [ ] Collect and respond to feedback
- [ ] Set up crash reporting
- [ ] Monitor usage analytics

### App Store Preparation

- [ ] Create App Store screenshots
- [ ] Write compelling description
- [ ] Design promotional graphics
- [ ] Create demo video
- [ ] Prepare press kit

---

## 📊 Success Metrics

### Technical KPIs

- App launch time < 2 seconds
- Gemini response time < 10 seconds
- Crash rate < 1%
- TypeScript coverage > 90%
- Test coverage > 70%

### Business KPIs

- User retention (Day 7) > 40%
- Analysis completion rate > 80%
- Average session length > 5 minutes
- Quote generation rate > 30%
- User satisfaction > 4.5 stars

---

## 🔄 Sprint Planning Suggestion

### Sprint 1 (Current Week)

1. Fix critical TypeScript errors
2. Implement ResultsScreen
3. Basic data persistence
4. Update documentation

### Sprint 2 (Next Week)

1. Chat functionality
2. Project dashboard
3. Onboarding flow
4. Settings screen

### Sprint 3 (Following Week)

1. Document generation
2. Performance optimization
3. Testing setup
4. UI polish

### Sprint 4 (Month End)

1. Subscription system
2. Analytics integration
3. App Store preparation
4. External beta testing

---

## 📝 Technical Debt Register

### High Priority

- TypeScript errors throughout codebase
- Missing error boundaries
- No test coverage
- ESLint configuration issues

### Medium Priority

- Inconsistent styling approach
- Missing API error handling
- No request retry logic
- Incomplete deep linking

### Low Priority

- Code comments missing
- No API documentation
- Missing Storybook setup
- No performance monitoring

---

## 🎯 Definition of Done

For each feature/fix:

- [ ] Code complete and reviewed
- [ ] TypeScript errors resolved
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Tested on physical device
- [ ] Accessibility checked
- [ ] Performance impact assessed
- [ ] Linear ticket updated

---

_This task list should be reviewed and updated weekly. Priorities may shift based on user feedback and business requirements._
