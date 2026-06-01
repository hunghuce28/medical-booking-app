const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const doctor = await prisma.doctor.findFirst();
    const filter = { appointments: { some: { doctorId: doctor.id } } };
    const patients = await prisma.patient.findMany({ 
        where: filter,
        include: {
          user: { select: { fullName: true, email: true, phone: true, avatar: true, isActive: true, createdAt: true } },
          _count: { select: { appointments: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
    console.log('Success:', patients.length);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
