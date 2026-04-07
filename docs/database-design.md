# THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE DESIGN)
# Ứng dụng Đặt Lịch Khám Bệnh

---

## 1. Hệ quản trị CSDL: PostgreSQL

### Lý do chọn PostgreSQL:
- Miễn phí, mã nguồn mở
- Hỗ trợ JSON, full-text search
- Tích hợp tốt với Prisma ORM
- Performance tốt cho ứng dụng vừa và nhỏ
- Cộng đồng lớn, tài liệu phong phú

---

## 2. Sơ đồ quan hệ thực thể (ERD)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ENTITY RELATIONSHIP DIAGRAM                  │
│                    Ứng Dụng Đặt Lịch Khám Bệnh                     │
└─────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
  │   USERS      │───1:1──▶│  PATIENTS    │───1:N──▶│ APPOINTMENTS │
  │              │         │              │         │              │
  │  PK: id      │         │  PK: id      │         │  PK: id      │
  │  email (UK)  │         │  FK: userId   │         │  FK: patientId│
  │  phone (UK)  │         │  dateOfBirth  │         │  FK: doctorId │
  │  passwordHash│         │  gender       │         │  FK: timeSlotId│
  │  fullName    │         │  address      │         │  appointDate  │
  │  avatar      │         │  insurance    │         │  status       │
  │  role        │         │  bloodType    │         │  symptoms     │
  │  isActive    │         │  allergies    │         │  notes        │
  └──────┬───────┘         └──────────────┘         └──────┬───────┘
         │                                                 │
         │ 1:1                                    1:1 ┌────┴────┐ 1:1
         ▼                                            ▼         ▼
  ┌──────────────┐                            ┌─────────────┐ ┌────────┐
  │   DOCTORS    │                            │MEDICAL_     │ │REVIEWS │
  │              │                            │RECORDS      │ │        │
  │  PK: id      │                            │ PK: id      │ │ PK: id │
  │  FK: userId   │                            │ FK: apptId  │ │FK:apptId│
  │  FK: specId   │                            │ diagnosis   │ │FK:patId │
  │  degree       │                            │ prescription│ │FK:docId │
  │  description  │                            │ notes       │ │ rating  │
  │  expYears     │                            │ followUp    │ │ comment │
  │  fee          │                            └─────────────┘ └────────┘
  │  rating       │
  └──────┬───────┘
    │         │
    │ N:1     │ 1:N
    ▼         ▼
┌──────────┐ ┌──────────────────┐        ┌──────────────┐
│SPECIALTIES│ │DOCTOR_SCHEDULES  │        │NOTIFICATIONS │
│          │ │                  │        │              │
│ PK: id   │ │ PK: id           │        │ PK: id       │
│ name (UK)│ │ FK: doctorId     │        │ FK: userId   │
│ desc     │ │ dayOfWeek        │        │ title        │
│ icon     │ │ startTime        │        │ message      │
│ isActive │ │ endTime          │        │ type         │
└──────────┘ │ slotDuration     │        │ isRead       │
             └──────────────────┘        │ data (JSON)  │
                                         └──────────────┘
┌──────────────────┐
│   TIME_SLOTS     │
│                  │
│ PK: id           │
│ FK: doctorId     │
│ date             │
│ startTime        │
│ endTime          │
│ status           │
│ UK: (doctorId,   │
│      date,       │
│      startTime)  │
└──────────────────┘
```

---

## 3. Mô tả chi tiết các bảng

### 3.1. Bảng `users` — Người dùng

Lưu trữ thông tin đăng nhập cho tất cả vai trò trong hệ thống.

| # | Trường | Kiểu | Ràng buộc | Mô tả |
|---|--------|------|-----------|-------|
| 1 | id | SERIAL | PK | Mã tự tăng |
| 2 | email | VARCHAR(255) | UNIQUE, NOT NULL | Email đăng nhập |
| 3 | phone | VARCHAR(20) | UNIQUE | Số điện thoại |
| 4 | passwordHash | VARCHAR(255) | NOT NULL | Mật khẩu mã hóa bcrypt |
| 5 | fullName | VARCHAR(100) | NOT NULL | Họ và tên |
| 6 | avatar | VARCHAR(500) | NULL | URL ảnh đại diện |
| 7 | role | ENUM('PATIENT','DOCTOR','ADMIN') | NOT NULL, DEFAULT 'PATIENT' | Vai trò |
| 8 | isActive | BOOLEAN | DEFAULT true | Trạng thái tài khoản |
| 9 | createdAt | TIMESTAMP | DEFAULT now() | Ngày tạo |
| 10 | updatedAt | TIMESTAMP | Auto | Ngày cập nhật cuối |

### 3.2. Bảng `patients` — Bệnh nhân

Mở rộng thông tin y tế của bệnh nhân, liên kết 1:1 với `users`.

| # | Trường | Kiểu | Ràng buộc | Mô tả |
|---|--------|------|-----------|-------|
| 1 | id | SERIAL | PK | Mã bệnh nhân |
| 2 | userId | INT | FK→users, UNIQUE | Liên kết tài khoản |
| 3 | dateOfBirth | DATE | NULL | Ngày sinh |
| 4 | gender | ENUM('MALE','FEMALE','OTHER') | NULL | Giới tính |
| 5 | address | VARCHAR(500) | NULL | Địa chỉ |
| 6 | insuranceNumber | VARCHAR(50) | NULL | Số thẻ BHYT |
| 7 | bloodType | VARCHAR(10) | NULL | Nhóm máu (A+, B-, O+,...) |
| 8 | allergies | TEXT | NULL | Dị ứng |
| 9 | medicalHistory | TEXT | NULL | Tiền sử bệnh |
| 10 | createdAt | TIMESTAMP | DEFAULT now() | Ngày tạo |

### 3.3. Bảng `specialties` — Chuyên khoa

Danh mục các chuyên khoa y tế.

| # | Trường | Kiểu | Ràng buộc | Mô tả |
|---|--------|------|-----------|-------|
| 1 | id | SERIAL | PK | Mã chuyên khoa |
| 2 | name | VARCHAR(100) | UNIQUE, NOT NULL | Tên chuyên khoa |
| 3 | description | TEXT | NULL | Mô tả |
| 4 | icon | VARCHAR(50) | NULL | Icon/emoji |
| 5 | isActive | BOOLEAN | DEFAULT true | Trạng thái |
| 6 | createdAt | TIMESTAMP | DEFAULT now() | Ngày tạo |

### 3.4. Bảng `doctors` — Bác sĩ

Thông tin chi tiết của bác sĩ, liên kết 1:1 với `users`.

| # | Trường | Kiểu | Ràng buộc | Mô tả |
|---|--------|------|-----------|-------|
| 1 | id | SERIAL | PK | Mã bác sĩ |
| 2 | userId | INT | FK→users, UNIQUE | Liên kết tài khoản |
| 3 | specialtyId | INT | FK→specialties | Chuyên khoa |
| 4 | degree | VARCHAR(100) | NULL | Bằng cấp |
| 5 | description | TEXT | NULL | Giới thiệu bản thân |
| 6 | experienceYears | INT | DEFAULT 0 | Số năm kinh nghiệm |
| 7 | consultationFee | DECIMAL(10,2) | DEFAULT 0 | Phí tư vấn (VNĐ) |
| 8 | rating | FLOAT | DEFAULT 0 | Điểm đánh giá TB (0-5) |
| 9 | totalReviews | INT | DEFAULT 0 | Tổng số lượt đánh giá |
| 10 | isActive | BOOLEAN | DEFAULT true | Đang hoạt động |
| 11 | createdAt | TIMESTAMP | DEFAULT now() | Ngày tạo |

### 3.5. Bảng `doctor_schedules` — Lịch làm việc bác sĩ

Định nghĩa khung giờ làm việc cố định theo ngày trong tuần.

| # | Trường | Kiểu | Ràng buộc | Mô tả |
|---|--------|------|-----------|-------|
| 1 | id | SERIAL | PK | Mã lịch |
| 2 | doctorId | INT | FK→doctors | Bác sĩ |
| 3 | dayOfWeek | ENUM | NOT NULL | Thứ (MONDAY-SUNDAY) |
| 4 | startTime | VARCHAR(5) | NOT NULL | Giờ bắt đầu "08:00" |
| 5 | endTime | VARCHAR(5) | NOT NULL | Giờ kết thúc "17:00" |
| 6 | slotDurationMinutes | INT | DEFAULT 30 | Thời lượng mỗi slot |
| 7 | isActive | BOOLEAN | DEFAULT true | Đang áp dụng |
| 8 | UNIQUE | | (doctorId, dayOfWeek) | Mỗi BS chỉ 1 lịch/ngày |

### 3.6. Bảng `time_slots` — Khung giờ khám

Các slot khám cụ thể, được tạo dựa trên `doctor_schedules`.

| # | Trường | Kiểu | Ràng buộc | Mô tả |
|---|--------|------|-----------|-------|
| 1 | id | SERIAL | PK | Mã slot |
| 2 | doctorId | INT | FK→doctors | Bác sĩ |
| 3 | date | DATE | NOT NULL | Ngày cụ thể |
| 4 | startTime | VARCHAR(5) | NOT NULL | "08:00" |
| 5 | endTime | VARCHAR(5) | NOT NULL | "08:30" |
| 6 | status | ENUM('AVAILABLE','BOOKED','BLOCKED') | DEFAULT 'AVAILABLE' | Trạng thái |
| 7 | UNIQUE | | (doctorId, date, startTime) | Không trùng slot |

### 3.7. Bảng `appointments` — Lịch khám

Quản lý các cuộc hẹn khám bệnh.

| # | Trường | Kiểu | Ràng buộc | Mô tả |
|---|--------|------|-----------|-------|
| 1 | id | SERIAL | PK | Mã lịch khám |
| 2 | patientId | INT | FK→patients | Bệnh nhân |
| 3 | doctorId | INT | FK→doctors | Bác sĩ |
| 4 | timeSlotId | INT | FK→time_slots, UNIQUE | Khung giờ |
| 5 | appointmentDate | DATE | NOT NULL | Ngày khám |
| 6 | status | ENUM | DEFAULT 'PENDING' | Trạng thái |
| 7 | symptoms | TEXT | NULL | Triệu chứng |
| 8 | notes | TEXT | NULL | Ghi chú |
| 9 | cancelReason | TEXT | NULL | Lý do hủy |
| 10 | createdAt | TIMESTAMP | DEFAULT now() | Ngày tạo |
| 11 | updatedAt | TIMESTAMP | Auto | Cập nhật cuối |

### 3.8. Bảng `medical_records` — Kết quả khám

Bác sĩ ghi chẩn đoán và đơn thuốc sau khi khám.

| # | Trường | Kiểu | Ràng buộc | Mô tả |
|---|--------|------|-----------|-------|
| 1 | id | SERIAL | PK | Mã kết quả |
| 2 | appointmentId | INT | FK→appointments, UNIQUE | Lịch khám tương ứng |
| 3 | diagnosis | TEXT | NOT NULL | Chẩn đoán |
| 4 | prescription | TEXT | NULL | Đơn thuốc |
| 5 | notes | TEXT | NULL | Ghi chú bác sĩ |
| 6 | followUpDate | DATE | NULL | Ngày tái khám |
| 7 | createdAt | TIMESTAMP | DEFAULT now() | Ngày tạo |

### 3.9. Bảng `reviews` — Đánh giá

Bệnh nhân đánh giá bác sĩ sau khi khám xong.

| # | Trường | Kiểu | Ràng buộc | Mô tả |
|---|--------|------|-----------|-------|
| 1 | id | SERIAL | PK | Mã đánh giá |
| 2 | appointmentId | INT | FK→appointments, UNIQUE | Lịch khám |
| 3 | patientId | INT | FK→patients | Bệnh nhân |
| 4 | doctorId | INT | FK→doctors | Bác sĩ |
| 5 | rating | INT | NOT NULL (1-5) | Số sao |
| 6 | comment | TEXT | NULL | Nhận xét |
| 7 | createdAt | TIMESTAMP | DEFAULT now() | Ngày tạo |

### 3.10. Bảng `notifications` — Thông báo

Quản lý thông báo đẩy cho người dùng.

| # | Trường | Kiểu | Ràng buộc | Mô tả |
|---|--------|------|-----------|-------|
| 1 | id | SERIAL | PK | Mã thông báo |
| 2 | userId | INT | FK→users | Người nhận |
| 3 | title | VARCHAR(200) | NOT NULL | Tiêu đề |
| 4 | message | TEXT | NOT NULL | Nội dung |
| 5 | type | ENUM | DEFAULT 'GENERAL' | Loại thông báo |
| 6 | isRead | BOOLEAN | DEFAULT false | Đã đọc chưa |
| 7 | data | JSON | NULL | Dữ liệu bổ sung |
| 8 | createdAt | TIMESTAMP | DEFAULT now() | Ngày tạo |

---

## 4. Các ràng buộc quan hệ (Foreign Keys)

| FK | Bảng nguồn | Trường | Bảng đích | Trường đích | On Delete |
|---|---|---|---|---|---|
| FK1 | patients | userId | users | id | CASCADE |
| FK2 | doctors | userId | users | id | CASCADE |
| FK3 | doctors | specialtyId | specialties | id | RESTRICT |
| FK4 | doctor_schedules | doctorId | doctors | id | CASCADE |
| FK5 | time_slots | doctorId | doctors | id | CASCADE |
| FK6 | appointments | patientId | patients | id | RESTRICT |
| FK7 | appointments | doctorId | doctors | id | RESTRICT |
| FK8 | appointments | timeSlotId | time_slots | id | RESTRICT |
| FK9 | medical_records | appointmentId | appointments | id | CASCADE |
| FK10 | reviews | appointmentId | appointments | id | CASCADE |
| FK11 | reviews | patientId | patients | id | RESTRICT |
| FK12 | reviews | doctorId | doctors | id | RESTRICT |
| FK13 | notifications | userId | users | id | CASCADE |

---

## 5. Indexes

| Bảng | Index | Trường | Mục đích |
|---|---|---|---|
| users | UK_users_email | email | Tìm kiếm nhanh theo email |
| users | UK_users_phone | phone | Tìm kiếm nhanh theo SĐT |
| doctors | IDX_doctors_specialty | specialtyId | Lọc BS theo chuyên khoa |
| time_slots | UK_timeslots | doctorId, date, startTime | Đảm bảo không trùng slot |
| appointments | IDX_appt_patient | patientId | Lịch sử khám BN |
| appointments | IDX_appt_doctor | doctorId | Lịch khám của BS |
| appointments | IDX_appt_status | status | Lọc theo trạng thái |
| notifications | IDX_notif_user | userId | Thông báo theo user |
