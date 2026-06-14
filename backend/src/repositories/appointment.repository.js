/**
 * Appointment Repository
 * Data access layer for Appointment model
 */

const BaseRepository = require('./base.repository');

const APPOINTMENT_INCLUDE = {
  patient: {
    include: {
      user: { select: { id: true, fullName: true, phone: true, email: true, avatar: true } },
    },
  },
  doctor: {
    include: {
      user: { select: { id: true, fullName: true, avatar: true } },
      specialty: { select: { name: true } },
    },
  },
  timeSlot: true,
};

const APPOINTMENT_DETAIL_INCLUDE = {
  ...APPOINTMENT_INCLUDE,
  medicalRecord: true,
  review: true,
};

class AppointmentRepository extends BaseRepository {
  constructor() {
    super('appointment');
  }

  async findByIdWithRelations(id) {
    return this.findById(id, { include: APPOINTMENT_INCLUDE });
  }

  async findByIdWithDetails(id) {
    return this.findById(id, { include: APPOINTMENT_DETAIL_INCLUDE });
  }

  async findByPatientAndDoctorOnDate(patientId, doctorId, date, statuses, tx = null) {
    const model = tx ? tx.appointment : this.model;
    return model.findFirst({
      where: {
        patientId: parseInt(patientId),
        doctorId: parseInt(doctorId),
        appointmentDate: new Date(date),
        status: { in: statuses },
      },
    });
  }

  async findByPatientId(userId, filter = {}, options = {}) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId: parseInt(userId) },
    });
    if (!patient) return { data: [], total: 0, page: 1, limit: 20 };

    const where = { patientId: patient.id, ...filter };
    return this.findManyWithCount(where, {
      include: {
        doctor: {
          include: {
            user: { select: { fullName: true, avatar: true } },
            specialty: { select: { name: true } },
          },
        },
        timeSlot: true,
        medicalRecord: true,
      },
      orderBy: { appointmentDate: 'desc' },
      ...options,
    });
  }

  async countByStatusGrouped(doctorFilter = {}) {
    return this.groupBy({
      by: ['status'],
      where: doctorFilter,
      _count: { id: true },
    });
  }

  async countByDateRange(dateRange, doctorFilter = {}) {
    return this.groupBy({
      by: ['appointmentDate'],
      where: {
        appointmentDate: dateRange,
        ...doctorFilter,
      },
      _count: { id: true },
      orderBy: { appointmentDate: 'asc' },
    });
  }
}

module.exports = new AppointmentRepository();
