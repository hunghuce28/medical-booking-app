const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...\n');

  // ========================
  // 1. Tạo Chuyên Khoa
  // ========================
  const specialties = [
    { name: 'Nội tổng quát', description: 'Khám và điều trị các bệnh lý nội khoa chung như tim mạch, hô hấp, tiêu hóa', icon: '🫀' },
    { name: 'Nhi khoa', description: 'Chăm sóc sức khỏe cho trẻ sơ sinh, trẻ nhỏ và vị thành niên', icon: '👶' },
    { name: 'Răng Hàm Mặt', description: 'Chẩn đoán, điều trị và phòng ngừa các bệnh lý nha khoa', icon: '🦷' },
    { name: 'Mắt', description: 'Khám và tư vấn các vấn đề về thị lực, bệnh lý mắt', icon: '👁️' },
    { name: 'Tai Mũi Họng', description: 'Điều trị các bệnh lý tai, mũi, họng, viêm xoang', icon: '👂' },
    { name: 'Da liễu', description: 'Chẩn đoán và điều trị các bệnh về da, tóc, móng', icon: '🧴' },
    { name: 'Cơ Xương Khớp', description: 'Điều trị các bệnh lý cơ xương khớp, thoái hóa, viêm khớp', icon: '🦴' },
    { name: 'Thần kinh', description: 'Khám và điều trị các rối loạn thần kinh, đau đầu, mất ngủ', icon: '🧠' },
  ];

  console.log('📋 Tạo chuyên khoa...');
  for (const s of specialties) {
    await prisma.specialty.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
  }
  console.log(`   ✅ Đã tạo ${specialties.length} chuyên khoa\n`);

  const dbSpecialties = await prisma.specialty.findMany();

  // ========================
  // 2. Tạo Admin mẫu
  // ========================
  console.log('👩‍💼 Tạo tài khoản Admin...');
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@hospital.vn' },
    update: {},
    create: {
      email: 'admin@hospital.vn',
      fullName: 'Quản trị viên',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      phone: '0900000000',
    },
  });
  console.log('   ✅ Admin: admin@hospital.vn / admin123\n');

  // ========================
  // 3. Tạo Bệnh nhân mẫu
  // ========================
  console.log('👤 Tạo bệnh nhân mẫu...');
  const patientPasswordHash = await bcrypt.hash('patient123', 10);
  const patientUser = await prisma.user.upsert({
    where: { email: 'benhnhan@gmail.com' },
    update: {},
    create: {
      email: 'benhnhan@gmail.com',
      fullName: 'Nguyễn Văn Bệnh Nhân',
      passwordHash: patientPasswordHash,
      role: 'PATIENT',
      phone: '0911111111',
      patient: {
        create: {
          gender: 'MALE',
          address: '123 Đường Nguyễn Huệ, Q.1, TP.HCM',
          bloodType: 'O+',
        },
      },
    },
  });
  console.log('   ✅ Bệnh nhân: benhnhan@gmail.com / patient123\n');

  // ========================
  // 4. Tạo Bác sĩ mẫu
  // ========================
  console.log('👨‍⚕️ Tạo bác sĩ mẫu...');
  const doctorPasswordHash = await bcrypt.hash('doctor123', 10);

  const doctorsData = [
    { fullName: 'PGS.TS Nguyễn Văn An', email: 'bacsi_an@hospital.vn', phone: '0901000001', specialty: 'Nội tổng quát', fee: 300000, exp: 15, degree: 'PGS.TS', desc: 'Chuyên gia đầu ngành Nội khoa với 15 năm kinh nghiệm tại BV Bạch Mai.' },
    { fullName: 'ThS.BS Trần Thị Bình', email: 'bacsi_binh@hospital.vn', phone: '0901000002', specialty: 'Nhi khoa', fee: 250000, exp: 8, degree: 'ThS.BS', desc: 'Bác sĩ Nhi khoa tận tâm, chuyên điều trị các bệnh nhiễm khuẩn ở trẻ.' },
    { fullName: 'BS.CK1 Lê Văn Cường', email: 'bacsi_cuong@hospital.vn', phone: '0901000003', specialty: 'Răng Hàm Mặt', fee: 200000, exp: 5, degree: 'BS.CK1', desc: 'Bác sĩ chuyên về phẫu thuật nha khoa, trồng răng implant.' },
    { fullName: 'TS.BS Phạm Thị Dung', email: 'bacsi_dung@hospital.vn', phone: '0901000004', specialty: 'Mắt', fee: 350000, exp: 12, degree: 'TS.BS', desc: 'Tiến sĩ chuyên ngành nhãn khoa, chuyên gia phẫu thuật Lasik.' },
    { fullName: 'BS Ngô Văn Em', email: 'bacsi_em@hospital.vn', phone: '0901000005', specialty: 'Tai Mũi Họng', fee: 150000, exp: 3, degree: 'BS', desc: 'Bác sĩ trẻ nhiệt huyết, chuyên điều trị viêm xoang và viêm amidan.' },
    { fullName: 'PGS.TS Hoàng Văn Phong', email: 'bacsi_phong@hospital.vn', phone: '0901000006', specialty: 'Da liễu', fee: 280000, exp: 10, degree: 'PGS.TS', desc: 'Chuyên gia Da liễu, điều trị mụn, nám và các bệnh da liễu mãn tính.' },
    { fullName: 'ThS.BS Vũ Thị Giang', email: 'bacsi_giang@hospital.vn', phone: '0901000007', specialty: 'Cơ Xương Khớp', fee: 220000, exp: 7, degree: 'ThS.BS', desc: 'Bác sĩ chuyên khoa Cơ Xương Khớp, điều trị thoái hóa và viêm khớp.' },
    { fullName: 'BS.CK2 Đỗ Minh Hải', email: 'bacsi_hai@hospital.vn', phone: '0901000008', specialty: 'Thần kinh', fee: 400000, exp: 18, degree: 'BS.CK2', desc: 'Chuyên gia Thần kinh học, điều trị đau đầu, mất ngủ và bệnh Parkinson.' },
  ];

  const dayOfWeekMap = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  for (const d of doctorsData) {
    const spec = dbSpecialties.find((x) => x.name === d.specialty);

    // Create User
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        email: d.email,
        fullName: d.fullName,
        passwordHash: doctorPasswordHash,
        role: 'DOCTOR',
        phone: d.phone,
      },
    });

    // Create Doctor Profile
    const existingDoctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
    let doctor;
    if (!existingDoctor) {
      doctor = await prisma.doctor.create({
        data: {
          userId: user.id,
          specialtyId: spec.id,
          degree: d.degree,
          description: d.desc,
          experienceYears: d.exp,
          consultationFee: d.fee,
          rating: parseFloat((4.0 + Math.random() * 0.9).toFixed(1)),
          totalReviews: Math.floor(Math.random() * 50) + 10,
        },
      });
    } else {
      doctor = existingDoctor;
    }

    // Create DoctorSchedule (Thứ 2 - Thứ 6, 08:00 - 17:00, slot 30 phút)
    for (const day of dayOfWeekMap) {
      const existingSchedule = await prisma.doctorSchedule.findUnique({
        where: { doctorId_dayOfWeek: { doctorId: doctor.id, dayOfWeek: day } },
      });
      if (!existingSchedule) {
        await prisma.doctorSchedule.create({
          data: {
            doctorId: doctor.id,
            dayOfWeek: day,
            startTime: '08:00',
            endTime: '17:00',
            slotDurationMinutes: 30,
          },
        });
      }
    }

    console.log(`   ✅ BS ${d.fullName} (${d.specialty}) - ${d.email} / doctor123`);
  }

  console.log(`\n   Tổng: ${doctorsData.length} bác sĩ + lịch làm việc T2-T6\n`);

  // ========================
  // Tổng kết
  // ========================
  console.log('═══════════════════════════════════════');
  console.log('🎉 Seed hoàn tất!');
  console.log('═══════════════════════════════════════');
  console.log('📌 Tài khoản mẫu:');
  console.log('   Admin:      admin@hospital.vn / admin123');
  console.log('   Bệnh nhân:  benhnhan@gmail.com / patient123');
  console.log('   Bác sĩ:     bacsi_an@hospital.vn / doctor123');
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
