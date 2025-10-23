#!/usr/bin/env node

/**
 * Create Linear tickets for AI Conversation Intelligence improvements
 */

const fs = require('fs');

// Epic and tickets for AI conversation improvements
const epic = {
  title: 'AI Conversation Intelligence - Professional Construction Consultation',
  description: `**Problem Statement:**
Currently, AskToddy immediately generates large cost estimates (£3,500-8,000) from minimal user input like "I need a quote for an extension". This is unprofessional and inaccurate.

**Business Impact:**
- Users receive unreliable quotes with insufficient context
- Damages credibility with construction professionals
- Poor user experience vs real contractor consultation process
- High variance in quote accuracy

**Solution Overview:**
Transform AskToddy from a "magic quote generator" into a professional construction consultant that:
- Detects information sufficiency before quoting
- Asks intelligent clarifying questions
- Guides users through proper project scoping
- Only provides detailed quotes when sufficient information is gathered

**Success Metrics:**
- Users provide more detailed project information
- Higher quote accuracy and confidence scores
- Professional conversation flow matching industry standards
- Reduced variance in cost estimates

**Priority:** High - Core product experience issue`,
  priority: 1,
  labels: ['ai', 'conversation', 'epic', 'user-experience', 'professional-quality'],
};

const tickets = [
  {
    title: 'Implement Information Sufficiency Detection System',
    description: `**User Story:**
As an AI system, I want to assess whether the user has provided sufficient information for accurate quoting, so that I can route to conversation mode or quote mode appropriately.

**Problem:**
Currently, the AI always generates full cost breakdowns regardless of information quality, leading to inaccurate quotes from vague inputs like "I need a quote for an extension".

**Acceptance Criteria:**
- [ ] Create information scoring system (0-8 points)
  - Project type clarity (0-2 points)
  - Size/scope details (0-2 points)
  - Quality requirements (0-2 points)
  - Specific constraints (0-2 points)
- [ ] Implement response mode routing:
  - 0-2 points: CONVERSATION MODE (ask questions)
  - 3-5 points: ESTIMATION MODE (rough estimate + ask for details)
  - 6+ points: QUOTE MODE (detailed breakdown)
- [ ] Add conversation context tracking across messages
- [ ] Update Edge Function to support dual-mode responses

**Technical Requirements:**
- Modify \`createAnalysisPrompt\` in Gemini provider
- Add information assessment logic before quote generation
- Implement response type detection in middleware
- Update mobile app to handle conversational responses

**Definition of Done:**
- Vague inputs trigger clarifying questions instead of quotes
- Information scoring works accurately across project types
- Mobile app displays conversational responses properly
- Unit tests for information sufficiency detection

**Priority:** High - Core functionality blocker
**Estimate:** 5-6 hours`,
    priority: 1,
    labels: ['ai', 'conversation', 'backend', 'critical'],
  },
  {
    title: 'Create Professional Question Templates by Project Type',
    description: `**User Story:**
As a user describing my construction project, I want to receive intelligent, professional questions that help me provide the right information for accurate quoting.

**Current Issue:**
When users provide minimal information, the AI should ask relevant questions like a professional contractor would, not generate random quotes.

**Acceptance Criteria:**
- [ ] Design question templates for major project types:
  - **Extensions:** Type, size, purpose, finish level
  - **Kitchens:** Size, scope, appliances, finish quality
  - **Bathrooms:** Type, size, fixtures, accessibility needs
  - **Full renovations:** Scope, priorities, phasing, budget
- [ ] Implement progressive question flow (2-3 questions per response)
- [ ] Add educational content to help users understand requirements
- [ ] Include professional guidance on planning, permits, etc.

**Question Examples:**

**Extension Clarification:**
"I'd love to help with your extension! To provide an accurate quote, I need:

📐 **Size & Type:**
- What type of extension? (single-story, two-story, conservatory)
- Approximate dimensions or square meters?
- How many rooms will it include?

🏠 **Purpose & Finish:**
- What's the main use? (kitchen, living space, bedrooms)
- Desired finish level? (basic, mid-range, high-end)

📋 **Additional Details:**
- Do you have any photos, plans, or drawings?
- What's your rough budget expectation?
- Any specific challenges? (access, existing utilities)"

**Technical Implementation:**
- Create question template system in AI providers
- Add project type detection improvements
- Implement context-aware follow-up questions
- Update response formatting for mobile display

**Priority:** High - User experience
**Estimate:** 4-5 hours`,
    priority: 1,
    labels: ['ai', 'conversation', 'user-experience', 'templates'],
  },
  {
    title: 'Update AI Prompts with Smart Conversation Logic',
    description: `**User Story:**
As the AI system, I want to have intelligent prompts that detect information gaps and respond appropriately, rather than always generating cost estimates.

**Current Problem:**
The existing prompt always instructs the AI to "provide a comprehensive, accurate quote" and expects JSON cost breakdown, leading to inappropriate responses for vague inputs.

**Acceptance Criteria:**
- [ ] Rewrite core AI prompts with two-phase logic:
  1. **Assessment Phase:** Analyze information completeness
  2. **Response Phase:** Route to conversation or quote mode
- [ ] Implement conversation mode responses (no JSON, just helpful questions)
- [ ] Maintain quote mode for sufficient information (existing JSON format)
- [ ] Add context awareness from conversation history
- [ ] Include professional disclaimers and caveats

**New Prompt Structure:**
\`\`\`
PHASE 1: INFORMATION ASSESSMENT
Analyze user input and conversation history for:
- Project type identification (clear/vague)
- Size and scope details (specific/general/missing)
- Quality requirements (specified/assumed/unknown)
- Constraints and special requirements

SCORING (0-8 points):
- Project clarity: 0-2 points
- Size/scope: 0-2 points  
- Quality level: 0-2 points
- Specific details: 0-2 points

PHASE 2: RESPONSE ROUTING
0-2 points: CONVERSATION MODE
- Ask 2-3 specific clarifying questions
- Provide educational guidance
- No cost estimates

3-5 points: ESTIMATION MODE  
- Provide rough range with big caveats
- Ask for remaining critical details
- Limited cost guidance

6+ points: QUOTE MODE
- Generate detailed JSON cost breakdown
- Include timeline and recommendations
- Professional disclaimers
\`\`\`

**Technical Changes:**
- Update \`GeminiProvider.createAnalysisPrompt()\`
- Modify response parsing to handle conversation mode
- Add conversation state tracking
- Update mobile app response handling

**Priority:** High - Core AI behavior
**Estimate:** 6-8 hours`,
    priority: 1,
    labels: ['ai', 'prompts', 'backend', 'critical'],
  },
  {
    title: 'Add Conversation State Management and Context Tracking',
    description: `**User Story:**
As a user having a multi-turn conversation with AskToddy, I want the AI to remember what I've already told it and build upon that information progressively.

**Current Issue:**
Each message is treated independently, so users have to repeat information and the AI doesn't build context across the conversation.

**Acceptance Criteria:**
- [ ] Implement conversation context persistence across messages
- [ ] Track information gathered in previous turns
- [ ] Avoid asking for already-provided information
- [ ] Build comprehensive project profile over multiple exchanges
- [ ] Smart follow-up questions based on previous answers

**Context Tracking Examples:**

**Turn 1:**
User: "I need a quote for an extension"
AI: Asks about type, size, purpose

**Turn 2:**
User: "It's a 4x6m single-story kitchen extension"
AI: Remembers (extension, 24sqm, single-story, kitchen) → Asks about finish level, existing layout, access

**Turn 3:**
User: "Mid-range finishes, existing kitchen is dated 1980s"
AI: Remembers all previous info → Asks about appliances, electrical work, planning permission

**Technical Implementation:**
- Expand conversation history tracking in ChatScreen
- Add context extraction and summarization
- Implement information persistence across messages
- Update AI prompts to use conversation context
- Add conversation state visualization for debugging

**Edge Cases:**
- Handle conversation reset/new project
- Manage conversation state size limits
- Handle conflicting information updates
- Graceful degradation if context is lost

**Priority:** Medium - Enhanced user experience
**Estimate:** 4-6 hours`,
    priority: 2,
    labels: ['ai', 'conversation', 'state-management', 'mobile'],
  },
  {
    title: 'Implement Professional Disclaimers and Guidance System',
    description: `**User Story:**
As a user receiving construction estimates, I want to understand the limitations and assumptions so I can make informed decisions about my project.

**Business Need:**
Professional contractors always include caveats, disclaimers, and guidance. AskToddy should match this professional standard to build trust and set appropriate expectations.

**Acceptance Criteria:**
- [ ] Add context-appropriate disclaimers to all estimates
- [ ] Include professional guidance about next steps
- [ ] Provide education about construction processes
- [ ] Add planning permission and regulation guidance
- [ ] Include site survey recommendations

**Disclaimer Categories:**

**Estimate Accuracy:**
- "Estimates based on provided information and typical UK pricing"
- "Site survey recommended for accurate pricing"
- "Prices subject to material cost fluctuations"
- "Additional costs may apply for structural work or complications"

**Regulatory Guidance:**
- "Planning permission may be required - check with local council"
- "Building regulations compliance required for structural work"
- "Party wall agreements may be needed for extensions"

**Professional Recommendations:**
- "Recommend getting 3 quotes from local contractors"
- "Consider hiring an architect for complex projects"
- "Factor in 10-20% contingency for unexpected issues"

**Process Education:**
- "Typical project phases: Design → Planning → Construction"
- "Allow 2-4 weeks for material delivery"
- "Consider seasonal timing for best prices"

**Technical Implementation:**
- Create disclaimer template system
- Add context-aware disclaimer selection
- Implement professional guidance responses
- Update mobile app to display disclaimers clearly
- Add educational content links

**Integration Points:**
- Conversation mode responses
- Estimation mode caveats  
- Quote mode professional disclaimers
- Document generation includes full disclaimers

**Priority:** Medium - Professional credibility
**Estimate:** 3-4 hours`,
    priority: 2,
    labels: ['ai', 'professional', 'disclaimers', 'user-education'],
  },
];

// Output for review
console.log('🎫 AI Conversation Intelligence Epic & Tickets');
console.log('==============================================');

console.log(`\n📋 EPIC: ${epic.title}`);
console.log(`Priority: ${epic.priority === 1 ? 'High' : epic.priority === 2 ? 'Medium' : 'Low'}`);
console.log(`Labels: ${epic.labels.join(', ')}`);
console.log(`Description preview: ${epic.description.split('\n')[0]}`);

console.log('\n🎯 TICKETS:');
tickets.forEach((ticket, index) => {
  console.log(`\n${index + 1}. ${ticket.title}`);
  console.log(
    `   Priority: ${ticket.priority === 1 ? 'High' : ticket.priority === 2 ? 'Medium' : 'Low'}`
  );
  console.log(`   Labels: ${ticket.labels.join(', ')}`);
  console.log(`   Description preview: ${ticket.description.split('\n')[0]}`);
});

console.log('\n🚀 Implementation Order:');
console.log('1. Information Sufficiency Detection (Ticket 1) - Core blocker');
console.log('2. Smart Conversation Logic (Ticket 3) - AI prompt updates');
console.log('3. Professional Question Templates (Ticket 2) - User experience');
console.log('4. Conversation State Management (Ticket 4) - Enhancement');
console.log('5. Professional Disclaimers (Ticket 5) - Professional polish');

console.log('\n💡 Next Steps:');
console.log('1. Review tickets and adjust priorities if needed');
console.log('2. Create epic and tickets in Linear');
console.log('3. Start with Ticket 1 implementation');
console.log('4. Test thoroughly before pushing to TestFlight');

// Save tickets to file for reference
const fullExport = {
  epic,
  tickets,
  implementationOrder: [
    'Ticket 1: Information Sufficiency Detection',
    'Ticket 3: Smart Conversation Logic',
    'Ticket 2: Professional Question Templates',
    'Ticket 4: Conversation State Management',
    'Ticket 5: Professional Disclaimers',
  ],
};

fs.writeFileSync('ai-conversation-tickets.json', JSON.stringify(fullExport, null, 2));
console.log('\n💾 Tickets saved to ai-conversation-tickets.json');
