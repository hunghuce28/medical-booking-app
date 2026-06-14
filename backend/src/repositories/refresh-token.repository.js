/**
 * RefreshToken Repository
 * Data access layer for RefreshToken model
 */

const BaseRepository = require('./base.repository');

class RefreshTokenRepository extends BaseRepository {
  constructor() {
    super('refreshToken');
  }

  async findByToken(token) {
    return this.findUnique({ token });
  }

  async findActiveByUser(userId) {
    return this.findMany(
      {
        userId: parseInt(userId),
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          device: true,
          ipAddress: true,
          createdAt: true,
          expiresAt: true,
        },
      }
    );
  }

  async revokeByToken(token) {
    return this.updateWhere({ token }, { isRevoked: true });
  }

  async revokeAllByUser(userId) {
    return this.updateMany(
      { userId: parseInt(userId), isRevoked: false },
      { isRevoked: true }
    );
  }

  async deleteExpired() {
    const prisma = require('../utils/prisma');
    return prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}

module.exports = new RefreshTokenRepository();
