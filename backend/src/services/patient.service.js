const prisma = require('../utils/prisma');

class PatientService {
  async getAllPatients(query) {
    const { search, page = 1, limit = 20 } = query;
    let filter = {};

    if (search) {
      filter.user = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ]
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where: filter,
        include: {
          user: { select: { fullName: true, email: true, phone: true, avatar: true, isActive: true, createdAt: true } },
          _count: { select: { appointments: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.patient.count({ where: filter })
    ]);

    return { patients, total };
  }

  async getPatientById(id) {
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { select: { fullName: true, email: true, phone: true, avatar: true, isActive: true } },
        appointments: {
          include: {
            doctor: { include: { user: { select: { fullName: true } }, specialty: { select: { name: true } } } },
            timeSlot: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }
      }
    });
    if (!patient) throw new Error('Không tìm thấy bệnh nhân');
    return patient;
  }

  async togglePatientStatus(id) {
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(id) },
      include: { user: true }
    });
    if (!patient) throw new Error('Không tìm thấy bệnh nhân');

    const updatedUser = await prisma.user.update({
      where: { id: patient.userId },
      data: { isActive: !patient.user.isActive }
    });

    return updatedUser;
  }

  async getProfile(userId) {
    const patient = await prisma.patient.findUnique({
      where: { userId: parseInt(userId) },
      include: {
        user: { select: { fullName: true, email: true, phone: true, avatar: true } }
      }
    });
    if (!patient) throw new Error('Không tìm thấy hồ sơ bệnh nhân');
    return patient;
  }

  async updateProfile(userId, data) {
    const { fullName, phone, dateOfBirth, gender, address, insuranceNumber, bloodType, allergies, medicalHistory } = data;

    // Tìm patient
    const patient = await prisma.patient.findUnique({ where: { userId: parseInt(userId) } });
    if (!patient) throw new Error('Không tìm thấy hồ sơ bệnh nhân');

    const result = await prisma.$transaction(async (tx) => {
      // Cập nhật User
      if (fullName || phone) {
        await tx.user.update({
          where: { id: parseInt(userId) },
          data: {
            fullName: fullName !== undefined ? fullName : undefined,
            phone: phone !== undefined ? phone : undefined,
          }
        });
      }

      // Cập nhật Patient
      const updatedPatient = await tx.patient.update({
        where: { userId: parseInt(userId) },
        data: {
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender: gender !== undefined ? gender : undefined,
          address: address !== undefined ? address : undefined,
          insuranceNumber: insuranceNumber !== undefined ? insuranceNumber : undefined,
          bloodType: bloodType !== undefined ? bloodType : undefined,
          allergies: allergies !== undefined ? allergies : undefined,
          medicalHistory: medicalHistory !== undefined ? medicalHistory : undefined,
        }
      });

      return updatedPatient;
    });

    return result;
  }
}

module.exports = new PatientService();
