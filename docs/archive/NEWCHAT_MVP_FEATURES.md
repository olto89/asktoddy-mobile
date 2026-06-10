# NewChatScreen MVP Features List

## AskToddy Mobile - Construction Quote Chat Interface

### ✅ Completed Features

1. **Quote Preview Card** - Real-time quote display at top of screen
2. **Chat Messaging** - Basic text input and response display
3. **Session Management** - Create new quotes, switch between sessions
4. **Chat History Sidebar** - View and switch between previous quotes
5. **Quote Analysis** - Basic construction project analysis via Gemini AI
6. **Scrollable UI** - Separate scrolling for quote preview and chat messages

### 🔧 Issues to Fix

1. **Quote Clearing Bug** - Quote section doesn't clear when creating new quote
2. **Keyboard Handling** - Input field not rising with keyboard (Expo Go issue, test in TestFlight)

### 📋 MVP Features Needed

#### Critical Features (P0)

1. **Image Upload**
   - Camera capture for construction photos
   - Photo library selection
   - Multiple image support
   - Image preview in chat

2. **PDF Upload**
   - Document picker integration
   - PDF preview/thumbnail in chat
   - Support for plans/specifications upload

3. **Location Settings**
   - Get user location for accurate material pricing
   - Manual location override option
   - Display current location in UI
   - Pass to analysis for regional pricing

4. **Voice Input**
   - Microphone button on input field
   - Speech-to-text conversion
   - Visual feedback during recording

#### Revenue Features (P1)

5. **PDF Generation** (Premium Feature)
   - Generate professional quote PDF
   - Add company logo upload
   - Custom branding options
   - Email/share functionality
   - **Paywall Flag**: `requiresPremium: true`

6. **Premium Feature System**
   - Feature flags for paid features
   - Paywall UI component
   - Subscription check integration
   - Graceful degradation for free users

### 🏗️ Implementation Priority

1. Fix quote clearing bug (immediate)
2. Add image upload (core functionality)
3. Add location settings (pricing accuracy)
4. Add voice input (accessibility)
5. Add PDF upload (professional users)
6. Add PDF generation with paywall (revenue)

### 💾 Technical Requirements

- All features must work in both Expo Go (development) and TestFlight (production)
- Maintain session context across all interactions
- Ensure proper error handling and user feedback
- Follow AskToddy design system

### 📱 Platform Considerations

- iOS primary target (iPhone X and newer)
- Android support planned but not priority
- Responsive design for various screen sizes
- Accessibility compliance (voice input helps)

### 🔐 Security & Privacy

- Secure file uploads through Supabase
- Location permission handling
- Audio permission for voice input
- Data encryption for sensitive quotes
- GDPR compliance for EU users

### 📊 Success Metrics

- Quote accuracy improvement with images
- User engagement (voice vs text input)
- Premium conversion rate (PDF generation)
- Session completion rate
- Error rate reduction

### 🚀 Launch Readiness Checklist

- [ ] All P0 features implemented
- [ ] Paywall system tested
- [ ] Location services verified
- [ ] Voice input working on all devices
- [ ] PDF generation quality assured
- [ ] TestFlight beta feedback incorporated
- [ ] App Store submission ready

---

_Last Updated: 2025-11-28_
_Version: 1.0.0_
