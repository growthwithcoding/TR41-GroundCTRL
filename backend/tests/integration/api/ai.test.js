/**
 * AI/NOVA Integration Tests
 * Tests: AI-001, AI-002, AI-003, AI-004
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('AI/NOVA - Integration Tests', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  describe('AI-001: NOVA Help Endpoint - Input Validation', () => {
    it('accepts valid help question', async () => {
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .send({
          content: 'How do I deploy the antenna?',
          context: 'help'
        })
        .expect(201);

      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('data');
      expect(response.body.payload.data).toHaveProperty('message');
      expect(response.body.payload.data.message).toHaveProperty('content');
    });

    it('rejects empty content', async () => {
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .send({
          content: '',
          context: 'help'
        })
        .expect(400);

      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('error');
      expect(response.body.payload.error.message).toBe('Validation failed');
      expect(response.body.payload.error.details).toBeDefined();
      expect(Array.isArray(response.body.payload.error.details)).toBe(true);
      expect(response.body.payload.error.details).toHaveLength(1);
      expect(response.body.payload.error.details[0].field).toBe('body.content');
      expect(response.body.payload.error.details[0].message).toBe('Question content is required');
    });

    it('rejects content over 1000 characters', async () => {
      const longContent = 'a'.repeat(1001);
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .send({
          content: longContent,
          context: 'help'
        })
        .expect(400);

      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('error');
    });

    it('rejects content with script tags', async () => {
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .send({
          content: 'Help me <script>alert("xss")</script>',
          context: 'help'
        })
        .expect(400);

      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('error');
    });

    it('rejects content with iframe tags', async () => {
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .send({
          content: 'Help me <iframe src="evil.com"></iframe>',
          context: 'help'
        })
        .expect(400);

      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('error');
    });

    it('rejects content with event handlers', async () => {
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .send({
          content: 'Help me <div onclick="evil()">click</div>',
          context: 'help'
        })
        .expect(400);

      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('error');
    });
  });

  describe('AI-002: NOVA Help Endpoint - Fallback Handling', () => {
    it('returns fallback response on timeout', async () => {
      // Mock the novaService to simulate timeout
      const originalGenerateHelpResponse = require('../../../src/services/novaService').generateHelpResponse;
      require('../../../src/services/novaService').generateHelpResponse = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          content: 'Mock response',
          conversationId: 'test-conv',
          userId: 'anonymous'
        }), 9000)) // Longer than timeout
      );

      const response = await request(app)
        .post('/api/v1/ai/chat')
        .send({
          content: 'How do I calibrate sensors?',
          context: 'help'
        })
        .expect(201);

      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('data');
      expect(response.body.payload.data.message).toHaveProperty('is_fallback', true);
      expect(response.body.payload.data.message.content).toContain('STANDBY');

      // Restore original function
      require('../../../src/services/novaService').generateHelpResponse = originalGenerateHelpResponse;
    });

    it('handles GEMINI_API_KEY configuration gracefully', async () => {
      // Test with missing API key (should fallback)
      const originalApiKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      const response = await request(app)
        .post('/api/v1/ai/chat')
        .send({
          content: 'What is the mission status?',
          context: 'help'
        })
        .expect(201);

      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload.data.message).toHaveProperty('is_fallback', true);

      // Restore API key
      process.env.GEMINI_API_KEY = originalApiKey;
    });
  });

  describe('AI-003: NOVA Help Endpoint - Context Handling', () => {
    it('accepts simulator context', async () => {
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .send({
          content: 'How do I execute orbital maneuver?',
          context: 'simulator'
        })
        .expect(201);

      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('data');
    });

    it('defaults to help context when not specified', async () => {
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .send({
          content: 'What commands are available?'
        })
        .expect(201);

      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('data');
    });

    it('supports conversationId for multi-turn chat', async () => {
      const conversationId = 'test-conversation-123';

      const response = await request(app)
        .post('/api/v1/ai/chat')
        .send({
          content: 'Tell me more about that',
          conversationId: conversationId
        })
        .expect(201);

      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload.data).toHaveProperty('conversation_id');
    });
  });

  describe('AI-004: NOVA Help Endpoint - Rate Limiting', () => {
    it('respects help AI rate limits', async () => {
      // Make multiple requests quickly to test rate limiting
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(app)
            .post('/api/v1/ai/chat')
            .send({
              content: `Question ${i}`,
              context: 'help'
            })
        );
      }

      const responses = await Promise.all(requests);

      // At least one should succeed, and some may be rate limited
      const successCount = responses.filter(r => r.status === 201).length;
      const rateLimitCount = responses.filter(r => r.status === 429).length;

      expect(successCount + rateLimitCount).toBe(5);
      expect(successCount).toBeGreaterThan(0);
    });
  });
});