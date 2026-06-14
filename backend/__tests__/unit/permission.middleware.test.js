/**
 * Permission Middleware — Unit Tests
 */

const { requirePermission, requireAnyPermission } = require('../../src/middleware/permission.middleware');

describe('Permission Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('requirePermission', () => {
    it('should return 401 if user not authenticated', () => {
      const middleware = requirePermission('appointment.create');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow PATIENT to create appointment', () => {
      req.user = { id: 1, role: 'PATIENT' };
      const middleware = requirePermission('appointment.create');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny DOCTOR from creating appointment', () => {
      req.user = { id: 1, role: 'DOCTOR' };
      const middleware = requirePermission('appointment.create');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow ADMIN to manage specialty', () => {
      req.user = { id: 1, role: 'ADMIN' };
      const middleware = requirePermission('specialty.manage');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny PATIENT from managing specialty', () => {
      req.user = { id: 1, role: 'PATIENT' };
      const middleware = requirePermission('specialty.manage');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireAnyPermission', () => {
    it('should allow if user has any of the required permissions', () => {
      req.user = { id: 1, role: 'DOCTOR' };
      const middleware = requireAnyPermission('appointment.create', 'appointment.view_all');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny if user has none of the permissions', () => {
      req.user = { id: 1, role: 'PATIENT' };
      const middleware = requireAnyPermission('doctor.create', 'doctor.delete');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
