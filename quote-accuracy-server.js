#!/usr/bin/env node
/**
 * AskToddy Quote Accuracy POC - Real Quote Comparison
 * Upload PDF quotes and test AI accuracy against real costs
 * Access: http://localhost:3001
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');

// Load environment variables securely
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = 3001;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'quote-uploads');
const reportsDir = path.join(__dirname, 'accuracy-reports');

async function ensureDirectories() {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(reportsDir, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    cb(null, `quote-${timestamp}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'quote-poc')));
app.use('/uploads', express.static(uploadsDir));

// Configuration - server-side only
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://iezmuqawughmwsxlqrim.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imllem11cWF3dWdobXdzeGxxcmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODM5MzAsImV4cCI6MjA3NjU1OTkzMH0.SU0JdMUE-7aWAQJ1oq19dKZifw-qdUiLX9_JmOSOGO0';

// Validate environment
if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env.local');
  process.exit(1);
}

// Helper function for fallback estimates based on typical UK costs
function createFallbackReport(quoteId, quoteData, description) {
  // Basic cost estimates based on project type and description
  const lowerDesc = description.toLowerCase();
  let minCost = 10000;
  let maxCost = 20000;
  let projectType = quoteData.projectType || 'unknown';

  // Estimate based on keywords and project type
  if (lowerDesc.includes('conservatory')) {
    if (
      lowerDesc.includes('rebuild') ||
      lowerDesc.includes('overhaul') ||
      lowerDesc.includes('major')
    ) {
      minCost = 35000;
      maxCost = 65000;
    } else {
      minCost = 15000;
      maxCost = 35000;
    }
  } else if (projectType === 'extension' || lowerDesc.includes('extension')) {
    const sqmMatch = lowerDesc.match(/(\d+)\s*(?:sqm|m2|square|metres?)/);
    if (sqmMatch) {
      const sqm = parseInt(sqmMatch[1]);
      minCost = sqm * 1500; // £1500-2500 per sqm typical UK cost
      maxCost = sqm * 2500;
    } else {
      minCost = 30000;
      maxCost = 80000;
    }
  } else if (projectType === 'kitchen' || lowerDesc.includes('kitchen')) {
    minCost = 8000;
    maxCost = 25000;
  } else if (projectType === 'bathroom' || lowerDesc.includes('bathroom')) {
    minCost = 4000;
    maxCost = 12000;
  } else if (projectType === 'loft' || lowerDesc.includes('loft')) {
    minCost = 20000;
    maxCost = 60000;
  }

  // Adjust based on quality indicators
  if (
    lowerDesc.includes('premium') ||
    lowerDesc.includes('luxury') ||
    lowerDesc.includes('high-end')
  ) {
    minCost *= 1.5;
    maxCost *= 1.5;
  }

  // Check if VAT is mentioned
  const includesVat = lowerDesc.includes('vat') || lowerDesc.includes('including');
  if (!includesVat && quoteData.expectedTotal) {
    // Assume quote might be without VAT
    minCost *= 0.85;
    maxCost *= 1.15;
  }

  const realTotal = quoteData.expectedTotal;
  let accuracy = null;
  let variance = null;

  if (realTotal) {
    const aiMid = (minCost + maxCost) / 2;
    variance = ((aiMid - realTotal) / realTotal) * 100;
    accuracy = Math.max(0, 100 - Math.abs(variance));
  }

  return {
    quoteId,
    timestamp: new Date().toISOString(),
    source: 'Fallback Calculator (APIs Unavailable)',
    realQuote: {
      total: realTotal,
      description: description,
      projectType: projectType,
      filename: quoteData.originalName,
    },
    aiEstimate: {
      response: `Based on typical UK construction costs: This ${projectType} project would typically cost between £${minCost.toLocaleString()} - £${maxCost.toLocaleString()}. This is a fallback estimate as the AI services are currently unavailable.`,
      costRange: {
        min: Math.round(minCost),
        max: Math.round(maxCost),
      },
      confidence: 60, // Lower confidence for fallback
      source: 'Fallback Calculator',
    },
    comparison: {
      accuracy: accuracy ? accuracy.toFixed(1) + '%' : 'Unknown',
      variance: variance ? variance.toFixed(1) + '%' : 'Unknown',
      status: variance
        ? Math.abs(variance) <= 20
          ? 'Good'
          : Math.abs(variance) <= 40
            ? 'Moderate'
            : 'Poor'
        : 'Unknown',
    },
  };
}

// API Routes

// Upload and process PDF quote
app.post('/api/upload-quote', upload.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const { description, expectedTotal, projectType } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Project description is required' });
    }

    // Store quote details for processing
    const quoteData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      uploadTime: new Date().toISOString(),
      description,
      expectedTotal: expectedTotal ? parseFloat(expectedTotal) : null,
      projectType: projectType || 'unknown',
      filePath: req.file.path,
      fileSize: req.file.size,
    };

    // Save quote metadata
    const metadataPath = path.join(
      reportsDir,
      `${path.parse(req.file.filename).name}-metadata.json`
    );
    await fs.writeFile(metadataPath, JSON.stringify(quoteData, null, 2));

    res.json({
      success: true,
      quoteId: path.parse(req.file.filename).name,
      filename: req.file.filename,
      uploadedAt: quoteData.uploadTime,
      message: 'PDF quote uploaded successfully',
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate AI estimate for comparison
app.post('/api/generate-ai-estimate', async (req, res) => {
  const { quoteId, description } = req.body;

  if (!quoteId || !description) {
    return res.status(400).json({ error: 'Quote ID and description required' });
  }

  try {
    // Load quote metadata
    const metadataPath = path.join(reportsDir, `${quoteId}-metadata.json`);
    const quoteData = JSON.parse(await fs.readFile(metadataPath, 'utf8'));

    console.log(`🎯 Testing quote accuracy for: ${quoteData.originalName}`);
    console.log(`📝 Description: ${description.substring(0, 100)}...`);

    // Try Edge Function first, fallback to direct Gemini if rate limited
    let aiResult;
    let source = 'AskToddy Edge Function';

    try {
      // Get AI estimate via AskToddy Edge Function
      const sessionId = `accuracy_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-construction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          message: description,
          sessionId,
          analysisType: 'chat',
        }),
      });

      if (!response.ok) {
        throw new Error(`Edge Function failed: ${response.status}`);
      }

      aiResult = await response.json();
    } catch (edgeError) {
      console.log('⚠️ Edge Function failed, trying direct Gemini API with retry logic...');

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Fallback to direct Gemini API with retry logic for overloaded model
      const constructionPrompt = `You are a UK construction cost estimator. Analyze this project description and provide a realistic cost estimate.

Project: ${description}

Please provide:
1. A brief analysis of the project
2. A realistic total cost range for the UK market
3. Key cost factors to consider

Format your response to include cost ranges like £X,000 - £Y,000.

Keep your response concise but informative, focusing on realistic UK construction costs including materials, labor, and other typical expenses.`;

      let geminiResponse;
      let retries = 3;
      let delay = 3000; // Start with 3 second delay

      while (retries > 0) {
        try {
          geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [{ text: constructionPrompt }],
                  },
                ],
              }),
            }
          );

          if (geminiResponse.ok) {
            break; // Success!
          }

          const errorText = await geminiResponse.text();
          const errorData = JSON.parse(errorText);

          // Check if it's an overloaded error
          if (geminiResponse.status === 503 || errorData.error?.code === 503) {
            console.log(
              `⏳ Model overloaded, waiting ${delay / 1000}s before retry... (${retries} retries left)`
            );
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
            retries--;
            continue;
          }

          // If it's not an overloaded error, throw immediately
          throw new Error(errorText);
        } catch (fetchError) {
          if (retries === 0) {
            // Try one more time with a different model
            console.log('🔄 Trying alternative model gemini-1.5-flash...');
            geminiResponse = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [{ text: constructionPrompt }],
                    },
                  ],
                }),
              }
            );

            if (!geminiResponse.ok) {
              // Final fallback - return a mock estimate based on project type
              console.log('📊 Using fallback estimate calculation...');
              return res.json({
                success: true,
                report: createFallbackReport(quoteId, quoteData, description),
              });
            }
          } else {
            throw fetchError;
          }
        }
      }

      if (!geminiResponse || !geminiResponse.ok) {
        // Use fallback calculation
        console.log('📊 Using fallback estimate calculation...');
        return res.json({
          success: true,
          report: createFallbackReport(quoteId, quoteData, description),
        });
      }

      const geminiResult = await geminiResponse.json();
      const responseText =
        geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

      // Parse cost range from Gemini response
      const costMatch = responseText.match(/£([\d,]+)(?:\s*[-–]\s*£([\d,]+))?/g);
      let costBreakdown = null;

      if (costMatch) {
        const costs = costMatch.map(match => {
          const nums = match.match(/£([\d,]+)/g);
          return parseInt(nums[0].replace(/[£,]/g, ''));
        });

        costBreakdown = {
          totalCost: {
            min: Math.min(...costs),
            max: Math.max(...costs),
          },
        };
      }

      aiResult = {
        data: {
          response: responseText,
          costBreakdown: costBreakdown,
          confidence: 75, // Moderate confidence for direct API
        },
      };
      source = 'Direct Gemini API (Fallback)';
    }

    // Calculate accuracy comparison
    const aiEstimate = aiResult.data?.costBreakdown?.totalCost;
    const realTotal = quoteData.expectedTotal;

    let accuracy = null;
    let variance = null;

    if (realTotal && aiEstimate) {
      const aiMid = (aiEstimate.min + aiEstimate.max) / 2;
      variance = ((aiMid - realTotal) / realTotal) * 100;
      accuracy = Math.max(0, 100 - Math.abs(variance));
    }

    // Create accuracy report
    const accuracyReport = {
      quoteId,
      timestamp: new Date().toISOString(),
      source: source,
      realQuote: {
        total: realTotal,
        description: description,
        projectType: quoteData.projectType,
        filename: quoteData.originalName,
      },
      aiEstimate: {
        response: aiResult.data?.response || aiResult.response,
        costRange: aiEstimate,
        confidence: aiResult.data?.confidence,
        source: source,
      },
      comparison: {
        accuracy: accuracy ? accuracy.toFixed(1) + '%' : 'Unknown',
        variance: variance ? variance.toFixed(1) + '%' : 'Unknown',
        status: variance
          ? Math.abs(variance) <= 20
            ? 'Good'
            : Math.abs(variance) <= 40
              ? 'Moderate'
              : 'Poor'
          : 'Unknown',
      },
    };

    // Save accuracy report
    const reportPath = path.join(reportsDir, `${quoteId}-accuracy-report.json`);
    await fs.writeFile(reportPath, JSON.stringify(accuracyReport, null, 2));

    res.json({
      success: true,
      report: accuracyReport,
    });
  } catch (error) {
    console.error('AI estimation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get list of uploaded quotes
app.get('/api/quotes', async (req, res) => {
  try {
    const files = await fs.readdir(reportsDir);
    const metadataFiles = files.filter(f => f.endsWith('-metadata.json'));

    const quotes = [];
    for (const file of metadataFiles) {
      const filePath = path.join(reportsDir, file);
      const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
      const quoteId = path.parse(file).name.replace('-metadata', '');

      // Check if accuracy report exists
      const reportPath = path.join(reportsDir, `${quoteId}-accuracy-report.json`);
      let hasReport = false;
      try {
        await fs.access(reportPath);
        hasReport = true;
      } catch {}

      quotes.push({
        quoteId,
        ...data,
        hasAccuracyReport: hasReport,
      });
    }

    quotes.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));

    res.json({ quotes });
  } catch (error) {
    console.error('Error listing quotes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get accuracy report
app.get('/api/accuracy-report/:quoteId', async (req, res) => {
  try {
    const { quoteId } = req.params;
    const reportPath = path.join(reportsDir, `${quoteId}-accuracy-report.json`);

    const reportData = await fs.readFile(reportPath, 'utf8');
    const report = JSON.parse(reportData);

    res.json({ report });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Accuracy report not found' });
    } else {
      console.error('Error reading report:', error);
      res.status(500).json({ error: error.message });
    }
  }
});

// Get server status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    purpose: 'Quote Accuracy Testing',
    geminiConfigured: !!GEMINI_API_KEY,
    supabaseUrl: SUPABASE_URL,
    uploadsDirectory: uploadsDir,
    reportsDirectory: reportsDir,
    timestamp: new Date().toISOString(),
  });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'quote-poc', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum 10MB allowed.' });
    }
  }
  console.error('Server error:', err);
  res.status(500).json({ error: err.message });
});

// Start server
async function startServer() {
  await ensureDirectories();

  app.listen(PORT, () => {
    console.log('🎯 AskToddy Quote Accuracy POC');
    console.log('=====================================');
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📁 Uploads: ${uploadsDir}`);
    console.log(`📊 Reports: ${reportsDir}`);
    console.log(`🔑 API Key: ${GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log('=====================================');
    console.log('💡 Upload PDF quotes to test AI accuracy');
  });
}

startServer();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down quote accuracy server...');
  process.exit(0);
});
