/**
 * PROPERLY STRUCTURED Analyze Construction Edge Function
 * Returns fully structured ProjectAnalysis - NO frontend parsing required
 */

console.log('🏗️ STRUCTURED Analyze Construction Edge Function - v2');

// Type definitions matching frontend interfaces
interface MaterialItem {
  name: string;
  quantity: string;
  unitPrice: number;
  totalPrice: number;
  category: 'structural' | 'finishing' | 'electrical' | 'plumbing' | 'other';
}

interface QuoteBreakdown {
  materials: {
    min: number;
    max: number;
    items: MaterialItem[];
  };
  labor: {
    min: number;
    max: number;
    hourlyRate: number;
    estimatedHours: number;
  };
  total: {
    min: number;
    max: number;
  };
}

interface ProjectAnalysis {
  projectType: string;
  description: string;
  difficultyLevel:
    | 'Easy'
    | 'Moderate'
    | 'Difficult'
    | 'Professional Required'
    | 'Information Needed'
    | 'Preliminary Estimate';
  responseType?: 'conversation' | 'estimation' | 'quote';

  costBreakdown: QuoteBreakdown;
  roughEstimate?: {
    min: number;
    max: number;
    caveats: string[];
  };

  timeline: {
    diy: string;
    professional: string;
    totalDays?: number;
    phases: Array<{
      name: string;
      duration: string;
      description: string;
    }>;
  };

  toolsRequired: Array<{
    name: string;
    category: 'power_tools' | 'hand_tools' | 'heavy_machinery' | 'safety';
  }>;

  safetyConsiderations: string[];
  permitsRequired: string[];
  requiresProfessional: boolean;
  professionalReasons?: string[];

  confidence: number;
  recommendations: string[];
  warnings: string[];
  questionsAsked?: string[];
  informationNeeded?: string[];

  // Metadata
  sessionId?: string;
  provider?: string;
  timestamp?: string;

  // Pass-through tasks for frontend grouping
  tasks?: Array<{
    description: string;
    category: string;
    min_cost: number;
    max_cost: number;
    materials: string[];
    labor_days: number;
    notes?: string;
  }>;
  summary?: {
    total_min: number;
    total_max: number;
    timeline_days: number;
    confidence: number;
    location_multiplier?: number;
    size_multiplier?: number;
    spec_multiplier?: number;
    construction_method_multiplier?: number;
    construction_method?: string;
  };
}

// Calculate size multiplier based on property dimensions
function calculateSizeMultiplier(sizeStr: string): number {
  if (!sizeStr || typeof sizeStr !== 'string') {
    console.warn('Invalid sizeStr provided to calculateSizeMultiplier:', sizeStr);
    return 1.0;
  }

  const size = sizeStr.toLowerCase();

  // Try to extract square meters
  const sqmMatch = size.match(/(\d+)\s*(?:sqm|m2|square\s*met)/i);
  if (sqmMatch && sqmMatch[1]) {
    const sqm = parseInt(sqmMatch[1]);
    if (!isNaN(sqm)) {
      if (sqm < 50) return 0.8;
      if (sqm < 100) return 1.0;
      if (sqm < 200) return 1.5;
      return 2.0;
    }
  }

  // Try to extract square feet and convert
  const sqftMatch = size.match(/(\d+)\s*(?:sqft|ft2|square\s*fe)/i);
  if (sqftMatch && sqftMatch[1]) {
    const sqft = parseInt(sqftMatch[1]);
    if (!isNaN(sqft)) {
      const sqm = sqft / 10.764; // Convert to sqm
      if (sqm < 50) return 0.8;
      if (sqm < 100) return 1.0;
      if (sqm < 200) return 1.5;
      return 2.0;
    }
  }

  // Text-based size detection
  if (size.includes('small') || size.includes('studio') || size.includes('1 bed')) return 0.8;
  if (size.includes('large') || size.includes('4 bed') || size.includes('5 bed')) return 1.5;
  if (size.includes('very large') || size.includes('mansion')) return 2.0;

  // Room counts for extensions
  if (size.includes('single room')) return 0.8;
  if (size.includes('double room') || size.includes('two room')) return 1.3;

  return 1.0; // Default medium
}

// Calculate regional multiplier based on UK location
function calculateRegionalMultiplier(location: string): number {
  if (!location || typeof location !== 'string') {
    console.warn('Invalid location provided to calculateRegionalMultiplier:', location);
    return 1.0;
  }

  const loc = location.toLowerCase();

  // London and surroundings
  if (loc.includes('london') || loc.includes('sw1') || loc.includes('ec1') || loc.includes('w1'))
    return 1.25;
  if (loc.includes('surrey') || loc.includes('hertford') || loc.includes('berkshire')) return 1.15;

  // South regions
  if (loc.includes('brighton') || loc.includes('oxford') || loc.includes('cambridge')) return 1.15;
  if (loc.includes('south') || loc.includes('sussex') || loc.includes('kent')) return 1.1;

  // Midlands
  if (loc.includes('birmingham') || loc.includes('midland') || loc.includes('leicester'))
    return 1.0;

  // North regions
  if (loc.includes('manchester') || loc.includes('liverpool') || loc.includes('leeds')) return 0.95;
  if (loc.includes('newcastle') || loc.includes('north') || loc.includes('yorkshire')) return 0.9;

  // Scotland, Wales, NI
  if (loc.includes('scotland') || loc.includes('edinburgh') || loc.includes('glasgow')) return 0.85;
  if (loc.includes('wales') || loc.includes('cardiff') || loc.includes('swansea')) return 0.88;
  if (loc.includes('belfast') || loc.includes('northern ireland')) return 0.83;

  return 1.0; // Default UK average
}

// Calculate spec level multiplier from notes
function calculateSpecMultiplier(notes: string): { multiplier: number; level: string } {
  if (!notes || typeof notes !== 'string') {
    return { multiplier: 1.0, level: 'standard' };
  }

  const text = notes.toLowerCase();

  // High-end spec indicators
  if (
    text.includes('high spec') ||
    text.includes('high-spec') ||
    text.includes('luxury') ||
    text.includes('premium') ||
    text.includes('top quality') ||
    text.includes('high end') ||
    text.includes('high-end') ||
    text.includes('designer') ||
    text.includes('bespoke')
  ) {
    return { multiplier: 1.5, level: 'high-spec' };
  }

  // Mid-high spec
  if (text.includes('good quality') || text.includes('quality finish') || text.includes('modern')) {
    return { multiplier: 1.25, level: 'mid-high' };
  }

  // Budget spec indicators
  if (
    text.includes('budget') ||
    text.includes('basic') ||
    text.includes('cheap') ||
    text.includes('low cost') ||
    text.includes('economy') ||
    text.includes('simple')
  ) {
    return { multiplier: 0.75, level: 'budget' };
  }

  return { multiplier: 1.0, level: 'standard' };
}

// Create a structured prompt for JSON output
function createStructuredPrompt(message: string, projectType: string): string {
  if (!message || typeof message !== 'string') {
    console.warn('Invalid message provided to createStructuredPrompt:', message);
    message = 'General construction project';
  }

  // Extract key information from the message
  // Use more flexible patterns that capture multi-line content until the next section
  const sizeMatch = message.match(/Size[\/\s]*Dimensions[:\s]+([^\n]+)/i);
  const locationMatch = message.match(/Location[:\s]+([^\n]+)/i);
  const tasksMatch = message.match(/Selected Work Items[:\s]+([^\n]+)/i);
  // Extract construction method and its multiplier
  const constructionMethodMatch = message.match(/Construction Method[:\s]+([^(]+)\(([0-9.]+)x/i);
  // Capture notes until VOICE NOTES section or end of relevant content
  const notesMatch = message.match(
    /DETAILED NOTES[:\s]+([\s\S]*?)(?=🎤 VOICE|ANALYSIS REQUIREMENTS|$)/i
  );

  // Clean up extracted values - remove trailing punctuation and labels
  const cleanValue = (val: string | undefined): string => {
    if (!val) return '';
    // Remove trailing "Property Type:", "Job Type:", etc. and trim
    return val
      .replace(/\s*(Property Type|Job Type|Size|Location|Selected|DETAILED|VOICE)[:\s]*$/i, '')
      .trim();
  };

  const size = cleanValue(sizeMatch?.[1]) || 'standard';
  const location = cleanValue(locationMatch?.[1]) || 'UK';
  const userTasks = cleanValue(tasksMatch?.[1]) || '';
  const notes = cleanValue(notesMatch?.[1]) || '';

  // Extract construction method info
  const constructionMethod = constructionMethodMatch ? cleanValue(constructionMethodMatch[1]) : '';
  const constructionMethodMultiplier = constructionMethodMatch
    ? parseFloat(constructionMethodMatch[2]) || 1.0
    : 1.0;

  console.log('📊 Extracted from prompt:', {
    size,
    location,
    userTasks: userTasks.substring(0, 50),
    notes: notes.substring(0, 100),
    constructionMethod: constructionMethod || 'not specified',
    constructionMethodMultiplier,
  });

  // Calculate multipliers
  const sizeMultiplier = calculateSizeMultiplier(size);
  const locationMultiplier = calculateRegionalMultiplier(location);
  const specInfo = calculateSpecMultiplier(notes);

  // Combined multiplier (now includes construction method)
  const totalMultiplier =
    sizeMultiplier * locationMultiplier * specInfo.multiplier * constructionMethodMultiplier;

  console.log('📈 Multipliers:', {
    size: sizeMultiplier,
    location: locationMultiplier,
    spec: specInfo.multiplier,
    constructionMethod: constructionMethodMultiplier,
    total: totalMultiplier.toFixed(2),
  });

  return `UK construction estimator. Return ONLY JSON, no extra text.

${projectType} project in ${location}, size: ${size}
${constructionMethod ? `Construction method: ${constructionMethod}` : ''}
Spec level: ${specInfo.level} (${notes ? `Customer notes: "${notes}"` : 'standard specification'})
Tasks requested: ${userTasks}

IMPORTANT: Apply ${totalMultiplier.toFixed(2)}x price adjustment based on:
- Location: ${locationMultiplier}x (${location})
- Size: ${sizeMultiplier}x (${size})
- Spec level: ${specInfo.multiplier}x (${specInfo.level})
${constructionMethod ? `- Construction method: ${constructionMethodMultiplier}x (${constructionMethod})` : ''}
${specInfo.level === 'high-spec' ? '- Use PREMIUM materials and finishes in estimates' : ''}
${specInfo.level === 'budget' ? '- Use BUDGET materials and basic finishes' : ''}
${constructionMethod ? `- Use materials and techniques appropriate for ${constructionMethod} construction` : ''}

Provide 5-8 main construction tasks with COMBINED materials+labor costs.

JSON format:
{
  "tasks": [
    {
      "description": "Install bathroom suite",
      "category": "Fixtures",
      "min_cost": 1500,
      "max_cost": 3000,
      "materials": ["toilet", "basin", "bath"],
      "labor_days": 2,
      "notes": "includes materials and labor"
    }
  ],
  "summary": {
    "total_min": 8000,
    "total_max": 15000,
    "timeline_days": 14,
    "confidence": 85,
    "location_multiplier": ${locationMultiplier},
    "size_multiplier": ${sizeMultiplier},
    "spec_multiplier": ${specInfo.multiplier},
    "construction_method_multiplier": ${constructionMethodMultiplier}${
      constructionMethod
        ? `,
    "construction_method": "${constructionMethod}"`
        : ''
    }
  }
}`;
}

// Intelligent Gemini API call with smart retry logic
async function callGemini(
  prompt: string,
  apiKey: string,
  images?: { base64: string; mimeType: string }[],
  audio?: { base64: string; mimeType: string }[]
): Promise<string> {
  console.log('🤖 Calling Gemini API...');
  console.log('📝 Prompt length:', prompt.length, 'characters');
  if (images && images.length > 0) {
    console.log(`📸 Including ${images.length} image(s) in request`);
  }
  if (audio && audio.length > 0) {
    console.log(`🎤 Including ${audio.length} audio file(s) in request`);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // Build parts array - text first, then images
  const parts: any[] = [{ text: prompt }];

  // Add images if provided
  if (images && images.length > 0) {
    for (const image of images) {
      parts.push({
        inline_data: {
          mime_type: image.mimeType,
          data: image.base64,
        },
      });
    }
  }

  // Add audio files if provided
  if (audio && audio.length > 0) {
    for (const audioFile of audio) {
      parts.push({
        inline_data: {
          mime_type: audioFile.mimeType,
          data: audioFile.base64,
        },
      });
    }
  }

  // Intelligent retry logic based on error types
  let retries = 1; // Only 1 retry for network/server errors
  let attempt = 0;

  while (attempt <= retries) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for Gemini 2.5

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
      }

      const errorBody = await response.text();

      // Smart error handling based on status code
      if (response.status === 429) {
        // Rate limit - DO NOT RETRY to preserve quota
        console.error('🚫 Rate limited - not retrying to preserve quota');
        throw new Error(`Gemini API quota exceeded: ${errorBody}`);
      } else if (response.status === 401 || response.status === 403) {
        // Auth errors - DO NOT RETRY (won't help)
        console.error('🔐 Authentication error - not retrying');
        throw new Error(`Gemini API auth error: ${response.status} - ${errorBody}`);
      } else if (response.status >= 500 && response.status < 600) {
        // Server errors - RETRY ONCE (might be temporary)
        if (attempt < retries) {
          console.log(`⚠️ Server error ${response.status}, retrying once...`);
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
          continue;
        }
      } else if (response.status === 400) {
        // Bad request - DO NOT RETRY (client error)
        console.error('❌ Bad request - not retrying');
        throw new Error(`Gemini API bad request: ${errorBody}`);
      }

      throw new Error(`Gemini API error: ${response.status} - ${errorBody}`);
    } catch (error) {
      if (attempt >= retries) {
        // Handle timeout specifically
        if (error.name === 'AbortError') {
          throw new Error('Gemini API timeout after 15 seconds');
        }
        throw error;
      }

      // Network/timeout errors - RETRY ONCE (might be transient)
      if (error.name === 'AbortError') {
        console.log('⏰ API timeout, retrying with shorter prompt...');
      } else {
        console.log('🔄 Network error, retrying once...');
      }
      attempt++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error('Max retries exceeded');
}

// Process valid parsed JSON into ProjectAnalysis
function processValidJson(parsed: any, projectType: string): ProjectAnalysis {
  // Convert parsed JSON to ProjectAnalysis format
  const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
  const summary = parsed.summary && typeof parsed.summary === 'object' ? parsed.summary : {};

  // Build material items from tasks
  const materialItems: MaterialItem[] = [];
  tasks.forEach((task: any) => {
    if (
      task &&
      typeof task === 'object' &&
      Array.isArray(task.materials) &&
      task.materials.length > 0
    ) {
      task.materials.forEach((material: string) => {
        if (material && typeof material === 'string') {
          const minCost = typeof task.min_cost === 'number' ? task.min_cost : 0;
          const maxCost = typeof task.max_cost === 'number' ? task.max_cost : 0;
          const materialCount = task.materials.length || 1;

          materialItems.push({
            name: material,
            quantity: task.quantity || '1',
            unitPrice: Math.round((minCost + maxCost) / 2 / materialCount),
            totalPrice: Math.round((minCost + maxCost) / 2 / materialCount),
            category: mapToMaterialCategory(task.category),
          });
        }
      });
    }
  });

  return {
    projectType,
    description: `AI-generated ${projectType} quote with location and size adjustments`,
    difficultyLevel: determineDifficulty(summary.total_max || 10000),
    responseType: 'quote',

    costBreakdown: {
      materials: {
        min: tasks.reduce((sum: number, t: any) => sum + t.min_cost * 0.6, 0),
        max: tasks.reduce((sum: number, t: any) => sum + t.max_cost * 0.6, 0),
        items: materialItems,
      },
      labor: {
        min: tasks.reduce((sum: number, t: any) => sum + t.min_cost * 0.4, 0),
        max: tasks.reduce((sum: number, t: any) => sum + t.max_cost * 0.4, 0),
        hourlyRate: 30,
        estimatedHours: tasks.reduce((sum: number, t: any) => sum + (t.labor_days || 1), 0) * 8,
      },
      total: {
        min: summary.total_min || tasks.reduce((sum: number, t: any) => sum + t.min_cost, 0),
        max: summary.total_max || tasks.reduce((sum: number, t: any) => sum + t.max_cost, 0),
      },
    },

    timeline: {
      diy: `${(summary.timeline_days || 10) + 5} days`,
      professional: `${summary.timeline_days || 10} days`,
      totalDays: summary.timeline_days || 10,
      phases: generatePhasesFromTasks(tasks, projectType),
    },

    toolsRequired: generateToolsRequired(projectType),
    safetyConsiderations: generateSafetyConsiderations(projectType),
    permitsRequired: generatePermitsRequired(projectType),
    requiresProfessional: (summary.total_max || 0) > 20000,

    confidence: summary.confidence || 75,
    recommendations: summary.assumptions || [
      'Get multiple quotes',
      'Check material prices locally',
    ],
    warnings: ['Prices may vary based on specific site conditions'],

    timestamp: new Date().toISOString(),
    provider: 'gemini-json',

    // Pass through raw tasks for frontend to use for grouped display
    tasks: tasks.map((task: any) => ({
      description: task.description || 'Construction task',
      category: task.category || 'General',
      min_cost: task.min_cost || 0,
      max_cost: task.max_cost || 0,
      materials: Array.isArray(task.materials) ? task.materials : [],
      labor_days: task.labor_days || 1,
      notes: task.notes,
    })),
    summary: {
      total_min:
        summary.total_min || tasks.reduce((sum: number, t: any) => sum + (t.min_cost || 0), 0),
      total_max:
        summary.total_max || tasks.reduce((sum: number, t: any) => sum + (t.max_cost || 0), 0),
      timeline_days: summary.timeline_days || 10,
      confidence: summary.confidence || 75,
      location_multiplier: summary.location_multiplier,
      size_multiplier: summary.size_multiplier,
      spec_multiplier: summary.spec_multiplier,
      construction_method_multiplier: summary.construction_method_multiplier,
      construction_method: summary.construction_method,
    },
  };
}

// Parse structured AI response into ProjectAnalysis
// New JSON parser for Gemini responses
function parseJsonResponse(aiText: string, projectType: string): ProjectAnalysis {
  try {
    if (!aiText || typeof aiText !== 'string') {
      throw new Error('Invalid aiText provided to parseJsonResponse');
    }

    // Try to extract and parse JSON from response
    console.log('🔍 Raw AI response (first 500 chars):', aiText.substring(0, 500));
    console.log(
      '🔍 Raw AI response (last 200 chars):',
      aiText.substring(Math.max(0, aiText.length - 200))
    );

    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch && jsonMatch[0]) {
      const jsonStr = jsonMatch[0];
      console.log('📝 Extracted JSON string length:', jsonStr.length);
      console.log('📝 JSON preview (first 300 chars):', jsonStr.substring(0, 300));

      try {
        const parsed = JSON.parse(jsonStr);

        // Validate that parsed is an object
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Parsed JSON is not a valid object');
        }

        console.log('✅ Successfully parsed JSON from Gemini');
        console.log(
          '📊 Tasks count:',
          Array.isArray(parsed.tasks) ? parsed.tasks.length : 'No tasks array'
        );

        if (!Array.isArray(parsed.tasks) || parsed.tasks.length === 0) {
          console.warn('⚠️ No valid tasks array found in parsed JSON, will use fallback parsing');
          throw new Error('No tasks in JSON'); // This will trigger fallback parsing
        }

        // If we get here, we have valid JSON with tasks
        return processValidJson(parsed, projectType);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError.message);
        console.log('🔍 Failed JSON string:', jsonStr.substring(0, 200) + '...');
        // Fall through to template parser below
      }
    }
  } catch (error) {
    console.error('Failed to parse JSON from Gemini:', error);
  }

  // Fallback to template parsing if JSON fails
  console.log('⚠️ JSON parsing failed, using fallback template parser');
  return parseStructuredResponse(aiText, projectType);
}

// Helper function to map categories
function mapToMaterialCategory(
  category: string
): 'structural' | 'finishing' | 'electrical' | 'plumbing' | 'other' {
  const cat = (category || '').toLowerCase();
  if (cat.includes('structural')) return 'structural';
  if (cat.includes('finishing')) return 'finishing';
  if (cat.includes('electrical')) return 'electrical';
  if (cat.includes('plumbing') || cat.includes('services')) return 'plumbing';
  return 'other';
}

// Helper function to determine difficulty
function determineDifficulty(totalMax: number): ProjectAnalysis['difficultyLevel'] {
  if (totalMax < 5000) return 'Easy';
  if (totalMax < 15000) return 'Moderate';
  if (totalMax < 30000) return 'Difficult';
  return 'Professional Required';
}

// Helper function to generate phases from tasks
function generatePhasesFromTasks(
  tasks: any[],
  projectType: string
): Array<{ name: string; duration: string; description: string }> {
  const phases: Array<{ name: string; duration: string; description: string }> = [];

  // Group tasks by category
  const categories: { [key: string]: any[] } = {};
  tasks.forEach(task => {
    const cat = task.category || 'General';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(task);
  });

  // Create phases from categories
  Object.entries(categories).forEach(([category, catTasks]) => {
    const totalDays = catTasks.reduce((sum, t) => sum + (t.labor_days || 1), 0);
    phases.push({
      name: category,
      duration: `${totalDays} days`,
      description: catTasks.map((t: any) => t.description).join(', '),
    });
  });

  return phases.length > 0 ? phases : generateProjectPhases(projectType, 10);
}

// Original template-based parser (fallback)
function parseStructuredResponse(aiText: string, projectType: string): ProjectAnalysis {
  console.log('🔍 Using template-based parsing (fallback)...');

  // Extract cost ranges
  const costMatches = aiText.match(/£([\d,]+)(?:\s*[-–]\s*£([\d,]+))?/g) || [];

  // Parse main cost range (usually the first or largest)
  let totalMin = 1000,
    totalMax = 5000;
  if (costMatches.length > 0) {
    const mainCost = costMatches[0].match(/£([\d,]+)(?:\s*[-–]\s*£([\d,]+))?/);
    if (mainCost) {
      totalMin = parseInt(mainCost[1].replace(/,/g, ''));
      totalMax = mainCost[2] ? parseInt(mainCost[2].replace(/,/g, '')) : totalMin * 1.5;
    }
  }

  // Determine project difficulty
  const text = aiText.toLowerCase();
  let difficultyLevel: ProjectAnalysis['difficultyLevel'] = 'Moderate';

  if (text.includes('professional') || text.includes('specialist') || text.includes('certified')) {
    difficultyLevel = 'Professional Required';
  } else if (text.includes('difficult') || text.includes('complex') || text.includes('advanced')) {
    difficultyLevel = 'Difficult';
  } else if (text.includes('easy') || text.includes('simple') || text.includes('basic')) {
    difficultyLevel = 'Easy';
  }

  // Generate realistic material breakdown based on project type
  const materialItems = generateMaterialItems(projectType, totalMin, totalMax);

  // Calculate labor (typically 40-60% of total cost)
  const laborMin = Math.round(totalMin * 0.4);
  const laborMax = Math.round(totalMax * 0.6);
  const estimatedHours = Math.round((laborMin + laborMax) / 2 / 25); // £25/hour average

  // Calculate materials cost (total - labor)
  const materialsMin = totalMin - laborMax;
  const materialsMax = totalMax - laborMin;

  // Extract timeline info
  const timelineMatch = aiText.match(/(\d+)[\s-]*(?:days?|weeks?)/gi);
  let totalDays = 7; // Default
  if (timelineMatch) {
    const timeStr = timelineMatch[0].toLowerCase();
    if (timeStr.includes('week')) {
      totalDays = parseInt(timeStr) * 7;
    } else {
      totalDays = parseInt(timeStr);
    }
  }

  // Generate project phases
  const phases = generateProjectPhases(projectType, totalDays);

  return {
    projectType,
    description: `UK ${projectType} project analysis based on provided specifications`,
    difficultyLevel,
    responseType: 'quote',

    costBreakdown: {
      materials: {
        min: Math.max(materialsMin, 500),
        max: materialsMax,
        items: materialItems,
      },
      labor: {
        min: laborMin,
        max: laborMax,
        hourlyRate: 25,
        estimatedHours,
      },
      total: {
        min: totalMin,
        max: totalMax,
      },
    },

    timeline: {
      diy: `${totalDays + 5} days (including learning time)`,
      professional: `${totalDays} days`,
      totalDays,
      phases,
    },

    toolsRequired: generateToolsRequired(projectType),

    safetyConsiderations: generateSafetyConsiderations(projectType),
    permitsRequired: generatePermitsRequired(projectType),
    requiresProfessional: difficultyLevel === 'Professional Required',
    professionalReasons:
      difficultyLevel === 'Professional Required'
        ? ['Building regulations compliance', 'Safety requirements', 'Warranty protection']
        : undefined,

    confidence: 85, // High confidence in structured analysis
    recommendations: generateRecommendations(projectType),
    warnings: generateWarnings(projectType),

    timestamp: new Date().toISOString(),
    provider: 'gemini-structured',
  };
}

// Generate realistic material items based on project type
function generateMaterialItems(
  projectType: string,
  totalMin: number,
  totalMax: number
): MaterialItem[] {
  const avgCost = (totalMin + totalMax) / 2;
  const items: MaterialItem[] = [];

  // Template materials by project type
  const templates: Record<string, Partial<MaterialItem>[]> = {
    bathroom: [
      { name: 'Tiles', category: 'finishing', unitPrice: 25 },
      { name: 'Toilet suite', category: 'plumbing', unitPrice: 200 },
      { name: 'Basin', category: 'plumbing', unitPrice: 150 },
      { name: 'Plumbing fittings', category: 'plumbing', unitPrice: 100 },
    ],
    kitchen: [
      { name: 'Kitchen units', category: 'structural', unitPrice: 150 },
      { name: 'Worktop', category: 'finishing', unitPrice: 300 },
      { name: 'Appliances', category: 'electrical', unitPrice: 500 },
      { name: 'Electrical fittings', category: 'electrical', unitPrice: 80 },
    ],
    extension: [
      { name: 'Bricks/blocks', category: 'structural', unitPrice: 200 },
      { name: 'Roof materials', category: 'structural', unitPrice: 800 },
      { name: 'Windows/doors', category: 'finishing', unitPrice: 600 },
      { name: 'Insulation', category: 'structural', unitPrice: 150 },
    ],
    roofing: [
      { name: 'Roof tiles/slates', category: 'structural', unitPrice: 400 },
      { name: 'Roof battens', category: 'structural', unitPrice: 100 },
      { name: 'Guttering', category: 'structural', unitPrice: 200 },
      { name: 'Scaffolding hire', category: 'other', unitPrice: 300 },
    ],
  };

  const template = templates[projectType] || templates.bathroom;

  // Calculate proportional costs
  const materialBudget = avgCost * 0.6; // 60% for materials
  const itemBudget = materialBudget / template.length;

  template.forEach((item, index) => {
    const basePrice = item.unitPrice || 100;
    const scaleFactor = itemBudget / basePrice;
    const quantity = Math.max(1, Math.round(scaleFactor));

    items.push({
      name: item.name!,
      quantity: `${quantity}`,
      unitPrice: basePrice,
      totalPrice: basePrice * quantity,
      category: item.category!,
    });
  });

  return items;
}

// Generate project phases
function generateProjectPhases(
  projectType: string,
  totalDays: number
): Array<{ name: string; duration: string; description: string }> {
  const phasesMap: Record<
    string,
    Array<{ name: string; percentage: number; description: string }>
  > = {
    bathroom: [
      { name: 'Strip out', percentage: 0.15, description: 'Remove existing bathroom' },
      { name: 'First fix', percentage: 0.25, description: 'Plumbing and electrical' },
      { name: 'Tiling', percentage: 0.3, description: 'Wall and floor tiling' },
      { name: 'Installation', percentage: 0.3, description: 'Fit bathroom suite' },
    ],
    kitchen: [
      { name: 'Strip out', percentage: 0.2, description: 'Remove old kitchen' },
      { name: 'Services', percentage: 0.3, description: 'Plumbing and electrical' },
      { name: 'Installation', percentage: 0.35, description: 'Fit units and worktops' },
      { name: 'Finishing', percentage: 0.15, description: 'Final connections and testing' },
    ],
    extension: [
      { name: 'Foundation', percentage: 0.25, description: 'Dig and pour foundations' },
      { name: 'Structure', percentage: 0.35, description: 'Build walls and roof' },
      { name: 'Services', percentage: 0.25, description: 'Plumbing, electrical, insulation' },
      { name: 'Finishing', percentage: 0.15, description: 'Plastering and decoration' },
    ],
    roofing: [
      { name: 'Setup', percentage: 0.1, description: 'Scaffolding and preparation' },
      { name: 'Strip', percentage: 0.2, description: 'Remove old materials' },
      { name: 'Structure', percentage: 0.4, description: 'Replace battens and felt' },
      { name: 'Covering', percentage: 0.3, description: 'Install new tiles/slates' },
    ],
  };

  const phases = phasesMap[projectType] || phasesMap.bathroom;

  return phases.map(phase => ({
    name: phase.name,
    duration: `${Math.max(1, Math.round(totalDays * phase.percentage))} days`,
    description: phase.description,
  }));
}

// Generate tools required
function generateToolsRequired(
  projectType: string
): Array<{ name: string; category: 'power_tools' | 'hand_tools' | 'heavy_machinery' | 'safety' }> {
  const toolsMap: Record<
    string,
    Array<{ name: string; category: 'power_tools' | 'hand_tools' | 'heavy_machinery' | 'safety' }>
  > = {
    bathroom: [
      { name: 'Tile cutter', category: 'power_tools' },
      { name: 'Drill', category: 'power_tools' },
      { name: 'Spirit level', category: 'hand_tools' },
      { name: 'Safety glasses', category: 'safety' },
    ],
    kitchen: [
      { name: 'Circular saw', category: 'power_tools' },
      { name: 'Router', category: 'power_tools' },
      { name: 'Screwdrivers', category: 'hand_tools' },
      { name: 'Dust mask', category: 'safety' },
    ],
    extension: [
      { name: 'Concrete mixer', category: 'heavy_machinery' },
      { name: 'Scaffolding', category: 'heavy_machinery' },
      { name: 'Hammer drill', category: 'power_tools' },
      { name: 'Hard hat', category: 'safety' },
    ],
    roofing: [
      { name: 'Scaffolding', category: 'heavy_machinery' },
      { name: 'Nail gun', category: 'power_tools' },
      { name: 'Safety harness', category: 'safety' },
      { name: 'Ladder', category: 'hand_tools' },
    ],
  };

  return toolsMap[projectType] || toolsMap.bathroom;
}

// Generate safety considerations
function generateSafetyConsiderations(projectType: string): string[] {
  const safetyMap: Record<string, string[]> = {
    bathroom: [
      'Ensure electrical safety around water',
      'Proper ventilation for adhesives',
      'Non-slip surfaces while working',
    ],
    kitchen: [
      'Gas safety for hob connections',
      'Electrical safety for appliances',
      'Dust protection when cutting',
    ],
    extension: [
      'Structural safety during construction',
      'Foundation depth regulations',
      'Safe working at height',
    ],
    roofing: [
      'Working at height safety',
      'Weather condition assessment',
      'Proper scaffolding setup',
    ],
  };

  return safetyMap[projectType] || safetyMap.bathroom;
}

// Generate permits required
function generatePermitsRequired(projectType: string): string[] {
  const permitsMap: Record<string, string[]> = {
    extension: ['Planning permission', 'Building regulations approval'],
    roofing: ['Building regulations (if structural changes)'],
    bathroom: ['Building regulations (if moving walls)'],
    kitchen: ['Building regulations (if gas work)'],
  };

  return permitsMap[projectType] || [];
}

// Generate recommendations
function generateRecommendations(projectType: string): string[] {
  return [
    'Get multiple quotes from qualified tradespeople',
    'Check references and insurance coverage',
    'Allow 10-20% contingency for unexpected costs',
    'Ensure compliance with local building regulations',
  ];
}

// Generate warnings
function generateWarnings(projectType: string): string[] {
  const warningsMap: Record<string, string[]> = {
    extension: [
      'Requires planning permission approval',
      'Foundation work must meet building regulations',
    ],
    roofing: ['Weather dependent work', 'Safety critical - consider professional installation'],
    bathroom: ['Waterproofing is critical', 'Electrical work requires certified electrician'],
    kitchen: ['Gas work requires Gas Safe registered engineer'],
  };

  return (
    warningsMap[projectType] || [
      'Always follow safety guidelines',
      'Consider professional consultation',
    ]
  );
}

Deno.serve(async req => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    console.log('🚀 Edge function started, parsing request...');
    const { message, sessionId, userId, analysisType, context, history, images, audio } =
      await req.json();
    console.log('📩 Request parsed successfully, message length:', message?.length || 0);
    if (images && images.length > 0) {
      console.log(`📸 Received ${images.length} image(s) for analysis`);
    }
    if (audio && audio.length > 0) {
      console.log(`🎤 Received ${audio.length} voice recording(s) for analysis`);
    }

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers,
      });
    }

    // Log session continuity for debugging
    console.log(`🔐 Session: ${sessionId || 'no-session'}, User: ${userId || 'anonymous'}`);
    if (context) {
      console.log(`📍 Location: ${context.city || 'Unknown'}, Region: ${context.region || 'UK'}`);
    }

    console.log('🔑 Checking API key...');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.log('❌ No GEMINI_API_KEY found!');
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        status: 500,
        headers,
      });
    }
    console.log('✅ API key found');

    console.log(`📝 Processing: ${message.substring(0, 100)}...`);

    // Extract project type from message
    console.log('📋 Extracting project type...');
    const projectType = extractProjectType(message);
    console.log('🏗️ Project type:', projectType);

    // Create structured prompt for JSON output
    console.log('🎯 Creating structured prompt...');
    const structuredPrompt = createStructuredPrompt(message, projectType);
    console.log('📏 Prompt created, length:', structuredPrompt.length);

    // Call AI API with structured prompt, images, and audio
    console.log('📞 About to call Gemini...');
    const aiResponse = await callGemini(structuredPrompt, geminiApiKey, images, audio);
    console.log('✅ Gemini responded, length:', aiResponse.length);

    // Parse JSON response with new parser
    const structuredAnalysis = parseJsonResponse(aiResponse, projectType);
    structuredAnalysis.sessionId = sessionId || `session_${Date.now()}`;

    console.log(
      `✅ Analysis complete: £${structuredAnalysis.costBreakdown.total.min.toLocaleString()}-£${structuredAnalysis.costBreakdown.total.max.toLocaleString()}, Session: ${structuredAnalysis.sessionId}`
    );

    // Return properly structured response with success wrapper
    const successResponse = {
      success: true,
      data: structuredAnalysis,
      processingTimeMs: Date.now() - Date.now(), // Will be calculated by frontend
      aiProvider: 'gemini-structured',
    };
    return new Response(JSON.stringify(successResponse), { headers });
  } catch (error) {
    console.error('❌ Edge Function critical error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);

    // Return fallback structured response with error details for debugging
    const fallbackAnalysis: ProjectAnalysis = {
      projectType: 'general',
      description: `Fallback: ${error.message || 'Unknown error'}`,
      difficultyLevel: 'Preliminary Estimate',
      responseType: 'quote',

      costBreakdown: {
        materials: {
          min: 1000,
          max: 3000,
          items: [
            {
              name: 'Basic materials',
              quantity: '1',
              unitPrice: 2000,
              totalPrice: 2000,
              category: 'other',
            },
          ],
        },
        labor: {
          min: 800,
          max: 1200,
          hourlyRate: 25,
          estimatedHours: 40,
        },
        total: {
          min: 1800,
          max: 4200,
        },
      },

      timeline: {
        diy: '10-15 days',
        professional: '5-7 days',
        totalDays: 7,
        phases: [
          { name: 'Planning', duration: '1 day', description: 'Project planning and preparation' },
          { name: 'Execution', duration: '5 days', description: 'Main construction work' },
          { name: 'Finishing', duration: '1 day', description: 'Final touches and cleanup' },
        ],
      },

      toolsRequired: [
        { name: 'Basic hand tools', category: 'hand_tools' },
        { name: 'Safety equipment', category: 'safety' },
      ],

      safetyConsiderations: ['Follow safety guidelines', 'Use appropriate PPE'],
      permitsRequired: ['Check local building regulations'],
      requiresProfessional: false,

      confidence: 60,
      recommendations: ['Get professional quotes for comparison'],
      warnings: ['Estimates based on limited information'],

      timestamp: new Date().toISOString(),
      provider: 'fallback-template',
    };

    // Return fallback with same success wrapper format
    const fallbackResponse = {
      success: true,
      data: fallbackAnalysis,
      processingTimeMs: 0,
      aiProvider: 'fallback-template',
    };
    return new Response(
      JSON.stringify(fallbackResponse),
      { status: 200, headers } // Return 200 with fallback data
    );
  }
});

// Extract project type from user message
function extractProjectType(message: string): string {
  const text = message.toLowerCase();

  // PRIORITY 1: Check explicit "Job Type:" field from form (most reliable)
  const jobTypeMatch = text.match(/job type[:\s]+(\w+)/i);
  if (jobTypeMatch) {
    const jobType = jobTypeMatch[1].toLowerCase();
    const validTypes = [
      'extension',
      'bathroom',
      'kitchen',
      'patio',
      'driveway',
      'conservatory',
      'roofing',
      'renovation',
    ];
    if (validTypes.includes(jobType)) {
      return jobType;
    }
  }

  // PRIORITY 2: Keyword-based detection (fallback for chat/free-form input)
  // Order matters - more specific matches first

  if (text.includes('bathroom') || text.includes('ensuite') || text.includes('shower room')) {
    return 'bathroom';
  }
  if (text.includes('kitchen') || text.includes('galley')) {
    return 'kitchen';
  }
  if (text.includes('driveway') || text.includes('tarmac') || text.includes('drop kerb')) {
    return 'driveway';
  }
  if (text.includes('patio') || text.includes('garden slabs') || text.includes('paving slabs')) {
    return 'patio';
  }
  if (text.includes('conservatory') || text.includes('orangery') || text.includes('sunroom')) {
    return 'conservatory';
  }
  if (text.includes('extension') || text.includes('loft conversion')) {
    return 'extension';
  }
  // Roofing - use specific terms to avoid conflicts with "tiling" or "roofing" as subtasks
  if (
    text.includes('re-roof') ||
    text.includes('roof repair') ||
    text.includes('roof replacement') ||
    text.includes('new roof') ||
    text.includes('flat roof') ||
    text.includes('pitched roof') ||
    (text.includes('roofing') && !text.includes('job type'))
  ) {
    return 'roofing';
  }
  if (
    text.includes('renovation') ||
    text.includes('refurbishment') ||
    text.includes('full house')
  ) {
    return 'renovation';
  }

  return 'general';
}
