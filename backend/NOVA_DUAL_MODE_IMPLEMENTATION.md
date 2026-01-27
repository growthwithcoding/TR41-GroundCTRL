# NOVA AI Dual-Mode Implementation

## Overview

NOVA AI now supports two operational modes:
1. **Authenticated Mode** - Training scenarios with full session tracking
2. **Public Help Mode** - Anonymous help queries without authentication required

## Architecture

### Authenticated Mode (Training)
- **Endpoints**: `/ai/messages`, `/ai/conversations/:session_id`, etc.
- **Authentication**: Required (`authMiddleware`)
- **Use Case**: Users working through training scenarios with sessions
- **Features**:
  - Full session context (scenario, steps, commands)
  - Progress tracking and hints counter
  - Tied to user account
  - Command result integration

### Public Help Mode (New)
- **Endpoint**: `/ai/help/ask`
- **Authentication**: Optional (`optionalAuth`)
- **Use Case**: Anyone can ask help questions without login
- **Features**:
  - Anonymous user tracking (generates `anon_<uuid>`)
  - Help article/FAQ context integration
  - Multi-turn conversations via `conversationId`
  - All conversations stored for AI training
  - Stricter rate limiting (20 req/5min vs 100 req/15min)

## Implementation Files

### New Files Created
1. **`backend/src/utils/anonymousId.js`** - Anonymous user ID generation utilities
   - `generateAnonymousId()` - Creates `anon_<uuid>` for anonymous users
   - `generateHelpSessionId()` - Creates `help_sess_<uuid>` for help conversations
   - `isAnonymousId()` - Checks if user ID is anonymous
   - `isHelpSession()` - Checks if session is help-based

### Modified Files

#### 1. `backend/src/config/rateLimits.js`
- Added `helpAiLimit` configuration (20 requests per 5 minutes)

#### 2. `backend/src/schemas/novaSchemas.js`
- Added `askHelpQuestionSchema` for public help endpoint validation
- Validates: content (required, 1-1000 chars), context (optional), conversationId (optional)

#### 3. `backend/src/services/novaService.js`
- Added `buildHelpAwarePrompt()` - Formats prompts with help articles/FAQs context
- Added `fetchHelpContext()` - Searches help articles and FAQs relevant to user question
- Added `generateHelpResponse()` - Main function for public help responses
- Integrates with `helpArticleRepository` and `helpFaqRepository`

#### 4. `backend/src/controllers/novaController.js`
- Added `askHelpQuestion()` controller method
- Handles anonymous users (userId will be null or authenticated)
- Returns conversationId for multi-turn chat continuity

#### 5. `backend/src/routes/ai.js`
- Added `POST /ai/help/ask` route
- Uses `optionalAuth` middleware (allows both authenticated and anonymous)
- Uses `helpAiLimit` rate limiter
- Swagger documentation included

## API Endpoint

### POST /ai/help/ask

**Public endpoint - No authentication required**

#### Request Body
```json
{
  "content": "How do I deploy solar arrays on a satellite?",
  "context": "solar-array-deployment",  // Optional: help article slug
  "conversationId": "help_sess_abc123"   // Optional: for multi-turn chat
}
```

#### Response
```json
{
  "missionControl": {
    "status": "GO",
    "message": "Help response generated",
    "callSign": "GUEST",
    "timestamp": "2026-01-22T17:30:00.000Z"
  },
  "payload": {
    "data": {
      "message": {
        "role": "assistant",
        "content": "To deploy solar arrays on a satellite...",
        "is_fallback": false
      },
      "conversationId": "help_sess_xyz789",
      "userId": "anon_abc123"
    }
  }
}
```

## Data Storage

### Database Storage Strategy
- All help messages stored in `ai_messages` collection
- Tagged with `session_id` format: `help_sess_<uuid>`
- Metadata includes:
  - `message_type: "HELP"` (vs "TRAINING")
  - `article_context`: Referenced help article slug
  - `model`: AI model used
  - `articles_referenced`: Count of help articles in context
  - `faqs_referenced`: Count of FAQs in context

### Anonymous User Tracking
- Format: `anon_<uuid>` (e.g., `anon_550e8400-e29b-41d4-a716-446655440000`)
- Stored with all messages for analytics
- Can be upgraded to real user if they log in later

## Help Context Integration

NOVA now searches and integrates:
1. **Help Articles** - Searches by keywords (top 3 results)
2. **FAQs** - Filters by question/answer/tags (top 3 results)
3. **Specific Article** - If `context` parameter provided with article slug
4. **Conversation History** - Previous messages in same conversationId

## Rate Limiting

### Authenticated Users (Training)
- 100 requests per 15 minutes

### Anonymous Users (Help)
- 20 requests per 5 minutes (stricter)
- IP-based tracking recommended for abuse prevention

## Security Considerations

1. **Optional Authentication**: `optionalAuth` middleware attaches user info if present but doesn't require it
2. **Rate Limiting**: Stricter limits for anonymous users prevent abuse
3. **Input Validation**: All inputs validated via Zod schemas
4. **Data Privacy**: Anonymous IDs don't contain PII
5. **Token Monitoring**: Track Gemini API usage per user type

## Frontend Integration (Future)

When implementing UI:
```javascript
// Anonymous user flow
const response = await fetch('/api/ai/help/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: userQuestion,
    conversationId: localStorage.getItem('helpConversationId') // For continuity
  })
});

const data = await response.json();
// Store conversationId for multi-turn
localStorage.setItem('helpConversationId', data.payload.data.conversationId);
```

## Benefits

1. ✅ **Accessibility**: Help available to all users, logged in or not
2. ✅ **Data Collection**: All conversations stored for AI training/improvement
3. ✅ **Context-Rich**: Help articles and FAQs provide relevant information to NOVA
4. ✅ **Progressive Enhancement**: Anonymous users can upgrade to authenticated
5. ✅ **Analytics Ready**: Track what help topics need improvement
6. ✅ **Abuse Prevention**: Rate limiting controls while allowing genuine users
7. ✅ **Multi-Turn Support**: Conversation continuity via conversationId

## Testing

### Test Anonymous Help Query
```bash
curl -X POST http://localhost:3000/api/ai/help/ask \
  -H "Content-Type: application/json" \
  -d '{"content": "How do I deploy solar arrays?"}'
```

### Test with Authenticated User
```bash
curl -X POST http://localhost:3000/api/ai/help/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"content": "How do I deploy solar arrays?"}'
```

### Test Multi-Turn Conversation
```bash
# First message
curl -X POST http://localhost:3000/api/ai/help/ask \
  -H "Content-Type: application/json" \
  -d '{"content": "What is orbital altitude?"}'
# Save conversationId from response

# Follow-up message
curl -X POST http://localhost:3000/api/ai/help/ask \
  -H "Content-Type: application/json" \
  -d '{
    "content": "How do I adjust it?",
    "conversationId": "help_sess_xyz789"
  }'
```

## Future Enhancements

1. **IP-based Rate Limiting**: More sophisticated abuse prevention
2. **Conversation Analytics**: Dashboard for popular help topics
3. **Anonymous → Authenticated Migration**: Link conversations when user logs in
4. **Help Article Feedback Loop**: Use NOVA queries to improve help content
5. **Suggested Articles**: Return related help articles with NOVA response
6. **Browser Fingerprinting**: Better anonymous user tracking
7. **Cache Layer**: Cache common help responses for performance

## Troubleshooting

### Issue: Rate limit exceeded
- **Solution**: Wait 5 minutes or authenticate for higher limits

### Issue: No help articles in context
- **Solution**: Ensure help articles are seeded in database with `PUBLISHED` status

### Issue: NOVA returns fallback response
- **Solution**: Check `GEMINI_API_KEY` is configured in `.env`

### Issue: Line ending errors (CRLF vs LF)
- **Solution**: Configure VS Code to use LF line endings or run: `git config core.autocrlf false`

## Summary

NOVA AI now operates in two modes seamlessly:
- **Training Mode**: Full authentication, session-based, scenario context
- **Help Mode**: Public access, anonymous support, help article context

Both modes store all conversations for continuous AI improvement, while maintaining appropriate security and rate limiting based on user authentication status.
