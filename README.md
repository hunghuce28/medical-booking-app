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
├── backend/                 # Backend API (Express.js + Prisma + Socket.io)
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema (PostgreSQL)
│   │   └── seed.js          # Dữ liệu mẫu (chuyên khoa, bác sĩ)
│   ├── src/
│   │   ├── controllers/     # Điều phối request & response
│   │   ├── services/        # Logic nghiệp vụ chính
│   │   ├── routes/          # API endpoints & upload route
│   │   └── utils/           # Helper xác thực, socket, biến môi trường
│   └── .env                 # Cấu hình kết nối DB & bảo mật JWT
├── mobile/                  # Mobile App Bệnh nhân (React Native + Expo)
│   ├── app/                 # Các trang ứng dụng Expo Router
│   ├── services/            # Kết nối API & socket client di động
│   ├── stores/              # Quản lý state bằng Zustand
│   └── constants/           # Bảng màu Colors & cấu hình
└── web-admin/               # Web Admin Quản trị & Bác sĩ (React + Vite + Ant Design)
    └── src/                 # Mã nguồn React
```

---

## ⚡ Các Tính Năng Nâng Cấp Nổi Bật (Premium Features)

Dự án đã được tích hợp và nâng cấp các giải pháp công nghệ thời thượng nhất:
*   **Đẩy thông báo thời gian thực (Realtime Notifications)**: Sử dụng **Socket.io** liên kết từ backend đến cả Web Admin và Mobile App. Các room được phân tách theo `user:${userId}` bảo mật, giúp thông báo chuyển trạng thái lịch khám hiển thị lập tức không cần tải lại trang.
*   **Phân quyền & Bảo mật Web Admin (Role-based Guard)**: Chặn hoàn toàn vai trò Bệnh nhân (`PATIENT`) đăng nhập trên Web. Tự động ẩn các menu đặc quyền và bảo vệ Router (`RoleRoute` guard) chặn Bác sĩ (`DOCTOR`) truy cập vào các trang quản lý của `ADMIN`.
*   **Duy trì phiên đăng nhập (Refresh Token)**: Cơ chế gọi API gia hạn Access Token ngầm chống crash app trên di động.

---

## 📌 API Endpoints chính

| Method | Endpoint | Vai trò truy cập | Mô tả |
|---|---|---|---|
| POST | `/api/auth/register` | Toàn quyền | Đăng ký tài khoản mới |
| POST | `/api/auth/login` | Toàn quyền | Đăng nhập hệ thống |
| POST | `/api/auth/refresh-token` | Toàn quyền | Cấp Access/Refresh Token mới ngầm |
| GET | `/api/specialties` | Toàn quyền | Lấy danh sách chuyên khoa |
| POST | `/api/specialties` | ADMIN | Thêm chuyên khoa mới |
| PUT | `/api/specialties/:id` | ADMIN | Cập nhật chuyên khoa & Trạng thái hoạt động |
| POST | `/api/upload` | ADMIN, DOCTOR | Tải tệp ảnh thật lên lưu cục bộ |
| GET | `/api/doctors` | Toàn quyền | Danh sách bác sĩ |
| GET | `/api/doctors/:id` | Toàn quyền | Chi tiết thông tin & lịch làm việc bác sĩ |
| PUT | `/api/doctors/:id/schedules` | ADMIN | Cấu hình lịch làm việc cố định hàng tuần |
| POST | `/api/appointments` | PATIENT | Đặt lịch khám bệnh |
| PATCH | `/api/appointments/:id/status`| ADMIN, DOCTOR, PATIENT | Duyệt/Từ chối/Hủy lịch khám (Có phân quyền) |
| GET | `/api/appointments/dashboard` | ADMIN, DOCTOR | Thống kê Dashboard |

---

## 👥 Thành viên nhóm

| Thành viên | Vai trò | Công việc chính |
|---|---|---|
| **Nguyễn Việt Hùng** | Backend Dev + Web Admin | API endpoints, Database PostgreSQL, Web Admin dashboard |
| **Lê Việt Anh** | Mobile Developer | React Native Expo App, Zustand, expo-image, mobile UI/UX |
| **Nguyễn Lý Tiền** | Fullstack + Testing | Tài liệu kỹ thuật, bộ kịch bản kiểm thử, vận hành và test |

## 📄 License

ISC

