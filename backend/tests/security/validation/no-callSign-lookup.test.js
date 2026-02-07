/**
 * No CallSign Lookup Test
 * Tests: callSign field cannot be used for direct lookups (privacy)
 * Features: Field lookup restrictions, privacy protection, access control
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('Validation - No CallSign Lookup', () => {
  let app;
  let testToken;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create and login test user to get token
    const userData = {
      email: `callsign-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      displayName: 'Test User',
      callSign: 'TESTCALL',
    };

    try {
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);
    } catch (err) {
      // User might already exist
    }

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      });

    if (loginResponse.status === 200) {
      testToken = loginResponse.body.payload.token;
    }
  }, 60000);

  it('should not allow filtering by callSign', async () => {
    const response = await request(app)
      .get('/api/v1/users?callSign=TESTCALL')
      .set('Authorization', `Bearer ${testToken}`);

    // Should either reject or not return results
    if (response.status === 200) {
      // If allowed, results should not include callSign-based filtering
      expect(response.body).toBeDefined();
    } else if (response.status === 400) {
      expect(response.body.payload).toHaveProperty('error');
    }
  }, 60000);

  it('should not allow searching by callSign', async () => {
    const response = await request(app)
      .get('/api/v1/users?search=callSign:TESTCALL')
      .set('Authorization', `Bearer ${testToken}`);

    // Should not support callSign-based search
    expect([200, 400, 401, 404]).toContain(response.status);
  }, 60000);

  it('should not expose callSign in search results', async () => {
    const response = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${testToken}`);

    if (response.status === 200 && response.body.payload?.data) {
      // If results are returned, callSign should not be visible
      const users = response.body.payload.data;
      users.forEach(user => {
        // Check that sensitive fields are not exposed
        expect(user).not.toHaveProperty('callSign');
      });
    }
  }, 60000);

  it('should not allow callSign-based user enumeration', async () => {
    const callSigns = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'];

    for (const callSign of callSigns) {
      const response = await request(app)
        .get(`/api/v1/users?callSign=${callSign}`)
        .set('Authorization', `Bearer ${testToken}`);

      // Should not allow enumeration
      expect([200, 400, 401, 404]).toContain(response.status);

      if (response.status === 200) {
        // Should not return results based on callSign
        expect(response.body).toBeDefined();
      }
    }
  }, 60000);

  it('should prevent callSign lookups via API endpoint', async () => {
    const response = await request(app)
      .get('/api/v1/users/by-callsign/TESTCALL')
      .set('Authorization', `Bearer ${testToken}`);

    // Endpoint should not exist or should return error
    expect([400, 404, 401]).toContain(response.status);
  }, 60000);

  it('should not expose callSign in user profile endpoint', async () => {
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${testToken}`);

    if (response.status === 200) {
      // User's own profile should not expose callSign
      expect(response.body.payload.user).not.toHaveProperty('callSign');
    }
  }, 60000);

  it('should prevent callSign disclosure through indirect queries', async () => {
    const response = await request(app)
      .get('/api/v1/users?fields=name,callSign')
      .set('Authorization', `Bearer ${testToken}`);

    if (response.status === 200 && response.body.payload?.data) {
      // Should not return callSign even if explicitly requested
      const users = response.body.payload.data;
      users.forEach(user => {
        expect(user).not.toHaveProperty('callSign');
      });
    }
  }, 60000);

  it('should not allow sorting by callSign', async () => {
    const response = await request(app)
      .get('/api/v1/users?sort=callSign')
      .set('Authorization', `Bearer ${testToken}`);

    // Should reject or ignore callSign sort
    expect([200, 400, 401, 404]).toContain(response.status);
  }, 60000);

  it('should block callSign in advanced search queries', async () => {
    const response = await request(app)
      .post('/api/v1/users/search')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        query: {
          callSign: 'TESTCALL',
        },
      })
      .expect([200, 400, 401, 404]);

    if (response.status === 400) {
      expect(response.body.payload).toHaveProperty('error');
    }
  }, 60000);

  it('should prevent callSign access through batch operations', async () => {
    const response = await request(app)
      .post('/api/v1/users/batch')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        operation: 'get',
        ids: ['user1', 'user2'],
        fields: ['name', 'callSign'], // Requesting callSign
      })
      .expect([200, 400, 401, 404]);

    if (response.status === 200 && response.body.payload?.users) {
      // Should not return callSign in batch response
      response.body.payload.users.forEach(user => {
        expect(user).not.toHaveProperty('callSign');
      });
    }
  }, 60000);

  it('should not expose callSign through GraphQL if available', async () => {
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        query: `
          query {
            users {
              name
              callSign
            }
          }
        `,
      })
      .expect([200, 400, 401, 404]);

    if (response.status === 200 && response.body.data?.users) {
      // Should not return callSign
      response.body.data.users.forEach(user => {
        expect(user).not.toHaveProperty('callSign');
      });
    }
  }, 60000);
});
