# API ENDPOINTS DOCUMENTATION
# Ứng dụng Đặt Lịch Khám Bệnh

Base URL: `http://localhost:5000/api`

---

## Quy ước chung

### Authentication
- Tất cả API (trừ auth) yêu cầu header: `Authorization: Bearer <token>`
- Token nhận được sau khi đăng nhập thành công

### Response Format
```json
{
  "success": true/false,
  "message": "Mô tả kết quả",
  "data": { ... }
}
```

### Pagination
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### Error Codes
| HTTP Code | Ý nghĩa |
|---|---|
| 200 | Thành công |
| 201 | Tạo mới thành công |
| 400 | Dữ liệu không hợp lệ |
| 401 | Chưa đăng nhập / token hết hạn |
| 403 | Không có quyền |
| 404 | Không tìm thấy |
| 500 | Lỗi server |

---

## 1. Authentication (`/api/auth`)

### POST `/api/auth/register` — Đăng ký
**Body:**
```json
{
  "email": "user@example.com",
  "phone": "0901234567",
  "fullName": "Nguyễn Văn A",
  "password": "123456"
}
```
**Response (201):**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "user": { "id": 1, "email": "...", "fullName": "...", "role": "PATIENT" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### POST `/api/auth/login` — Đăng nhập
**Body:**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

### POST `/api/auth/refresh-token` — Làm mới token
**Body:**
```json
{
  "refreshToken": "eyJ..."
}
```

### PUT `/api/auth/change-password` — Đổi mật khẩu 🔒
**Body:**
```json
{
  "currentPassword": "123456",
  "newPassword": "654321"
}
```

---

## 2. Specialties (`/api/specialties`)

### GET `/api/specialties` — Danh sách chuyên khoa
**Query:** `?search=nội`
**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Nội tổng quát", "description": "...", "icon": "🫀" },
    { "id": 2, "name": "Nhi khoa", "description": "...", "icon": "👶" }
  ]
}
```

### GET `/api/specialties/:id/doctors` — Bác sĩ theo chuyên khoa
**Response:** Danh sách bác sĩ thuộc chuyên khoa

---

## 3. Doctors (`/api/doctors`)

### GET `/api/doctors` — Danh sách bác sĩ
**Query:** `?search=nguyễn&specialtyId=1&page=1&limit=10`

### GET `/api/doctors/:id` — Chi tiết bác sĩ
**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "PGS.TS. Nguyễn Văn An",
    "avatar": "...",
    "specialty": { "id": 1, "name": "Nội tổng quát" },
    "degree": "Phó Giáo sư, Tiến sĩ",
    "experienceYears": 20,
    "consultationFee": 300000,
    "rating": 4.8,
    "totalReviews": 45,
    "description": "..."
  }
}
```

### GET `/api/doctors/:id/available-slots` — Khung giờ trống
**Query:** `?date=2026-04-15`
**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "startTime": "08:00", "endTime": "08:30", "status": "AVAILABLE" },
    { "id": 2, "startTime": "08:30", "endTime": "09:00", "status": "BOOKED" },
    { "id": 3, "startTime": "09:00", "endTime": "09:30", "status": "AVAILABLE" }
  ]
}
```

### GET `/api/doctors/:id/reviews` — Đánh giá bác sĩ

---

## 4. Appointments (`/api/appointments`)

### POST `/api/appointments` — Đặt lịch khám 🔒 (Patient)
**Body:**
```json
{
  "doctorId": 1,
  "timeSlotId": 5,
  "appointmentDate": "2026-04-15",
  "symptoms": "Đau đầu, sốt nhẹ 2 ngày"
}
```

### GET `/api/appointments` — Danh sách lịch khám 🔒
**Query:** `?status=PENDING&type=upcoming`

### GET `/api/appointments/:id` — Chi tiết lịch khám 🔒

### PUT `/api/appointments/:id/cancel` — Hủy lịch 🔒 (Patient)
**Body:**
```json
{
  "cancelReason": "Bận công việc đột xuất"
}
```

### PUT `/api/appointments/:id/confirm` — Xác nhận 🔒 (Doctor)

### PUT `/api/appointments/:id/reject` — Từ chối 🔒 (Doctor)
**Body:**
```json
{
  "cancelReason": "Bác sĩ bận lịch đột xuất"
}
```

### PUT `/api/appointments/:id/complete` — Hoàn thành 🔒 (Doctor)

---

## 5. Medical Records (`/api/medical-records`)

### POST `/api/medical-records` — Ghi kết quả khám 🔒 (Doctor)
**Body:**
```json
{
  "appointmentId": 1,
  "diagnosis": "Viêm họng cấp tính",
  "prescription": "Paracetamol 500mg x 3 viên/ngày\nAmoxicillin 500mg x 2 viên/ngày",
  "notes": "Uống thuốc đúng giờ, uống nhiều nước ấm",
  "followUpDate": "2026-04-22"
}
```

### GET `/api/medical-records/:appointmentId` — Xem kết quả 🔒

---

## 6. Reviews (`/api/reviews`)

### POST `/api/reviews` — Đánh giá bác sĩ 🔒 (Patient)
**Body:**
```json
{
  "appointmentId": 1,
  "rating": 5,
  "comment": "Bác sĩ rất tận tâm, giải thích rõ ràng"
}
```

---

## 7. Notifications (`/api/notifications`)

### GET `/api/notifications` — Danh sách thông báo 🔒

### PUT `/api/notifications/:id/read` — Đánh dấu đã đọc 🔒

### PUT `/api/notifications/read-all` — Đọc tất cả 🔒

---

## 8. Admin (`/api/admin`) 🔒 (Admin only)

### GET `/api/admin/dashboard` — Thống kê tổng quan
```json
{
  "data": {
    "totalPatients": 150,
    "totalDoctors": 12,
    "totalAppointments": 450,
    "todayAppointments": 8,
    "appointmentsByStatus": { "PENDING": 5, "CONFIRMED": 3, "COMPLETED": 120 },
    "recentAppointments": [...]
  }
}
```

### CRUD `/api/admin/specialties` — Quản lý chuyên khoa
- GET `/` — Danh sách
- POST `/` — Thêm mới
- PUT `/:id` — Cập nhật
- DELETE `/:id` — Xóa

### CRUD `/api/admin/doctors` — Quản lý bác sĩ
### CRUD `/api/admin/users` — Quản lý người dùng
### GET `/api/admin/appointments` — Tất cả lịch khám

---

🔒 = Yêu cầu đăng nhập (Bearer Token)
