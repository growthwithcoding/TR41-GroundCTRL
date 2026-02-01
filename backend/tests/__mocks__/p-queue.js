/**
 * Mock for p-queue module
 * Used in Jest tests to avoid ES module import issues
 */

class MockPQueue {
  constructor(options = {}) {
    this.concurrency = options.concurrency || 1;
    this.intervalCap = options.intervalCap || Infinity;
    this.interval = options.interval || 0;
    this.size = 0;
    this.pending = 0;
    this.isPaused = false;
    this._listeners = {};
  }

  async add(fn, _options = {}) {
    // Simulate queue behavior - just execute immediately in tests
    this.pending++;
    this.size++;
    
    try {
      const result = await fn();
      this.pending--;
      this.size--;
      this._emit('idle');
      return result;
    } catch (error) {
      this.pending--;
      this.size--;
      this._emit('error', error);
      throw error;
    }
  }

  on(event, listener) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(listener);
  }

  _emit(event, ...args) {
    if (this._listeners[event]) {
      this._listeners[event].forEach(listener => listener(...args));
    }
  }

  pause() {
    this.isPaused = true;
  }

  start() {
    this.isPaused = false;
  }

  clear() {
    this.size = 0;
  }

  async onIdle() {
    // In tests, resolve immediately since we execute tasks immediately
    return Promise.resolve();
  }
}

module.exports = {
  default: MockPQueue,
};
