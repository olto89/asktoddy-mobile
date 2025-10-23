# 🤖 AI Conversation Logic Improvements

## 🚨 **Current Problem**

User: "I need a quote for an extension"
AI Response: Immediately provides £3,500-8,000 quote with no context

**This is unprofessional and inaccurate!**

## 🎯 **Desired Behavior**

User: "I need a quote for an extension"
AI Response: "I'd love to help with your extension! To provide an accurate quote, I'll need some details:

📐 **Size & Type:**

- What type of extension? (single-story, two-story, conservatory, etc.)
- Approximate size in square meters?
- How many rooms?

🏠 **Specifications:**

- What's your desired finish level? (basic, mid-range, high-end)
- Any specific requirements? (kitchen, bathroom, bedroom)

📋 **Additional Info:**

- Do you have photos, plans, or drawings?
- What's your rough budget expectation?
- When are you looking to start?

The more details you provide, the more accurate your quote will be!"

## 📊 **Implementation Strategy**

### **Ticket 1: Information Sufficiency Detection**

Create logic to determine if enough information is provided for accurate quoting.

**Required Information Checklist:**

- [ ] Project type (kitchen, bathroom, extension, etc.)
- [ ] Size/dimensions (sq meters, room count)
- [ ] Scope of work (full renovation, partial, new build)
- [ ] Quality level (basic, standard, premium)
- [ ] Location context (already have this)

**Information Scoring:**

- 0-1 details: Ask clarifying questions
- 2-3 details: Ask for more specifics + provide rough estimate
- 4+ details: Provide detailed quote

### **Ticket 2: Conversation Mode vs Quote Mode**

Two distinct AI response modes:

**Conversation Mode** (insufficient info):

- Ask clarifying questions
- Provide educational content
- Guide user through requirements
- No cost estimates until sufficient info

**Quote Mode** (sufficient info):

- Generate detailed cost breakdown
- Provide timeline and recommendations
- Include document generation options

### **Ticket 3: Smart Question Templates**

Create professional question templates by project type:

**Extension Questions:**

- Type: single-story, two-story, wrap-around, conservatory
- Size: dimensions, room count, total sq meters
- Use: kitchen extension, living space, bedrooms
- Finish: basic, mid-range, high-end specifications

**Kitchen Questions:**

- Size: galley, L-shaped, island, total area
- Scope: full renovation, refresh, new build
- Appliances: include/exclude, built-in, freestanding
- Finish: budget, mid-range, luxury

**Bathroom Questions:**

- Type: ensuite, family, shower room, cloakroom
- Size: small, medium, large dimensions
- Scope: complete renovation, refresh, accessibility
- Fixtures: standard, mid-range, luxury

### **Ticket 4: Progressive Information Gathering**

Multi-turn conversation flow:

**Turn 1:** Initial project type identification
**Turn 2:** Size and scope clarification
**Turn 3:** Quality and finish level
**Turn 4:** Additional requirements and constraints
**Turn 5:** Generate comprehensive quote

### **Ticket 5: Professional Caveats and Disclaimers**

Always include appropriate disclaimers:

- "Estimates based on provided information"
- "Site survey recommended for accurate pricing"
- "Prices subject to material cost fluctuations"
- "Additional costs may apply for structural work"
- "Planning permission requirements not included"

## 🛠 **Technical Implementation**

### **Prompt Engineering Strategy:**

1. **Detection Phase:** Analyze user input for information completeness
2. **Response Router:** Choose conversation mode vs quote mode
3. **Question Generator:** Select appropriate clarifying questions
4. **Context Tracker:** Maintain conversation state across messages

### **New Prompt Structure:**

```
PHASE 1: INFORMATION ASSESSMENT
Analyze the user's message and determine information completeness:
- Project type clarity (0-2 points)
- Size/scope details (0-2 points)
- Quality requirements (0-2 points)
- Specific constraints (0-2 points)

SCORING:
- 0-2 points: CONVERSATION MODE - Ask clarifying questions
- 3-5 points: ESTIMATION MODE - Provide rough estimate + ask for details
- 6+ points: QUOTE MODE - Generate detailed breakdown

RESPONSE FORMATS:
If CONVERSATION MODE: Generate helpful questions
If ESTIMATION MODE: Provide range + request specifics
If QUOTE MODE: Generate full JSON quote response
```

## 📝 **Linear Tickets to Create**

### **Epic: AI Conversation Intelligence**

**Ticket 1: Implement Information Sufficiency Detection**

- Create scoring system for information completeness
- Implement conversation vs quote mode routing
- Add context tracking across conversation

**Ticket 2: Create Professional Question Templates**

- Design question sets for each project type
- Implement progressive information gathering
- Add educational content for common scenarios

**Ticket 3: Update AI Prompts with Smart Logic**

- Rewrite Gemini provider prompts
- Add conversation mode support
- Implement response routing logic

**Ticket 4: Add Conversation State Management**

- Track information gathered across messages
- Implement context persistence
- Add conversation flow management

**Ticket 5: Create Professional Disclaimers System**

- Add appropriate caveats to estimates
- Include site survey recommendations
- Add planning permission guidance

## 🧪 **Testing Scenarios**

### **Scenario 1: Vague Request**

**Input:** "I need a quote for an extension"
**Expected:** Clarifying questions about type, size, use

### **Scenario 2: Partial Information**

**Input:** "I want a 4x6m single-story kitchen extension"
**Expected:** Questions about finish level, existing layout, access

### **Scenario 3: Detailed Request**

**Input:** "I need a 20sqm single-story kitchen extension with mid-range finishes, including moving a door and basic electrical work"
**Expected:** Detailed quote with cost breakdown

### **Scenario 4: Complex Project**

**Input:** "Full house renovation, 3-bed Victorian terrace"
**Expected:** Extensive questioning about scope, priorities, budget

## 🎯 **Success Metrics**

**Before Implementation:**

- Users get quotes with insufficient information
- High variance in quote accuracy
- Professional contractors would reject such vague briefs

**After Implementation:**

- Users provide more detailed information
- Higher quote accuracy and confidence
- Professional conversation flow
- Better user education about construction processes

## 🚀 **Priority Order**

1. **Ticket 1** (High): Information sufficiency detection
2. **Ticket 3** (High): Updated AI prompts
3. **Ticket 2** (Medium): Question templates
4. **Ticket 4** (Medium): Conversation state
5. **Ticket 5** (Low): Professional disclaimers

This will transform AskToddy from a "magic quote generator" into a professional construction consultant that guides users through proper project scoping.
