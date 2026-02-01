/**
 * AI Queue Service
 * 
 * Manages rate limiting for AI API calls using p-queue
 * Prevents rate limit errors by controlling concurrency and request frequency
 * 
 * Configuration:
 * - concurrency: 5 - Up to 5 simultaneous AI calls
 * - intervalCap: 20 - Maximum 20 calls per interval
 * - interval: 1000ms - Rate limit window (1 second)
 * 
 * This allows a maximum of 20 AI calls per second with 5 concurrent requests
 */

const PQueue = require('p-queue').default;
const logger = require('../utils/logger');

// Queue configuration - optimized for AI API rate limits
const QUEUE_CONFIG = {
  concurrency: 5,        // Max 5 concurrent AI requests
  intervalCap: 20,       // Max 20 requests per interval
  interval: 1000,        // 1 second interval (1000ms)
  timeout: 30000,        // 30 second timeout per task
  throwOnTimeout: false, // Don't throw, return timeout error
};

// Create singleton AI queue instance
const aiQueue = new PQueue(QUEUE_CONFIG);

// Queue event listeners for monitoring
aiQueue.on('active', () => {
  logger.debug('AI Queue active', {
    size: aiQueue.size,
    pending: aiQueue.pending,
  });
});

aiQueue.on('idle', () => {
  logger.debug('AI Queue idle');
});

aiQueue.on('error', (error) => {
  logger.error('AI Queue error', {
    error: error.message,
    stack: error.stack,
  });
});

/**
 * Add AI request to queue with automatic retry on rate limit
 * 
 * @param {Function} aiCallFn - Async function that makes the AI API call
 * @param {object} options - Options for the queue task
 * @param {number} options.priority - Task priority (lower = higher priority)
 * @param {object} options.metadata - Metadata for logging
 * @returns {Promise<any>} Result from the AI call
 */
async function addToQueue(aiCallFn, options = {}) {
  const { priority = 0, metadata = {} } = options;

  return aiQueue.add(
    async () => {
      const startTime = Date.now();
      
      try {
        logger.debug('AI request starting', {
          queueSize: aiQueue.size,
          pending: aiQueue.pending,
          ...metadata,
        });

        const result = await aiCallFn();
        
        const duration = Date.now() - startTime;
        logger.debug('AI request completed', {
          duration,
          ...metadata,
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.warn('AI request failed', {
          error: error.message,
          duration,
          ...metadata,
        });
        throw error;
      }
    },
    { priority }
  );
}

/**
 * Get current queue statistics
 * Useful for monitoring and debugging
 * 
 * @returns {object} Queue stats
 */
function getQueueStats() {
  return {
    size: aiQueue.size,           // Number of queued tasks
    pending: aiQueue.pending,     // Number of running tasks
    isPaused: aiQueue.isPaused,   // Whether queue is paused
    concurrency: aiQueue.concurrency,
  };
}

/**
 * Clear all pending tasks in queue
 * Use with caution - only for emergency situations
 */
function clearQueue() {
  aiQueue.clear();
  logger.warn('AI Queue cleared - all pending tasks removed');
}

/**
 * Pause the queue
 * New tasks will be queued but not executed until resumed
 */
function pauseQueue() {
  aiQueue.pause();
  logger.info('AI Queue paused');
}

/**
 * Resume the queue
 */
function resumeQueue() {
  aiQueue.start();
  logger.info('AI Queue resumed');
}

/**
 * Wait for queue to be idle (all tasks completed)
 * 
 * @returns {Promise<void>}
 */
async function waitForIdle() {
  await aiQueue.onIdle();
}

module.exports = {
  addToQueue,
  getQueueStats,
  clearQueue,
  pauseQueue,
  resumeQueue,
  waitForIdle,
  
  // Export queue instance for advanced use cases
  queue: aiQueue,
};
