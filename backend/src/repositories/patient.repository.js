/**
 * Patient Repository
 * Data access layer for Patient model
 */

const BaseRepository = require('./base.repository');

const PATIENT_LIST_INCLUDE = {
  user: {
    select: {
      fullName: true,
      email: true,
      phone: true,
      avatar: true,
      isActive: true,
      createdAt: true,
    },
  },
  _count: { select: { appointments: true } },
};

const PATIENT_DETAIL_INCLUDE = {
  user: {
    select: {
      fullName: true,
      email: true,
      phone: true,
      avatar: true,
      isActive: true,
    },
  },
  appointments: {
    include: {
      doctor: {
        include: {
          user: { select: { fullName: true } },
          specialty: { select: { name: true } },
        },
      },
      timeSlot: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  },
};

class PatientRepository extends BaseRepository {
  constructor() {
    super('patient');
  }

  async findByUserId(userId, options = {}) {
    return this.findUnique({ userId: parseInt(userId) }, options);
  }

  async findAllWithUser(filter = {}, options = {}) {
    return this.findManyWithCount(filter, {
      include: PATIENT_LIST_INCLUDE,
      orderBy: { createdAt: 'desc' },
      ...options,
    });
  }

  async findByIdWithDetails(id) {
    return this.findById(id, { include: PATIENT_DETAIL_INCLUDE });
  }

  async findByUserIdWithProfile(userId) {
    return this.findUnique(
      { userId: parseInt(userId) },
      {
        include: {
          user: { select: { fullName: true, email: true, phone: true, avatar: true } },
        },
      }
    );
  }
}

module.exports = new PatientRepository();
