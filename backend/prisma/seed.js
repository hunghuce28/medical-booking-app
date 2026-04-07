const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu mẫu...\n');

  // =============================================
  // 1. TẠO CHUYÊN KHOA
  // =============================================
  const specialties = await Promise.all([
    prisma.specialty.create({
      data: {
        name: 'Nội tổng quát',
        description: 'Khám và điều trị các bệnh lý nội khoa tổng quát',
        icon: '🫀',
      },
    }),
    prisma.specialty.create({
      data: {
        name: 'Nhi khoa',
        description: 'Khám và điều trị bệnh cho trẻ em từ sơ sinh đến 16 tuổi',
        icon: '👶',
      },
    }),
    prisma.specialty.create({
      data: {
        name: 'Da liễu',
        description: 'Khám và điều trị các bệnh về da, tóc, móng',
        icon: '🧴',
      },
    }),
    prisma.specialty.create({
      data: {
        name: 'Tai Mũi Họng',
        description: 'Khám và điều trị các bệnh về tai, mũi, họng',
        icon: '👂',
      },
    }),
    prisma.specialty.create({
      data: {
        name: 'Mắt',
        description: 'Khám và điều trị các bệnh về mắt, thị lực',
        icon: '👁️',
      },
    }),
    prisma.specialty.create({
      data: {
        name: 'Răng Hàm Mặt',
        description: 'Khám và điều trị các bệnh về răng, hàm, mặt',
        icon: '🦷',
      },
    }),
    prisma.specialty.create({
      data: {
        name: 'Tim mạch',
        description: 'Khám và điều trị các bệnh về tim mạch, huyết áp',
        icon: '❤️',
      },
    }),
    prisma.specialty.create({
      data: {
        name: 'Cơ xương khớp',
        description: 'Khám và điều trị các bệnh về xương, khớp, cơ',
        icon: '🦴',
      },
    }),
  ]);
  console.log(`✅ Đã tạo ${specialties.length} chuyên khoa`);

  // =============================================
  // 2. TẠO TÀI KHOẢN ADMIN
  // =============================================
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@medicalbooking.vn',
      phone: '0900000000',
      passwordHash: adminPassword,
      fullName: 'Quản trị viên',
      role: 'ADMIN',
    },
  });
  console.log(`✅ Đã tạo tài khoản Admin: ${admin.email}`);

  // =============================================
  // 3. TẠO TÀI KHOẢN BÁC SĨ
  // =============================================
  const doctorPassword = await bcrypt.hash('doctor123', 10);

  const doctorsData = [
    {
      email: 'dr.nguyenvana@medicalbooking.vn',
      fullName: 'PGS.TS. Nguyễn Văn An',
      phone: '0901111111',
      specialtyIndex: 0, // Nội tổng quát
      degree: 'Phó Giáo sư, Tiến sĩ',
      description: 'Hơn 20 năm kinh nghiệm trong lĩnh vực nội khoa tổng quát. Chuyên điều trị các bệnh mạn tính.',
      experienceYears: 20,
      consultationFee: 300000,
    },
    {
      email: 'dr.tranthib@medicalbooking.vn',
      fullName: 'TS.BS. Trần Thị Bình',
      phone: '0902222222',
      specialtyIndex: 1, // Nhi khoa
      degree: 'Tiến sĩ, Bác sĩ',
      description: 'Chuyên gia nhi khoa với 15 năm kinh nghiệm. Tận tâm chăm sóc sức khỏe trẻ em.',
      experienceYears: 15,
      consultationFee: 250000,
    },
    {
      email: 'dr.levanc@medicalbooking.vn',
      fullName: 'ThS.BS. Lê Văn Cường',
      phone: '0903333333',
      specialtyIndex: 2, // Da liễu
      degree: 'Thạc sĩ, Bác sĩ',
      description: 'Chuyên gia da liễu, điều trị mụn, viêm da, dị ứng. Tốt nghiệp ĐH Y Hà Nội.',
      experienceYears: 10,
      consultationFee: 200000,
    },
    {
      email: 'dr.phamthid@medicalbooking.vn',
      fullName: 'BS.CKI. Phạm Thị Dung',
      phone: '0904444444',
      specialtyIndex: 3, // Tai Mũi Họng
      degree: 'Bác sĩ Chuyên khoa I',
      description: 'Bác sĩ chuyên khoa Tai Mũi Họng, giàu kinh nghiệm điều trị viêm xoang, viêm amidan.',
      experienceYears: 12,
      consultationFee: 220000,
    },
    {
      email: 'dr.hoangvane@medicalbooking.vn',
      fullName: 'PGS.TS. Hoàng Văn Em',
      phone: '0905555555',
      specialtyIndex: 6, // Tim mạch
      degree: 'Phó Giáo sư, Tiến sĩ',
      description: 'Chuyên gia tim mạch hàng đầu, hơn 25 năm kinh nghiệm. Nguyên Trưởng khoa Tim mạch.',
      experienceYears: 25,
      consultationFee: 500000,
    },
  ];

  const doctors = [];
  for (const d of doctorsData) {
    const user = await prisma.user.create({
      data: {
        email: d.email,
        phone: d.phone,
        passwordHash: doctorPassword,
        fullName: d.fullName,
        role: 'DOCTOR',
        doctor: {
          create: {
            specialtyId: specialties[d.specialtyIndex].id,
            degree: d.degree,
            description: d.description,
            experienceYears: d.experienceYears,
            consultationFee: d.consultationFee,
            rating: 4.5 + Math.random() * 0.5, // Random 4.5 - 5.0
            totalReviews: Math.floor(Math.random() * 50) + 10,
          },
        },
      },
      include: { doctor: true },
    });
    doctors.push(user);
  }
  console.log(`✅ Đã tạo ${doctors.length} tài khoản Bác sĩ`);

  // =============================================
  // 4. TẠO LỊCH LÀM VIỆC MẪU
  // =============================================
  const workdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  let scheduleCount = 0;

  for (const doctorUser of doctors) {
    for (const day of workdays) {
      await prisma.doctorSchedule.create({
        data: {
          doctorId: doctorUser.doctor.id,
          dayOfWeek: day,
          startTime: '08:00',
          endTime: '17:00',
          slotDurationMinutes: 30,
          isActive: true,
        },
      });
      scheduleCount++;
    }
  }
  console.log(`✅ Đã tạo ${scheduleCount} lịch làm việc`);

  // =============================================
  // 5. TẠO TÀI KHOẢN BỆNH NHÂN MẪU
  // =============================================
  const patientPassword = await bcrypt.hash('patient123', 10);

  const patient1 = await prisma.user.create({
    data: {
      email: 'benhnhan1@gmail.com',
      phone: '0911111111',
      passwordHash: patientPassword,
      fullName: 'Nguyễn Thị Mai',
      role: 'PATIENT',
      patient: {
        create: {
          dateOfBirth: new Date('1995-03-15'),
          gender: 'FEMALE',
          address: 'Cầu Giấy, Hà Nội',
          bloodType: 'A+',
        },
      },
    },
  });

  const patient2 = await prisma.user.create({
    data: {
      email: 'benhnhan2@gmail.com',
      phone: '0922222222',
      passwordHash: patientPassword,
      fullName: 'Trần Văn Hùng',
      role: 'PATIENT',
      patient: {
        create: {
          dateOfBirth: new Date('1990-08-20'),
          gender: 'MALE',
          address: 'Đống Đa, Hà Nội',
          bloodType: 'O+',
        },
      },
    },
  });
  console.log(`✅ Đã tạo 2 tài khoản Bệnh nhân mẫu`);

  // =============================================
  console.log('\n🎉 Seed dữ liệu hoàn tất!');
  console.log('📌 Tài khoản mẫu:');
  console.log('   Admin:     admin@medicalbooking.vn / admin123');
  console.log('   Bác sĩ:    dr.nguyenvana@medicalbooking.vn / doctor123');
  console.log('   Bệnh nhân: benhnhan1@gmail.com / patient123');
}

main()
  .catch((e) => {
    console.error('❌ Seed lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
