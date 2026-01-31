/**
 * HTTP Client Timeout Config Override Test
 * Tests: SEC-XXX (Timeout Configuration Override)
 * Verifies CI/test environment timeout overrides work
 */

const httpClient = require('../../src/utils/httpClient');

describe('HTTP Client Timeout Config Override Tests', () => {
  describe('SEC-XXX: Timeout Configuration Override', () => {
    it('should use default timeout when no env var set', () => {
      // The httpClient is created with default timeout
      expect(httpClient.defaults.timeout).toBe(8000);
    });

    it('should respect HTTP_CLIENT_TIMEOUT_MS environment variable', () => {
      // Temporarily set timeout
      const originalTimeout = process.env.HTTP_CLIENT_TIMEOUT_MS;
      process.env.HTTP_CLIENT_TIMEOUT_MS = '5000';

      // Reload the module to pick up new env var
      delete require.cache[require.resolve('../../src/utils/httpClient')];
      const customHttpClient = require('../../src/utils/httpClient');

      expect(customHttpClient.defaults.timeout).toBe(5000);

      // Restore original
      process.env.HTTP_CLIENT_TIMEOUT_MS = originalTimeout;
    });

    it('should handle invalid timeout values gracefully', () => {
      const originalTimeout = process.env.HTTP_CLIENT_TIMEOUT_MS;
      process.env.HTTP_CLIENT_TIMEOUT_MS = 'invalid';

      delete require.cache[require.resolve('../../src/utils/httpClient')];
      const customHttpClient = require('../../src/utils/httpClient');

      // Should fall back to default
      expect(customHttpClient.defaults.timeout).toBe(8000);

      process.env.HTTP_CLIENT_TIMEOUT_MS = originalTimeout;
    });

    it('should apply timeout to actual requests', async () => {
      const nock = require('nock');

      // Mock a slow endpoint
      nock('http://timeout-test.com')
        .get('/slow')
        .delay(3000) // 3 seconds
        .reply(200, { data: 'ok' });

      const startTime = Date.now();

      // Set short timeout
      const originalTimeout = process.env.HTTP_CLIENT_TIMEOUT_MS;
      process.env.HTTP_CLIENT_TIMEOUT_MS = '1000'; // 1 second

      delete require.cache[require.resolve('../../src/utils/httpClient')];
      const customHttpClient = require('../../src/utils/httpClient');

      await expect(
        customHttpClient.get('http://timeout-test.com/slow')
      ).rejects.toThrow('timeout');

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1500); // Should timeout around 1s

      process.env.HTTP_CLIENT_TIMEOUT_MS = originalTimeout;
      nock.cleanAll();
    });
  });
});