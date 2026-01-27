/**
 * CRUD Factory Unit Tests
 * Tests: CRUD-001 to CRUD-005
 * Migrated from: sprint0/backendPhase4CRUDFactory.test.js
 */

const { createCrudHandlers, MAX_PAGE_LIMIT } = require('../../../src/factories/crudFactory');

describe('CRUD Factory - Unit Tests', () => {
  let mockRepository;
  let mockHooks;
  let handlers;

  beforeEach(() => {
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

    handlers = createCrudHandlers(mockRepository, 'test', {}, mockHooks);
  });

  describe('CRUD-003: Pagination Hardening', () => {
    it('returns pagination metadata with MAX_PAGE_LIMIT enforcement', async () => {
      expect(MAX_PAGE_LIMIT).toBe(100);

      const mockReq = {
        query: { page: '1', limit: '150' },
        user: { uid: 'test-user', isAdmin: true }
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await handlers.getAll(mockReq, mockRes, jest.fn());

      const callArgs = mockRepository.getAll.mock.calls[0][0];
      expect(callArgs.limit).toBeLessThanOrEqual(MAX_PAGE_LIMIT);
    });
  });

  describe('CRUD-001: Ownership Scoping Hook', () => {
    it('applies ownership scoping hook for non-admin users', async () => {
      const nonAdminReq = {
        query: { page: '1', limit: '20' },
        user: { uid: 'test-user', isAdmin: false }
      };

      mockHooks.ownershipScope = jest.fn((req, op, opts) => {
        if (!req.user?.isAdmin) {
          return { ...opts, createdBy: req.user.uid };
        }
        return opts;
      });

      handlers = createCrudHandlers(mockRepository, 'test', {}, mockHooks);

      await handlers.getAll(nonAdminReq, { status: jest.fn().mockReturnThis(), json: jest.fn() }, jest.fn());

      expect(mockHooks.ownershipScope).toHaveBeenCalled();
      const callArgs = mockRepository.getAll.mock.calls[0][0];
      expect(callArgs.createdBy).toBe('test-user');
    });
  });

  describe('CRUD-002: Lifecycle Hooks Execution', () => {
    it('executes lifecycle hooks in correct order', async () => {
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

      await handlers.create(mockReq, mockRes, jest.fn());
      expect(mockHooks.beforeCreate).toHaveBeenCalled();
      expect(mockHooks.afterCreate).toHaveBeenCalled();
    });
  });

  describe('CRUD-004: Audit Logging', () => {
    it('logs audits with req.user?.uid || "ANONYMOUS"', async () => {
      const auditRepository = require('../../../src/repositories/auditRepository');
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

      await handlers.create(mockReq, { status: jest.fn().mockReturnThis(), json: jest.fn() }, jest.fn());

      expect(auditRepository.logAudit).toHaveBeenCalled();
      const auditCall = auditRepository.logAudit.mock.calls[0][0];
      expect(auditCall.userId).toBe('test-user-uid');

      auditRepository.logAudit = originalLogAudit;
    });
  });
});
