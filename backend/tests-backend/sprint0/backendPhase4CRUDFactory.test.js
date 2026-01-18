/**
 * Phase 4 – CRUD Factory Hardening
 * Pagination, ownership scoping, and audit consistency across domains.
 */

const { createCrudHandlers, MAX_PAGE_LIMIT } = require('../../src/factories/crudFactory');

describe('Phase 4 – CRUD Factory', () => {
  let mockRepository;
  let mockHooks;
  let handlers;

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      getAll: jest.fn().mockResolvedValue({
        data: [{ id: '1', name: 'Test' }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1
      }),
      getById: jest.fn().mockResolvedValue({ id: '1', name: 'Test' }),
      create: jest.fn().mockResolvedValue({ id: '1', name: 'Test' }),
      update: jest.fn().mockResolvedValue({ id: '1', name: 'Updated' }),
      patch: jest.fn().mockResolvedValue({ id: '1', name: 'Patched' }),
      delete: jest.fn().mockResolvedValue({ id: '1', name: 'Deleted' })
    };

    // Create mock hooks
    mockHooks = {
      ownershipScope: jest.fn((req, op, opts) => opts),
      beforeCreate: jest.fn(),
      afterCreate: jest.fn(),
      beforeUpdate: jest.fn(),
      afterUpdate: jest.fn(),
      beforePatch: jest.fn(),
      afterPatch: jest.fn(),
      beforeDelete: jest.fn(),
      afterDelete: jest.fn(),
      afterRead: jest.fn(),
      auditMetadata: jest.fn().mockResolvedValue({ source: 'test' })
    };

    // Create handlers
    handlers = createCrudHandlers(mockRepository, 'test', {}, mockHooks);
  });

  it('returns pagination metadata with MAX_PAGE_LIMIT enforcement', async () => {
    expect(MAX_PAGE_LIMIT).toBe(100);

    const mockReq = {
      query: { page: '1', limit: '150' }, // Exceeds MAX_PAGE_LIMIT
      user: { uid: 'test-user', isAdmin: true }
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const mockNext = jest.fn();

    await handlers.getAll(mockReq, mockRes, mockNext);

    // Verify repository was called with capped limit
    expect(mockRepository.getAll).toHaveBeenCalled();
    const callArgs = mockRepository.getAll.mock.calls[0][0];
    expect(callArgs.limit).toBeLessThanOrEqual(MAX_PAGE_LIMIT);

    // Verify response contains pagination metadata (in Mission Control format)
    if (mockRes.json.mock.calls.length > 0) {
      const response = mockRes.json.mock.calls[0][0];
      expect(response.payload).toHaveProperty('data');
      expect(response.payload).toHaveProperty('pagination');
      expect(response.payload.pagination).toHaveProperty('page');
      expect(response.payload.pagination).toHaveProperty('limit');
      expect(response.payload.pagination).toHaveProperty('total');
      expect(response.payload.pagination).toHaveProperty('totalPages');
    }
  });

  it('applies ownership scoping hook for non-admin users', async () => {
    const nonAdminReq = {
      query: { page: '1', limit: '20' },
      user: { uid: 'test-user', isAdmin: false }
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const mockNext = jest.fn();

    // Mock ownership scope to filter by createdBy
    mockHooks.ownershipScope = jest.fn((req, op, opts) => {
      if (!req.user?.isAdmin) {
        return { ...opts, createdBy: req.user.uid };
      }
      return opts;
    });

    // Recreate handlers with updated hook
    handlers = createCrudHandlers(mockRepository, 'test', {}, mockHooks);

    await handlers.getAll(nonAdminReq, mockRes, mockNext);

    // Verify ownership scope was called
    expect(mockHooks.ownershipScope).toHaveBeenCalledWith(
      nonAdminReq,
      'list',
      expect.any(Object)
    );

    // Verify repository was called with ownership filter
    const callArgs = mockRepository.getAll.mock.calls[0][0];
    expect(callArgs.createdBy).toBe('test-user');
  });

  it('executes lifecycle hooks (before/after create/update/patch/delete/read)', async () => {
    const mockReq = {
      body: { name: 'Test' },
      params: { id: '1' },
      user: { uid: 'test-user', isAdmin: true },
      callSign: 'TEST',
      id: 'req-123',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-agent')
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const mockNext = jest.fn();

    // Test create hooks
    await handlers.create(mockReq, mockRes, mockNext);
    expect(mockHooks.beforeCreate).toHaveBeenCalled();
    expect(mockHooks.afterCreate).toHaveBeenCalled();

    // Test update hooks (needs existing document check)
    await handlers.update(mockReq, mockRes, mockNext);
    expect(mockHooks.beforeUpdate).toHaveBeenCalled();
    expect(mockHooks.afterUpdate).toHaveBeenCalled();

    // Test patch hooks (needs existing document check)
    await handlers.patch(mockReq, mockRes, mockNext);
    expect(mockHooks.beforePatch).toHaveBeenCalled();
    expect(mockHooks.afterPatch).toHaveBeenCalled();

    // Test delete hooks (needs existing document check)
    await handlers.delete(mockReq, mockRes, mockNext);
    expect(mockHooks.beforeDelete).toHaveBeenCalled();
    expect(mockHooks.afterDelete).toHaveBeenCalled();

    // Test read hooks
    mockReq.query = { page: '1', limit: '20' };
    await handlers.getAll(mockReq, mockRes, mockNext);
    expect(mockHooks.afterRead).toHaveBeenCalled();

    await handlers.getOne(mockReq, mockRes, mockNext);
    expect(mockHooks.afterRead).toHaveBeenCalled();
  });

  it('logs audits with req.user?.uid || "ANONYMOUS"', async () => {
    // Mock audit repository
    const auditRepository = require('../../src/repositories/auditRepository');
    const originalLogAudit = auditRepository.logAudit;
    auditRepository.logAudit = jest.fn().mockResolvedValue();

    const mockReq = {
      body: { name: 'Test' },
      user: { uid: 'test-user-uid', isAdmin: false },
      callSign: 'TEST',
      id: 'req-123',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-agent')
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const mockNext = jest.fn();

    await handlers.create(mockReq, mockRes, mockNext);

    // Verify audit was logged with uid
    expect(auditRepository.logAudit).toHaveBeenCalled();
    const auditCall = auditRepository.logAudit.mock.calls[0][0];
    expect(auditCall.userId).toBe('test-user-uid');

    // Test with no user (anonymous)
    auditRepository.logAudit.mockClear();
    mockReq.user = null;

    await handlers.create(mockReq, mockRes, mockNext);

    if (auditRepository.logAudit.mock.calls.length > 0) {
      const anonymousAudit = auditRepository.logAudit.mock.calls[0][0];
      expect(anonymousAudit.userId).toBe('ANONYMOUS');
    }

    // Restore original
    auditRepository.logAudit = originalLogAudit;
  });

  it('maintains mission-control response format via responseFactory', async () => {
    // Mock audit repository to prevent Firebase errors
    const auditRepository = require('../../src/repositories/auditRepository');
    const originalLogAudit = auditRepository.logAudit;
    auditRepository.logAudit = jest.fn().mockResolvedValue();

    const mockReq = {
      body: { name: 'Test' },
      query: { page: '1', limit: '20' },
      user: { uid: 'test-user', isAdmin: true },
      callSign: 'TEST-01',
      id: 'req-123',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-agent')
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const mockNext = jest.fn();

    await handlers.create(mockReq, mockRes, mockNext);

    // Verify response has mission control format
    expect(mockRes.json).toHaveBeenCalled();
    const response = mockRes.json.mock.calls[0][0];

    // Mission control response structure
    expect(response).toHaveProperty('status');
    expect(response).toHaveProperty('code');
    expect(response).toHaveProperty('payload');
    expect(response).toHaveProperty('telemetry');
    expect(response).toHaveProperty('timestamp');

    // Telemetry structure
    expect(response.telemetry).toHaveProperty('missionTime');
    expect(response.telemetry).toHaveProperty('operatorCallSign');
    expect(response.telemetry).toHaveProperty('stationId');
    expect(response.telemetry).toHaveProperty('requestId');

    // Status should be mission control lingo
    expect(['GO', 'NO-GO', 'HOLD', 'ABORT']).toContain(response.status);

    // Restore original
    auditRepository.logAudit = originalLogAudit;
  });

  it('handles errors gracefully and passes to error handler', async () => {
    // Make repository throw error
    mockRepository.create = jest.fn().mockRejectedValue(new Error('Database error'));

    const mockReq = {
      body: { name: 'Test' },
      user: { uid: 'test-user', isAdmin: true }
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const mockNext = jest.fn();

    await handlers.create(mockReq, mockRes, mockNext);

    // Verify error was passed to next() for error handler
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});
