/**
 * MedicalRecord Repository
 * Data access layer for MedicalRecord model
 */

const BaseRepository = require('./base.repository');

class MedicalRecordRepository extends BaseRepository {
  constructor() {
    super('medicalRecord');
  }

  async findByAppointmentId(appointmentId, options = {}) {
    return this.findUnique(
      { appointmentId: parseInt(appointmentId) },
      {
        include: {
          appointment: {
            include: {
              patient: {
                include: { user: { select: { id: true, fullName: true } } },
              },
              doctor: {
                include: {
                  user: { select: { id: true, fullName: true } },
                  specialty: { select: { name: true } },
                },
              },
            },
          },
          prescriptions: true,
          attachments: true,
        },
        ...options,
      }
    );
  }
}

module.exports = new MedicalRecordRepository();
