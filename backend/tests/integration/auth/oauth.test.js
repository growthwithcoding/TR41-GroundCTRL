/**
 * OAuth Authentication Integration Tests
 * Tests: AUTH-OAUTH-001, AUTH-OAUTH-002, AUTH-OAUTH-003
 */

const request = require('supertest');

// Mock the firebase config before importing anything that uses it
jest.mock('../../../src/config/firebase', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
    getUser: jest.fn()
  })),
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ exists: false, data: () => ({}) })),
        set: jest.fn(() => Promise.resolve()),
        update: jest.fn(() => Promise.resolve()),
        id: 'test-doc-id'
      })),
      add: jest.fn(() => Promise.resolve({ id: 'test-doc-id' }))
    }))
  })),
  initializeFirebase: jest.fn()
}));

// Import the mocked functions
const { getAuth, getFirestore } = require('../../../src/config/firebase');

// Mock the firebase auth middleware
jest.mock('../../../src/middleware/firebaseAuthMiddleware', () => ({
  firebaseAuthMiddleware: jest.fn((req, res, next) => {
    // Mock successful authentication
    req.user = {
      uid: 'mock-oauth-user',
      email: 'oauth@example.com',
      emailVerified: true
    };
    next();
  })
}));

const { getTestApp } = require('../../helpers/test-utils');
const admin = require('firebase-admin');
const { firebaseAuthMiddleware } = require('../../../src/middleware/firebaseAuthMiddleware');

describe('OAuth Authentication - Integration Tests', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  describe('AUTH-OAUTH-001: Sync OAuth Profile - New User', () => {
    beforeEach(() => {
      // Reset all mocks
      jest.clearAllMocks();
      
      // Set up auth mock
      const authMock = {
        verifyIdToken: jest.fn(),
        getUser: jest.fn()
      };
      getAuth.mockReturnValue(authMock);
      
      // Set up firestore mock
      const firestoreMock = {
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({ exists: false, data: () => ({}) })),
            set: jest.fn(() => Promise.resolve()),
            update: jest.fn(() => Promise.resolve()),
            id: 'test-doc-id'
          })),
          add: jest.fn(() => Promise.resolve({ id: 'test-doc-id' }))
        }))
      };
      getFirestore.mockReturnValue(firestoreMock);
    });

    it('should create new user profile for OAuth authentication', async () => {
      // Mock the middleware to return specific user data
      firebaseAuthMiddleware.mockImplementationOnce((req, res, next) => {
        req.user = {
          uid: 'oauth-user-123',
          email: 'oauth@example.com',
          emailVerified: true
        };
        next();
      });

      // Mock getUser to return user data
      const authMock = getAuth();
      authMock.getUser.mockResolvedValueOnce({
        email: 'oauth@example.com',
        providerData: [{ providerId: 'google.com' }]
      });

      const response = await request(app)
        .post('/api/v1/auth/sync-oauth-profile')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.payload.signature')
        .send({
          displayName: 'OAuth User',
          photoURL: 'https://example.com/photo.jpg'
        })
        .expect(200);

      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('data');
      expect(response.body.payload.data).toHaveProperty('user');
      expect(response.body.payload.data.user).toHaveProperty('uid', 'oauth-user-123');
      expect(response.body.payload.data.user).toHaveProperty('email', 'oauth@example.com');
      expect(response.body.payload.data.user).toHaveProperty('displayName', 'OAuth User');
      expect(response.body.payload.data.user).toHaveProperty('callSign', 'OAuth User');
      expect(response.body.payload.data).toHaveProperty('accessToken');
      expect(response.body.payload.data).toHaveProperty('refreshToken');
    }, 60000);
  });

  describe('AUTH-OAUTH-002: Sync OAuth Profile - Existing User', () => {
    beforeEach(() => {
      // Reset all mocks
      jest.clearAllMocks();
      
      // Set up auth mock
      const authMock = {
        verifyIdToken: jest.fn(),
        getUser: jest.fn()
      };
      getAuth.mockReturnValue(authMock);
      
      // Set up firestore mock for existing user
      const userDocMock = {
        get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({ email: 'existing-oauth@example.com' }) })),
        set: jest.fn(() => Promise.resolve()),
        update: jest.fn(() => Promise.resolve()),
        id: 'existing-user-id'
      };
      
      const firestoreMock = {
        collection: jest.fn(() => ({
          doc: jest.fn(() => userDocMock),
          add: jest.fn(() => Promise.resolve({ id: 'test-doc-id' }))
        }))
      };
      getFirestore.mockReturnValue(firestoreMock);
    });

    it('should update existing user profile for OAuth authentication', async () => {
      // Mock the middleware to return the existing user's data
      firebaseAuthMiddleware.mockImplementationOnce((req, res, next) => {
        req.user = {
          uid: 'existing-user-id',
          email: 'existing-oauth@example.com',
          emailVerified: true
        };
        next();
      });

      // Mock getUser to return user data
      const authMock = getAuth();
      authMock.getUser.mockResolvedValueOnce({
        email: 'existing-oauth@example.com',
        providerData: [{ providerId: 'google.com' }]
      });

      const response = await request(app)
        .post('/api/v1/auth/sync-oauth-profile')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.payload.signature')
        .send({
          displayName: 'Updated OAuth User',
          photoURL: 'https://example.com/updated-photo.jpg'
        })
        .expect(200);

      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('data');
      expect(response.body.payload.data).toHaveProperty('user');
      expect(response.body.payload.data.user).toHaveProperty('uid', 'existing-user-id');
      expect(response.body.payload.data.user).toHaveProperty('email', 'existing-oauth@example.com');
      expect(response.body.payload.data).toHaveProperty('accessToken');
      expect(response.body.payload.data).toHaveProperty('refreshToken');
    }, 60000);
  });

  describe('AUTH-OAUTH-003: Sync OAuth Profile - Missing Authentication', () => {
    it('should reject request without valid Firebase token', async () => {
      // Mock the middleware to simulate auth failure
      firebaseAuthMiddleware.mockImplementationOnce((req, res, next) => {
        const AuthError = require('../../../src/utils/errors').AuthError;
        return next(new AuthError('Missing or invalid Authorization header', 401));
      });

      const response = await request(app)
        .post('/api/v1/auth/sync-oauth-profile')
        .send({
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg'
        })
        .expect(401);

      expect(response.body).toHaveProperty('status', 'NO-GO');
      expect(response.body.payload).toHaveProperty('error');
      expect(response.body.payload.error).toHaveProperty('message', 'Missing or invalid Authorization header');
    }, 60000);
  });
});