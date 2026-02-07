/**
 * Global Test Setup
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';

// Suppress verbose logging in tests to reduce output truncation
process.env.LOG_LEVEL = 'error';

// Always set emulator hosts for test environment (required for Firebase config validation)
// Even though we use mocks, some tests validate these environment variables
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_EMULATOR_HUB = '127.0.0.1:4400';

process.env.JWT_SECRET = 'test-secret-key-for-testing-only-do-not-use-in-production';
process.env.FIREBASE_WEB_API_KEY = 'test-firebase-web-api-key'; // Mock API key for testing

// Configure rate limits for testing - much more lenient to avoid test failures
// Use shorter windows and REASONABLE limits (reduced to prevent socket exhaustion in tests)
process.env.LOGIN_RATE_LIMIT_WINDOW_MS = '1000'; // 1 second
process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS = '1000'; // 1000 requests per second
process.env.AUTH_RATE_LIMIT_WINDOW_MS = '1000'; // 1 second
process.env.AUTH_RATE_LIMIT_MAX_REQUESTS = '1000'; // 1000 requests per second
process.env.API_RATE_LIMIT_WINDOW_MS = '1000'; // 1 second
process.env.API_RATE_LIMIT_MAX_REQUESTS = '1000'; // 1000 requests per second
process.env.HELP_AI_RATE_LIMIT_WINDOW_MS = '1000'; // 1 second
process.env.HELP_AI_RATE_LIMIT_MAX_REQUESTS = '1000'; // 1000 requests per second (increased for concurrent tests)

// Store auth users in global scope BEFORE mocks (jest.mock is hoisted)
// This must be initialized before jest.mock() calls
global.mockAuthUsers = global.mockAuthUsers || new Map(); // email -> { uid, email, password }

// Stateful mock storage for Firestore collections
const mockDataStore = {
  users: new Map(),
  satellites: new Map(),
  scenarios: new Map(),
  commands: new Map(),
  token_blacklist: new Map(),
  audit_logs: new Map()
};

// Create mock Firestore collection structure
const createMockCollection = (collectionName) => {
  const store = mockDataStore[collectionName] || new Map();
  
  return {
    doc: jest.fn((docId) => ({
      set: jest.fn().mockImplementation(async (data) => {
        store.set(docId, { ...data, id: docId });
        return Promise.resolve();
      }),
      get: jest.fn().mockImplementation(async () => {
        const data = store.get(docId);
        return Promise.resolve({
          exists: !!data,
          id: docId,
          data: () => data || { 
            uid: 'test-uid', 
            email: 'test@example.com',
            id: docId || 'test-doc-id',
            name: 'Test Satellite'
          }
        });
      }),
      delete: jest.fn().mockImplementation(async () => {
        store.delete(docId);
        return Promise.resolve();
      }),
      update: jest.fn().mockImplementation(async (updates) => {
        const existing = store.get(docId);
        if (existing) {
          store.set(docId, { ...existing, ...updates });
        }
        return Promise.resolve();
      })
    })),
    get: jest.fn().mockImplementation(async function() {
      let docs = Array.from(store.values());
      
      // Apply where filters if any exist
      if (this._whereFilters && this._whereFilters.length > 0) {
        docs = docs.filter(data => {
          return this._whereFilters.every(filter => {
            const { field, op, value } = filter;
            const dataValue = data[field];
            
            switch (op) {
            case '==':
              return dataValue === value;
            case '>=':
              return dataValue >= value;
            case '<=':
              return dataValue <= value;
            case '>':
              return dataValue > value;
            case '<':
              return dataValue < value;
            case '!=':
              return dataValue !== value;
            default:
              return true;
            }
          });
        });
      }
      
      // Apply limit if specified
      if (this._limit) {
        docs = docs.slice(0, this._limit);
      }
      
      const docSnapshots = docs.map(data => ({
        id: data.id,
        data: () => data,
        exists: true
      }));
      
      return Promise.resolve({
        docs: docSnapshots,
        empty: docSnapshots.length === 0,
        size: docSnapshots.length,
        forEach: (callback) => docSnapshots.forEach(callback)
      });
    }),
    where: jest.fn(function(field, op, value) { 
      this._whereFilters = this._whereFilters || [];
      this._whereFilters.push({ field, op, value });
      return this; 
    }),
    orderBy: jest.fn(function() { return this; }),
    limit: jest.fn(function(n) { 
      this._limit = n;
      return this; 
    }),
    add: jest.fn().mockImplementation(async (data) => {
      const id = 'test-doc-id-' + Date.now() + '-' + require('crypto').randomBytes(6).toString('hex');
      store.set(id, { ...data, id });
      return Promise.resolve({ id });
    })
  };
};

// Mock firebase-admin
const mockFirestore = () => ({
  settings: jest.fn(),
  collection: (collectionName) => createMockCollection(collectionName)
});

// Add FieldValue as a property on the function
mockFirestore.FieldValue = {
  serverTimestamp: jest.fn(() => new Date()),
  delete: jest.fn(),
  increment: jest.fn((n) => n),
  arrayUnion: jest.fn((...elements) => elements),
  arrayRemove: jest.fn((...elements) => elements)
};

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  apps: [{ name: '[DEFAULT]' }], // Mock apps array for admin.apps.length checks
  auth: () => ({
    createUser: jest.fn().mockImplementation(async (params) => {
      const email = params?.email || 'test@example.com';
      
      // Check for duplicate email
      if (global.mockAuthUsers.has(email)) {
        const error = new Error('The email address is already in use by another account.');
        error.code = 'auth/email-already-exists';
        throw error;
      }
      
      const uid = 'test-uid-' + Date.now() + '-' + require('crypto').randomBytes(6).toString('hex');
      const user = {
        uid,
        email,
        password: params?.password // Store plain password for simple testing
      };
      
      global.mockAuthUsers.set(email, user);
      return Promise.resolve({ uid, email });
    }),
    getUserByEmail: jest.fn().mockImplementation(async (email) => {
      const user = global.mockAuthUsers.get(email);
      if (!user) {
        const error = new Error('There is no user record corresponding to this identifier.');
        error.code = 'auth/user-not-found';
        throw error;
      }
      return Promise.resolve({
        uid: user.uid,
        email: user.email
      });
    }),
    deleteUser: jest.fn().mockImplementation(async (uid) => {
      // Find and remove user by uid
      for (const [email, user] of global.mockAuthUsers.entries()) {
        if (user.uid === uid) {
          global.mockAuthUsers.delete(email);
          break;
        }
      }
      return Promise.resolve();
    }),
    createCustomToken: jest.fn().mockResolvedValue('mock-jwt-token'),
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: 'test-uid',
      email: 'test@example.com'
    })
  }),
  firestore: mockFirestore,
  credential: {
    cert: jest.fn()
  }
}));

// Suppress console logs during tests (optional)
if (process.env.SUPPRESS_TEST_LOGS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Set longer timeout for all tests - Firebase emulator operations can be slow
jest.setTimeout(60000); // Increase to 60s for Firebase emulator operations
