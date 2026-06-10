# API Usage Tracking & Cost Management

## Gemini API Free Tier Limits (December 2024)

### Current Configuration

- **Model**: gemini-2.0-flash-latest
- **Free Tier**: 200 requests per day
- **Reset Time**: Midnight Pacific Time (8 AM UK)

### Testing Budget

- **Target**: 20-30 quotes per day
- **Free Allowance**: 200 requests/day
- **Buffer**: 170+ requests remaining

### Usage Monitoring

#### Daily Testing Log

| Date  | Requests | Status          | Notes           |
| ----- | -------- | --------------- | --------------- |
| Dec 5 | TBD      | ✅ Within Limit | Initial testing |
| Dec 6 | -        | -               | -               |
| Dec 7 | -        | -               | -               |

### Cost Prevention Strategies

1. **Development Testing** (Free)
   - Use staging environment only
   - Max 30 tests per day
   - Monitor daily usage

2. **Beta Testing** (Free)
   - Limit beta users to 5-10
   - Each user: 2-3 quotes/day max
   - Total: ~30 requests/day

3. **Production Launch** (Paid)
   - After Jan 1, 2025
   - Budget: $15-30/month initially
   - Scale with user growth

### API Key Monitoring

#### Check Current Usage

```bash
# Check today's usage (implement tracking)
curl -X GET "https://generativelanguage.googleapis.com/v1/models?key=YOUR_API_KEY"
```

#### Rate Limiting in App

- Implement user quotas: 5 quotes/day free tier
- Show remaining quota in app
- Reset at midnight Pacific

### Warning Thresholds

- **150 requests**: Yellow alert (75% used)
- **180 requests**: Orange alert (90% used)
- **190 requests**: Red alert - stop testing

### Emergency Fallback

If approaching limit:

1. Switch to mock data for remaining tests
2. Use cached responses for demos
3. Wait for midnight Pacific reset

### Cost Projections

#### Testing Phase (Dec 2024)

- **Cost**: $0 (free tier)
- **Usage**: 30 requests/day max

#### Beta Phase (Dec 2024)

- **Cost**: $0 (free tier)
- **Usage**: 50-100 requests/day

#### Launch Phase (Jan 2025)

- **100 users**: ~$5/month
- **500 users**: ~$25/month
- **1000 users**: ~$50/month

### Optimization Tips

1. **Cache Responses**
   - Store common quotes
   - Reuse for similar requests
   - 24-hour cache duration

2. **Batch Testing**
   - Group similar tests
   - Use one session for multiple variations
   - Avoid duplicate requests

3. **Smart Routing**
   - Simple questions: Use cached responses
   - Complex only: Hit API
   - Implement response caching

### Monitoring Commands

```bash
# Check daily usage (to implement)
npm run api:usage

# Check remaining quota
npm run api:quota

# Reset counter (midnight Pacific)
npm run api:reset
```

---

_Last Updated: December 5, 2024_
_Free Tier Status: Active ✅_
