#!/usr/bin/env node
/**
 * AskToddy Quote Accuracy POC V2 - With PDF Content Analysis
 * Actually reads PDF content and sends it to AI for analysis
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

// Extract text from PDF using pdf-parse
async function extractPDFText(filepath) {
  try {
    const pdf = require('pdf-parse');
    const dataBuffer = await fs.readFile(filepath);
    const data = await pdf(dataBuffer);

    console.log(
      `📄 PDF extraction successful - ${data.numpages} pages, ${data.text.length} characters`
    );
    return data.text;
  } catch (error) {
    console.error('❌ PDF extraction error:', error.message);
    return null;
  }
}

// Smart estimate based on project description and type
function calculateSmartEstimate(description, projectType) {
  const lowerDesc = description.toLowerCase();
  let minCost = 10000;
  let maxCost = 20000;
  let reasoning = '';

  // Estimate based on keywords and project type
  if (lowerDesc.includes('conservatory')) {
    if (
      lowerDesc.includes('rebuild') ||
      lowerDesc.includes('overhaul') ||
      lowerDesc.includes('major') ||
      lowerDesc.includes('extensive')
    ) {
      minCost = 35000;
      maxCost = 65000;
      reasoning =
        'Major conservatory overhaul including structural work and new roof typically costs £35k-65k in the UK market.';
    } else {
      minCost = 15000;
      maxCost = 35000;
      reasoning = 'Standard conservatory renovation typically costs £15k-35k in the UK market.';
    }
  } else if (projectType === 'extension' || lowerDesc.includes('extension')) {
    const sqmMatch = lowerDesc.match(/(\d+)\s*(?:sqm|m2|square|metres?)/);
    if (sqmMatch) {
      const sqm = parseInt(sqmMatch[1]);
      minCost = sqm * 1500; // £1500-2500 per sqm typical UK cost
      maxCost = sqm * 2500;
      reasoning = `Extension of ${sqm}m² at typical UK rates of £1,500-2,500 per m².`;
    } else {
      minCost = 30000;
      maxCost = 80000;
      reasoning = 'Typical single-storey extension costs £30k-80k in the UK.';
    }
  } else if (projectType === 'kitchen' || lowerDesc.includes('kitchen')) {
    minCost = 8000;
    maxCost = 25000;
    reasoning = 'Kitchen renovation typically costs £8k-25k depending on size and specification.';
  } else if (projectType === 'bathroom' || lowerDesc.includes('bathroom')) {
    minCost = 4000;
    maxCost = 12000;
    reasoning = 'Bathroom renovation typically costs £4k-12k depending on size and specification.';
  } else if (projectType === 'loft' || lowerDesc.includes('loft')) {
    minCost = 20000;
    maxCost = 60000;
    reasoning =
      'Loft conversion typically costs £20k-60k depending on complexity and dormer requirements.';
  }

  // Adjust based on quality indicators
  if (
    lowerDesc.includes('premium') ||
    lowerDesc.includes('luxury') ||
    lowerDesc.includes('high-end')
  ) {
    minCost *= 1.4;
    maxCost *= 1.6;
    reasoning += ' Premium specification adds 40-60% to typical costs.';
  }

  // Check for specific mentions that increase cost
  if (lowerDesc.includes('structural') || lowerDesc.includes('steel')) {
    minCost *= 1.2;
    maxCost *= 1.3;
    reasoning += ' Structural work increases costs by 20-30%.';
  }

  // Check if VAT is mentioned
  const includesVat = lowerDesc.includes('vat') || lowerDesc.includes('including vat');
  if (includesVat) {
    reasoning += ' Prices include VAT.';
  } else {
    reasoning += ' Prices may be subject to VAT.';
  }

  return {
    minCost: Math.round(minCost),
    maxCost: Math.round(maxCost),
    reasoning,
  };
}

// Clean sensitive data from PDF text (remove totals that might give away the answer)
function cleanPDFTextForAI(text, expectedTotal) {
  let cleanedText = text;

  // Remove the exact total if it appears in the text
  if (expectedTotal) {
    const totalStr = expectedTotal.toString();
    const totalWithCommas = expectedTotal.toLocaleString();
    const variations = [
      totalStr,
      totalWithCommas,
      `£${totalStr}`,
      `£${totalWithCommas}`,
      `${totalStr}.00`,
      `£${totalStr}.00`,
    ];

    variations.forEach(variant => {
      // Replace total with [REDACTED] to prevent backward working
      cleanedText = cleanedText.replace(
        new RegExp(variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
        '[TOTAL_REDACTED]'
      );
    });
  }

  // Also remove any obvious grand total lines
  cleanedText = cleanedText.replace(
    /(?:grand\s+)?total[\s:]*£?[\d,]+\.?\d*/gi,
    'TOTAL: [REDACTED]'
  );
  cleanedText = cleanedText.replace(
    /(?:sub\s*)?total[\s:]*£?[\d,]+\.?\d*/gi,
    'SUBTOTAL: [REDACTED]'
  );

  // Limit text to reasonable size for API (keep first 4000 chars of actual content)
  if (cleanedText.length > 4000) {
    cleanedText =
      cleanedText.substring(0, 4000) + '\n\n[... PDF continues with more line items ...]';
  }

  return cleanedText;
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

    // Extract PDF text content
    const pdfText = await extractPDFText(req.file.path);

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
      pdfExtracted: !!pdfText,
      pdfTextLength: pdfText ? pdfText.length : 0,
    };

    // Save quote metadata with PDF content (cleaned)
    const metadataPath = path.join(
      reportsDir,
      `${path.parse(req.file.filename).name}-metadata.json`
    );
    const pdfContentPath = path.join(
      reportsDir,
      `${path.parse(req.file.filename).name}-content.txt`
    );

    await fs.writeFile(metadataPath, JSON.stringify(quoteData, null, 2));

    if (pdfText) {
      // Save cleaned PDF text for AI analysis
      const cleanedText = cleanPDFTextForAI(pdfText, expectedTotal);
      await fs.writeFile(pdfContentPath, cleanedText);
      console.log(
        `📄 Extracted ${pdfText.length} characters from PDF (cleaned to ${cleanedText.length})`
      );
    }

    res.json({
      success: true,
      quoteId: path.parse(req.file.filename).name,
      filename: req.file.filename,
      uploadedAt: quoteData.uploadTime,
      pdfExtracted: quoteData.pdfExtracted,
      message: pdfText
        ? 'PDF quote uploaded and content extracted successfully'
        : 'PDF uploaded but content extraction failed',
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate AI estimate for comparison - now with PDF content analysis
app.post('/api/generate-ai-estimate', async (req, res) => {
  const { quoteId, description } = req.body;

  if (!quoteId || !description) {
    return res.status(400).json({ error: 'Quote ID and description required' });
  }

  try {
    // Load quote metadata and PDF content
    const metadataPath = path.join(reportsDir, `${quoteId}-metadata.json`);
    const pdfContentPath = path.join(reportsDir, `${quoteId}-content.txt`);

    const quoteData = JSON.parse(await fs.readFile(metadataPath, 'utf8'));

    // Try to load extracted PDF content
    let pdfContent = null;
    try {
      pdfContent = await fs.readFile(pdfContentPath, 'utf8');
      console.log(`📄 Using extracted PDF content (${pdfContent.length} chars) for AI analysis`);
    } catch (error) {
      console.log('⚠️ No PDF content found, using description only');
    }

    console.log(`🎯 Testing quote accuracy for: ${quoteData.originalName}`);
    console.log(`📝 Description: ${description.substring(0, 100)}...`);

    // Create AI prompt that analyzes the actual PDF content
    const analysisPrompt = pdfContent
      ? `You are a UK construction cost estimator. Analyze this actual construction quote and provide your own independent cost estimate.

IMPORTANT: Do NOT look for or use any total figures in the quote. Calculate your own estimate based on the line items and work described.

PROJECT DESCRIPTION PROVIDED BY USER:
${description}

ACTUAL QUOTE CONTENT (with totals redacted):
${pdfContent}

Based on the line items, materials, and labor described in this quote, provide:
1. Your independent cost estimate range for this project
2. Brief breakdown of major cost categories you identified
3. Assessment of whether this seems reasonable for UK market rates

Format your cost estimate as: £X,000 - £Y,000

Remember: Calculate costs based on the work described, NOT any totals you might see.`
      : `You are a UK construction cost estimator. Based on this project description, provide a realistic cost estimate.

Project: ${description}

Please provide:
1. A realistic total cost range for the UK market
2. Brief breakdown of expected cost categories
3. Key factors affecting the price

Format your response to include cost ranges like £X,000 - £Y,000.`;

    let aiResult;
    let source = 'AI Analysis';

    // Try to get AI analysis with retry logic
    let retries = 3;
    let delay = 2000;

    while (retries > 0) {
      try {
        console.log(
          `🤖 Sending ${pdfContent ? 'PDF content' : 'description'} to AI for analysis...`
        );

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: analysisPrompt }],
                },
              ],
            }),
          }
        );

        if (geminiResponse.ok) {
          const geminiResult = await geminiResponse.json();
          const responseText =
            geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

          // Parse cost range from response - look for final estimate ranges
          let costBreakdown = null;

          // Look for explicit range patterns like "£X,000 - £Y,000" or "£X to £Y"
          const rangeMatch = responseText.match(/£([\d,]+)\s*(?:[-–]|to)\s*£([\d,]+)/);
          if (rangeMatch) {
            const min = parseInt(rangeMatch[1].replace(/[£,]/g, ''));
            const max = parseInt(rangeMatch[2].replace(/[£,]/g, ''));
            costBreakdown = {
              totalCost: { min, max },
            };
          } else {
            // If no range found, look for single total estimate
            const singleMatch = responseText.match(/(?:total|estimate)[\s\w]*:?\s*£([\d,]+)/i);
            if (singleMatch) {
              const amount = parseInt(singleMatch[1].replace(/[£,]/g, ''));
              costBreakdown = {
                totalCost: { min: amount * 0.9, max: amount * 1.1 }, // ±10% range
              };
            }
          }

          aiResult = {
            response: responseText,
            costBreakdown: costBreakdown,
            confidence: pdfContent ? 85 : 70, // Higher confidence when analyzing actual PDF
            source: pdfContent ? 'PDF Content Analysis' : 'Description Analysis',
          };

          source = pdfContent ? 'Gemini PDF Analysis' : 'Gemini Description Analysis';
          break;
        }

        // Handle errors with retry
        const errorText = await geminiResponse.text();
        console.log(
          `⚠️ AI error: ${geminiResponse.status} - ${errorText.substring(0, 200)}, retrying in ${delay / 1000}s...`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        retries--;
      } catch (error) {
        console.error('AI request error:', error);
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        }
      }
    }

    if (!aiResult) {
      // Use smart fallback calculation
      console.log('🔄 Using smart fallback calculation due to API quota limits...');

      const fallbackEstimate = calculateSmartEstimate(description, quoteData.projectType);

      aiResult = {
        response: `Smart Analysis (API unavailable): Based on the project description, this appears to be a ${quoteData.projectType || 'construction'} project. ${fallbackEstimate.reasoning}`,
        costBreakdown: {
          totalCost: {
            min: fallbackEstimate.minCost,
            max: fallbackEstimate.maxCost,
          },
        },
        confidence: 70,
        source: 'Smart Fallback Calculator',
      };

      source = 'Smart Fallback (API Quota Exceeded)';
    }

    // Calculate accuracy comparison
    const aiEstimate = aiResult.costBreakdown?.totalCost;
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
      pdfAnalyzed: !!pdfContent,
      realQuote: {
        total: realTotal,
        description: description,
        projectType: quoteData.projectType,
        filename: quoteData.originalName,
        pdfContentUsed: !!pdfContent,
      },
      aiEstimate: {
        response: aiResult.response,
        costRange: aiEstimate,
        confidence: aiResult.confidence,
        source: aiResult.source,
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
    purpose: 'Quote Accuracy Testing with PDF Analysis',
    version: '2.0',
    geminiConfigured: !!GEMINI_API_KEY,
    supabaseUrl: SUPABASE_URL,
    uploadsDirectory: uploadsDir,
    reportsDirectory: reportsDir,
    features: ['PDF content extraction', 'Total redaction', 'Line item analysis'],
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
    console.log('🎯 AskToddy Quote Accuracy POC V2');
    console.log('=====================================');
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📄 PDF Analysis: ENABLED`);
    console.log(`🔒 Total Redaction: ACTIVE`);
    console.log(`📁 Uploads: ${uploadsDir}`);
    console.log(`📊 Reports: ${reportsDir}`);
    console.log(`🔑 API Key: ${GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log('=====================================');
    console.log('💡 Now analyzing actual PDF content!');
  });
}

startServer();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down quote accuracy server...');
  process.exit(0);
});
