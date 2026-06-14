/**
 * User Repository
 * Data access layer for User model
 */

const BaseRepository = require('./base.repository');

class UserRepository extends BaseRepository {
  constructor() {
    super('user');
  }

  async findByEmail(email, options = {}) {
    return this.findUnique({ email }, options);
  }

  async findByIdWithProfile(id) {
    return this.findById(id, {
      include: {
        doctor: {
          include: { specialty: { select: { name: true, icon: true } } },
        },
        patient: true,
      },
    });
  }

  async findByIdWithDoctor(id) {
    return this.findById(id, {
      include: {
        doctor: {
          include: {
            user: { select: { fullName: true } },
            specialty: { select: { name: true, icon: true } },
          },
        },
      },
    });
  }
}

module.exports = new UserRepository();
