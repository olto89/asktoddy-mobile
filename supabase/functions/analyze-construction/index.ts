/**
 * PROPERLY STRUCTURED Analyze Construction Edge Function
 * Returns fully structured ProjectAnalysis - NO frontend parsing required
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

console.log('🏗️ STRUCTURED Analyze Construction Edge Function');

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
}

// Intelligent Gemini API call with smart retry logic
async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // Intelligent retry logic based on error types
  let retries = 1; // Only 1 retry for network/server errors
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

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
        throw error;
      }

      // Network errors - RETRY ONCE (might be transient)
      console.log('🔄 Network error, retrying once...');
      attempt++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error('Max retries exceeded');
}

// Parse structured AI response into ProjectAnalysis
function parseStructuredResponse(aiText: string, projectType: string): ProjectAnalysis {
  console.log('🔍 Parsing AI response...');

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
    const { message, sessionId, userId, analysisType, context, history } = await req.json();

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

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        status: 500,
        headers,
      });
    }

    console.log(`📝 Processing: ${message.substring(0, 100)}...`);

    // Extract project type from message
    const projectType = extractProjectType(message);

    // Use the detailed prompt directly from the frontend
    const analysisPrompt = message;

    // Call AI API
    const aiResponse = await callGemini(analysisPrompt, geminiApiKey);

    // Parse into structured ProjectAnalysis object
    const structuredAnalysis = parseStructuredResponse(aiResponse, projectType);
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
    console.error('Edge Function error:', error);

    // Return fallback structured response
    const fallbackAnalysis: ProjectAnalysis = {
      projectType: 'general',
      description: 'Fallback analysis due to AI service unavailability',
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

  if (text.includes('bathroom') || text.includes('ensuite') || text.includes('shower room')) {
    return 'bathroom';
  }
  if (text.includes('kitchen') || text.includes('galley')) {
    return 'kitchen';
  }
  if (
    text.includes('extension') ||
    text.includes('conservatory') ||
    text.includes('loft conversion')
  ) {
    return 'extension';
  }
  if (text.includes('roof') || text.includes('tiles') || text.includes('guttering')) {
    return 'roofing';
  }
  if (text.includes('renovation') || text.includes('refurbishment')) {
    return 'renovation';
  }

  return 'general';
}
