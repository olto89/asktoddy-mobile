#!/usr/bin/env node
/**
 * AskToddy Quote Accuracy POC - Local Web Server
 * Secure localhost testing with environment variables
 * Access: http://localhost:3001
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

// Load environment variables securely
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'web-poc')));

// Configuration - server-side only
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://iezmuqawughmwsxlqrim.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imllem11cWF3dWdobXdzeGxxcmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODM5MzAsImV4cCI6MjA3NjU1OTkzMH0.SU0JdMUE-7aWAQJ1oq19dKZifw-qdUiLX9_JmOSOGO0';

// Validate environment
if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env.local');
  console.error('💡 Create a .env.local file with: GEMINI_API_KEY=your_key_here');
  process.exit(1);
}

// API Routes

// Test direct Gemini API
app.post('/api/test-gemini', async (req, res) => {
  const { message } = req.body;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: message }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error: `Gemini API error: ${error}` });
    }

    const result = await response.json();
    const quote = result.candidates?.[0]?.content?.parts?.[0]?.text;

    res.json({
      success: true,
      source: 'Gemini Direct API',
      response: quote,
      model: 'gemini-2.5-flash',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test AskToddy Edge Function
app.post('/api/test-edge-function', async (req, res) => {
  const { message } = req.body;
  const sessionId = `poc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-construction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        message,
        sessionId,
        analysisType: 'chat',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error: `Edge Function error: ${error}` });
    }

    const result = await response.json();

    res.json({
      success: true,
      source: 'AskToddy Edge Function',
      response: result.data?.response || result.response,
      costBreakdown: result.data?.costBreakdown,
      confidence: result.data?.confidence,
      sessionId: sessionId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get server status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    environment: 'development',
    geminiConfigured: !!GEMINI_API_KEY,
    supabaseUrl: SUPABASE_URL,
    timestamp: new Date().toISOString(),
  });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web-poc', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 AskToddy Quote POC Server Started');
  console.log('=====================================');
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🔑 API Key: ${GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`📡 Supabase: ${SUPABASE_URL}`);
  console.log('=====================================');
  console.log('💡 Open http://localhost:3001 in your browser');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down POC server...');
  process.exit(0);
});
