# 🏥 Ứng Dụng Đặt Lịch Khám Bệnh (Medical Appointment Booking)

Ứng dụng đa nền tảng cho phép bệnh nhân đặt lịch khám bệnh trực tuyến, quản lý hồ sơ sức khỏe cá nhân, và tương tác với bác sĩ/phòng khám.

## 📋 Tổng quan

| Thành phần | Công nghệ | Mô tả |
|---|---|---|
| **Mobile App** | React Native + Expo | Ứng dụng cho bệnh nhân (iOS & Android) |
| **Backend API** | Node.js + Express.js + Prisma | RESTful API server |
| **Web Admin** | React + Vite | Trang quản trị cho Admin & Bác sĩ |
| **Database** | PostgreSQL | Cơ sở dữ liệu quan hệ |

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐     ┌────────────────┐
│  📱 Mobile App  │────▶│                │
│  (React Native) │     │  🔌 Backend    │────▶ 🗄️ PostgreSQL
│                 │     │  (Express.js)  │
├─────────────────┤     │                │
│  🖥️ Web Admin   │────▶│  Port: 5000    │
│  (React + Vite) │     └────────────────┘
└─────────────────┘
```

## 🚀 Cài đặt & Chạy

### Yêu cầu
- **Node.js** >= 18.x
- **PostgreSQL** >= 14.x
- **Expo CLI** (cho mobile)

### 1. Backend API

```bash
cd backend

# Cài đặt dependencies
npm install

# Tạo file .env từ template
cp .env.example .env
# (Chỉnh sửa DATABASE_URL, JWT_SECRET trong .env)

# Chạy migration tạo bảng
npx prisma migrate dev --name init

# Seed dữ liệu mẫu
npm run prisma:seed

# Khởi động server (development)
npm run dev
```

Server sẽ chạy tại: `http://localhost:5000`

### 2. Mobile App

```bash
cd mobile

# Cài đặt dependencies
npm install

# Khởi động Expo
npx expo start
```

Quét QR code bằng app Expo Go trên điện thoại để xem.

### 3. Web Admin

```bash
cd web-admin

# Cài đặt dependencies
npm install

# Khởi động dev server
npm run dev
```

Web Admin sẽ chạy tại: `http://localhost:5173`

## 📂 Cấu trúc dự án

```
medical_appointment_booking/
├── backend/                 # Backend API (Express.js + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.js          # Dữ liệu mẫu
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API routes
│   │   └── utils/           # Utilities (auth, error handler...)
│   └── .env                 # Environment variables
├── mobile/                  # Mobile App (React Native + Expo)
│   ├── app/                 # Expo Router screens
│   ├── services/            # API services
│   ├── stores/              # Zustand state management
│   └── constants/           # Colors, config...
├── web-admin/               # Web Admin (React + Vite)
│   └── src/
└── docs/                    # Tài liệu dự án
    ├── requirements-analysis.md
    ├── database-design.md
    ├── api-documentation.md
    └── implementation_plan.md
```

## 📌 API Endpoints chính

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/login` | Đăng nhập |
| GET | `/api/specialties` | Danh sách chuyên khoa |
| GET | `/api/doctors` | Danh sách bác sĩ |
| GET | `/api/doctors/:id` | Chi tiết bác sĩ |
| POST | `/api/appointments` | Đặt lịch khám |
| GET | `/api/appointments` | Xem lịch khám |

Xem đầy đủ tại: [`docs/api-documentation.md`](docs/api-documentation.md)

## 👥 Thành viên nhóm

| Thành viên | Vai trò |
|---|---|
| Nguyễn Việt Hùng | Backend Dev + Web Admin |
| Lê Việt Anh | Mobile Developer |
| Nguyễn Lý Tiền | Fullstack + Docs + Test |

## 📄 License

ISC
