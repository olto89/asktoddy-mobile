# 🌐 AskToddy Web POC - Quote Accuracy Testing

A secure localhost web interface for testing AskToddy's quote accuracy without API key leaks.

## 🚀 Quick Start

1. **Set up environment variables:**

   ```bash
   # Create .env.local file with your keys
   echo "GEMINI_API_KEY=your_api_key_here" > .env.local
   ```

2. **Start the POC server:**

   ```bash
   npm run poc:start
   ```

3. **Open in browser:**
   ```
   http://localhost:3001
   ```

## 🧪 Testing Features

### Direct Gemini API Test

- Tests Gemini API directly for basic responses
- Uses `gemini-2.5-flash` model
- Simple quote estimation without pricing engine

### AskToddy Edge Function Test

- Tests the complete mobile backend
- Uses Supabase Edge Functions with pricing engine
- Returns structured cost breakdowns with confidence scores
- Session management and contextual memory

### Test Presets

- **Bathroom Renovation**: 3m x 2.5m standard bathroom
- **Kitchen Renovation**: 4m x 3m standard kitchen
- **Rear Extension**: 25m² single storey extension

## 🔒 Security Features

- ✅ **Environment Variables**: API keys loaded server-side only
- ✅ **No Git Exposure**: `.env.local` in .gitignore
- ✅ **Localhost Only**: Server binds to localhost:3001
- ✅ **No Client Keys**: Frontend never sees API credentials

## 📊 What You'll See

### Successful Test Results

- **Source**: Which system provided the response
- **Response**: AI-generated quote and analysis
- **Cost Breakdown**: Structured pricing (Edge Function only)
- **Confidence Score**: Accuracy percentage (Edge Function only)
- **Timestamp**: When the test was run

### Error Handling

- Clear error messages for API failures
- Connection status indicators
- Detailed error logging for debugging

## 🔧 Server API Endpoints

- `GET /api/status` - Server and API configuration status
- `POST /api/test-gemini` - Direct Gemini API test
- `POST /api/test-edge-function` - AskToddy Edge Function test

## 💡 Usage Tips

1. **Real Queries**: Use realistic construction queries for best results
2. **Compare Results**: Test both API endpoints to compare responses
3. **Quote Accuracy**: Edge Function provides more accurate UK pricing
4. **Session IDs**: Each Edge Function test creates a unique session

## 🛠️ Troubleshooting

### "Missing API Key" Error

```bash
# Check your .env.local file exists and has:
GEMINI_API_KEY=your_actual_api_key_here
```

### "Server Disconnected" Status

```bash
# Restart the server
npm run poc:start
```

### Edge Function Errors

- Check your Supabase environment is running
- Verify the staging URL is correct
- Ensure Edge Functions are deployed

## 📁 File Structure

```
web-poc/
├── index.html          # Main testing interface
├── README.md           # This documentation
web-poc-server.js       # Express server with API routes
test-quote-poc-secure.js # Command line version
```

---

**🎯 Perfect for rapid quote accuracy testing without mobile app overhead!**
