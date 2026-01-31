/**
 * HTTP Client Timeout Enforcement Test
 * Tests: SEC-XXX (Outbound HTTP Call Timeout)
 * Ensures external HTTP calls don't hang indefinitely
 */

const nock = require('nock');
const httpClient = require('../../src/utils/httpClient');

describe('HTTP Client Timeout Enforcement Tests', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('SEC-XXX: Outbound HTTP Call Timeout', () => {
    it('should timeout requests that take longer than configured timeout', async () => {
      // Mock a slow endpoint that responds after 10 seconds
      nock('http://slow-service.com')
        .get('/slow-endpoint')
        .delay(10000) // 10 second delay
        .reply(200, { data: 'slow response' });

      const startTime = Date.now();

      await expect(
        httpClient.get('http://slow-service.com/slow-endpoint')
      ).rejects.toThrow('timeout');

      const duration = Date.now() - startTime;
      // Should timeout within reasonable time (less than 10s + some buffer)
      expect(duration).toBeLessThan(9000); // Should timeout around 8s
    });

    it('should respect HTTP_CLIENT_TIMEOUT_MS environment variable', async () => {
      // Temporarily set timeout to 2 seconds
      const originalTimeout = process.env.HTTP_CLIENT_TIMEOUT_MS;
      process.env.HTTP_CLIENT_TIMEOUT_MS = '2000';

      // Reload the httpClient module to pick up new env var
      delete require.cache[require.resolve('../../src/utils/httpClient')];
      const customHttpClient = require('../../src/utils/httpClient');

      // Mock endpoint with 3 second delay
      nock('http://test-service.com')
        .get('/test-endpoint')
        .delay(3000)
        .reply(200, { data: 'test' });

      const startTime = Date.now();

      await expect(
        customHttpClient.get('http://test-service.com/test-endpoint')
      ).rejects.toThrow('timeout');

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2500); // Should timeout around 2s

      // Restore original timeout
      process.env.HTTP_CLIENT_TIMEOUT_MS = originalTimeout;
    });

    it('should allow requests that complete within timeout', async () => {
      // Mock fast endpoint
      nock('http://fast-service.com')
        .get('/fast-endpoint')
        .delay(1000) // 1 second delay
        .reply(200, { data: 'fast response' });

      const response = await httpClient.get('http://fast-service.com/fast-endpoint');

      expect(response.status).toBe(200);
      expect(response.data.data).toBe('fast response');
    });

    it('should handle timeout errors gracefully', async () => {
      nock('http://timeout-service.com')
        .post('/timeout-endpoint')
        .delay(10000)
        .reply(200, { success: true });

      await expect(
        httpClient.post('http://timeout-service.com/timeout-endpoint', { test: 'data' })
      ).rejects.toThrow('timeout');
    });
  });
});