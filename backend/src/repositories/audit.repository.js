/**
 * Audit Repository
 * Data access layer for AuditLog model
 */

const BaseRepository = require('./base.repository');

class AuditRepository extends BaseRepository {
  constructor() {
    super('auditLog');
  }

  async findByEntity(entityType, entityId, options = {}) {
    return this.findManyWithCount(
      { entityType, entityId: parseInt(entityId) },
      {
        orderBy: { createdAt: 'desc' },
        ...options,
      }
    );
  }

  async findByUserId(userId, options = {}) {
    return this.findManyWithCount(
      { userId: parseInt(userId) },
      {
        orderBy: { createdAt: 'desc' },
        ...options,
      }
    );
  }
}

module.exports = new AuditRepository();
