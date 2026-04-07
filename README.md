# 🏥 Ứng Dụng Đặt Lịch Khám Bệnh (Medical Appointment Booking)

## Đồ án Phát triển Ứng dụng Đa nền tảng

Ứng dụng đa nền tảng cho phép bệnh nhân đặt lịch khám bệnh trực tuyến, quản lý hồ sơ sức khỏe cá nhân, và tương tác với bác sĩ/phòng khám.

---

## 📋 Tổng quan dự án

| Thành phần | Công nghệ | Mô tả |
|---|---|---|
| **Mobile App** | React Native + Expo | Ứng dụng cho bệnh nhân |
| **Backend API** | Node.js + Express + Prisma | REST API xử lý nghiệp vụ |
| **Web Admin** | React + Vite | Trang quản trị cho Admin/Bác sĩ |
| **Database** | PostgreSQL | Cơ sở dữ liệu quan hệ |

## 🗂️ Cấu trúc dự án

```
medical-booking-app/
├── backend/          # Backend API (Node.js + Express + Prisma)
│   ├── prisma/       # Database schema & migrations
│   ├── src/          # Source code
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
│   └── package.json
├── mobile/           # Mobile App (React Native + Expo)
├── web-admin/        # Web Admin (React + Vite)
├── docs/             # Tài liệu dự án
└── README.md
```

## 🚀 Hướng dẫn cài đặt

### Yêu cầu hệ thống
- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9

### 1. Backend

```bash
cd backend

# Cài đặt dependencies
npm install

# Tạo file .env (copy từ .env.example)
cp .env.example .env
# Sửa DATABASE_URL trong .env cho phù hợp

# Tạo database và chạy migration
npm run db:migrate

# Seed dữ liệu mẫu
npm run db:seed

# Chạy server development
npm run dev
```

### 2. Mobile App

```bash
cd mobile

# Cài đặt dependencies
npm install

# Chạy trên Expo
npx expo start
```

### 3. Web Admin

```bash
cd web-admin

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

## 👥 Tài khoản mẫu

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | admin@medicalbooking.vn | admin123 |
| Bác sĩ | dr.nguyenvana@medicalbooking.vn | doctor123 |
| Bệnh nhân | benhnhan1@gmail.com | patient123 |

## 📊 API Endpoints

| Nhóm | Base URL | Mô tả |
|---|---|---|
| Auth | `/api/auth` | Đăng ký, đăng nhập, JWT |
| Patients | `/api/patients` | Hồ sơ bệnh nhân |
| Doctors | `/api/doctors` | Thông tin bác sĩ |
| Specialties | `/api/specialties` | Chuyên khoa |
| Appointments | `/api/appointments` | Đặt lịch khám |
| Medical Records | `/api/medical-records` | Kết quả khám |
| Reviews | `/api/reviews` | Đánh giá |
| Notifications | `/api/notifications` | Thông báo |
| Admin | `/api/admin` | Quản trị |

## 👨‍👩‍👦 Thành viên nhóm

| STT | Họ tên | Vai trò | Công việc chính |
|---|---|---|---|
| 1 | Nguyễn Việt Hùng | Backend + Web Admin | API, Database, Web Admin |
| 2 | Lê Việt Anh | Mobile Developer | React Native App |
| 3 | Nguyễn Lý Tiền | Fullstack + Docs | Hỗ trợ, Tài liệu, Test |

## 📅 Timeline

| Tuần | Nội dung |
|---|---|
| 1 | Chọn đề tài, lập kế hoạch |
| 2 | Phân tích yêu cầu, thiết kế ERD |
| 3 | Setup dự án, Authentication |
| 4 | Module Bác sĩ & Chuyên khoa |
| 5 | Module Đặt lịch khám |
| 6 | Tích hợp hệ thống |
| 7 | Kết quả khám & Tài liệu |
| 8 | Hoàn thiện & Polish |
| 9 | Test case & Kiểm thử |
| 10 | Báo cáo & Bảo vệ |

## 📝 License

ISC © Medical Booking Team
