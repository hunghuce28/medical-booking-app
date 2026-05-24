# TÀI LIỆU PHÂN TÍCH YÊU CẦU
# Ứng dụng Đặt Lịch Khám Bệnh (Medical Appointment Booking)

---

## 1. MÔ TẢ BÀI TOÁN NGHIỆP VỤ

### 1.1. Bối cảnh

Hiện nay, việc đặt lịch khám bệnh tại các phòng khám và bệnh viện ở Việt Nam phần lớn vẫn thực hiện theo phương thức truyền thống: bệnh nhân đến trực tiếp cơ sở y tế, lấy số thứ tự và chờ đợi. Điều này gây ra nhiều bất tiện:

- **Thời gian chờ đợi lâu**: Bệnh nhân phải đến sớm xếp hàng, đặc biệt vào giờ cao điểm
- **Khó khăn trong lựa chọn bác sĩ**: Bệnh nhân không có thông tin đầy đủ về bác sĩ chuyên khoa
- **Quản lý lịch sử khám khó khăn**: Sổ khám bệnh giấy dễ mất, khó tra cứu
- **Bác sĩ khó quản lý lịch làm việc**: Không có công cụ hỗ trợ sắp xếp lịch khám hiệu quả

### 1.2. Mô tả giải pháp

Xây dựng **ứng dụng đa nền tảng** cho phép:
- **Bệnh nhân** sử dụng **ứng dụng mobile** đặt lịch khám bệnh trực tuyến, chọn bác sĩ theo chuyên khoa, chọn ngày giờ phù hợp, xem kết quả khám và đánh giá bác sĩ.
- **Bác sĩ** sử dụng **trang web quản trị** để xem và quản lý lịch khám cá nhân, xác nhận/từ chối lịch hẹn, ghi kết quả khám cho bệnh nhân.
- **Admin** sử dụng **trang web quản trị** để quản lý toàn bộ hệ thống: người dùng, bác sĩ, chuyên khoa, xem thống kê báo cáo.

### 1.3. Phạm vi bài toán

| Có trong phạm vi | Không trong phạm vi |
|---|---|
| Đăng ký, đăng nhập | Thanh toán online |
| Đặt lịch khám theo bác sĩ/chuyên khoa | Chat video với bác sĩ |
| Xác nhận/từ chối/hủy lịch | Kê đơn thuốc điện tử chi tiết |
| Ghi kết quả khám | Tích hợp BHYT |
| Đánh giá bác sĩ | Đặt lịch xét nghiệm |
| Thông báo push | Bản đồ tìm phòng khám |
| Quản trị hệ thống (Admin) | Multi-language |

---

## 2. YÊU CẦU CHỨC NĂNG

### 2.1. Nhóm chức năng Bệnh nhân (Mobile App)

| ID | Chức năng | Mô tả chi tiết | Độ ưu tiên |
|---|---|---|---|
| F-P01 | Đăng ký tài khoản | Đăng ký bằng email, họ tên, SĐT, mật khẩu. Validate dữ liệu đầu vào. | Cao |
| F-P02 | Đăng nhập | Đăng nhập bằng email + mật khẩu. Lưu token để giữ phiên đăng nhập. | Cao |
| F-P03 | Quên mật khẩu | Gửi email đặt lại mật khẩu. | Trung bình |
| F-P04 | Xem trang chủ | Hiển thị banner, danh sách chuyên khoa, bác sĩ nổi bật, lịch khám sắp tới. | Cao |
| F-P05 | Xem danh sách chuyên khoa | Hiển thị tất cả chuyên khoa dạng grid với icon và tên. | Cao |
| F-P06 | Xem danh sách bác sĩ | Danh sách bác sĩ có thể lọc theo chuyên khoa, tìm kiếm theo tên. | Cao |
| F-P07 | Xem chi tiết bác sĩ | Thông tin bác sĩ: ảnh, tên, chuyên khoa, bằng cấp, kinh nghiệm, đánh giá, mô tả. | Cao |
| F-P08 | Đặt lịch khám | Flow: Chọn chuyên khoa → Chọn bác sĩ → Chọn ngày → Chọn khung giờ → Nhập triệu chứng → Xác nhận. | Cao |
| F-P09 | Xem danh sách lịch khám | Hiển thị lịch khám sắp tới (upcoming) và lịch sử (past) dạng tab. | Cao |
| F-P10 | Xem chi tiết lịch khám | Thông tin đầy đủ: bác sĩ, ngày giờ, trạng thái, triệu chứng. | Cao |
| F-P11 | Hủy lịch khám | Hủy lịch khám đang ở trạng thái Pending hoặc Confirmed. Nhập lý do hủy. | Cao |
| F-P12 | Xem kết quả khám | Xem chẩn đoán, đơn thuốc, ghi chú của bác sĩ sau khi khám. | Cao |
| F-P13 | Đánh giá bác sĩ | Đánh giá 1-5 sao và viết nhận xét sau khi khám xong. | Trung bình |
| F-P14 | Xem/sửa hồ sơ cá nhân | Xem và cập nhật thông tin: họ tên, ngày sinh, giới tính, địa chỉ, nhóm máu. | Trung bình |
| F-P15 | Nhận thông báo | Nhận push notification khi lịch khám được xác nhận/từ chối/nhắc nhở. | Trung bình |
| F-P16 | Đổi mật khẩu | Đổi mật khẩu với xác thực mật khẩu cũ. | Thấp |
| F-P17 | Đăng xuất | Xóa token, quay về màn hình đăng nhập. | Cao |

### 2.2. Nhóm chức năng Bác sĩ (Web Admin)

| ID | Chức năng | Mô tả chi tiết | Độ ưu tiên |
|---|---|---|---|
| F-D01 | Đăng nhập | Đăng nhập vào hệ thống web admin bằng email + mật khẩu. | Cao |
| F-D02 | Xem lịch khám của tôi | Xem danh sách lịch khám theo ngày, lọc theo trạng thái. | Cao |
| F-D03 | Xác nhận lịch khám | Xác nhận lịch khám đang chờ (Pending → Confirmed). | Cao |
| F-D04 | Từ chối lịch khám | Từ chối lịch khám đang chờ (Pending → Rejected). Ghi lý do. | Cao |
| F-D05 | Ghi kết quả khám | Sau khi khám xong, ghi chẩn đoán, đơn thuốc, ghi chú, ngày tái khám. | Cao |
| F-D06 | Xem hồ sơ bệnh nhân | Xem thông tin và lịch sử khám của bệnh nhân. | Trung bình |
| F-D07 | Xem đánh giá | Xem các đánh giá từ bệnh nhân. | Thấp |

### 2.3. Nhóm chức năng Admin (Web Admin) 

| ID | Chức năng | Mô tả chi tiết | Độ ưu tiên |
|---|---|---|---|
| F-A01 | Dashboard | Thống kê tổng quan: số lịch khám hôm nay, tổng bệnh nhân, tổng bác sĩ, biểu đồ. | Cao |
| F-A02 | Quản lý chuyên khoa | CRUD chuyên khoa: thêm, sửa, xem, ẩn/hiện. | Cao |
| F-A03 | Quản lý bác sĩ | CRUD bác sĩ: thêm, sửa thông tin, gán chuyên khoa, quản lý lịch làm việc. | Cao |
| F-A04 | Quản lý bệnh nhân | Xem danh sách bệnh nhân, xem chi tiết, khóa/mở tài khoản. | Trung bình |
| F-A05 | Quản lý lịch khám | Xem tất cả lịch khám, lọc theo trạng thái/ngày/bác sĩ. | Cao |
| F-A06 | Thống kê báo cáo | Biểu đồ: lịch khám theo thời gian, chuyên khoa phổ biến, bác sĩ nhiều lịch nhất. | Trung bình |

---

## 3. YÊU CẦU PHI CHỨC NĂNG

| ID | Yêu cầu | Mô tả |
|---|---|---|
| NF-01 | **Hiệu năng** | API response time < 2 giây cho các thao tác thông thường |
| NF-02 | **Bảo mật** | Mã hóa mật khẩu (bcrypt), xác thực JWT, phân quyền theo vai trò |
| NF-03 | **Đa nền tảng** | Mobile app chạy được trên cả Android và iOS thông qua Expo |
| NF-04 | **Responsive** | Web Admin hiển thị tốt trên desktop và tablet |
| NF-05 | **UX tốt** | Giao diện thân thiện, dễ sử dụng, có loading state và error handling |
| NF-06 | **Validate dữ liệu** | Kiểm tra đầu vào ở cả client và server |
| NF-07 | **Mở rộng** | Kiến trúc modular, dễ thêm tính năng mới |

---

## 4. SƠ ĐỒ USE CASE

### 4.1. Use Case tổng quát

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     HỆ THỐNG ĐẶT LỊCH KHÁM BỆNH                       │
│                                                                          │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐  │
│  │    QUẢN LÝ TK       │  │    ĐẶT LỊCH KHÁM    │  │   QUẢN TRỊ      │  │
│  │                     │  │                     │  │                 │  │
│  │  UC01-Đăng ký       │  │  UC06-Tìm BS        │  │  UC13-Dashboard │  │
│  │  UC02-Đăng nhập     │  │  UC07-Chọn ngày/giờ │  │  UC14-QL CK     │  │
│  │  UC03-Quên MK       │  │  UC08-Đặt lịch      │  │  UC15-QL BS     │  │
│  │  UC04-Đổi MK        │  │  UC09-Hủy lịch      │  │  UC16-QL BN     │  │
│  │  UC05-Sửa hồ sơ     │  │  UC10-Xem lịch sử   │  │  UC17-QL LK     │  │
│  │                     │  │  UC11-Kết quả khám  │  │  UC18-Thống kê  │  │
│  │                     │  │  UC12-Đánh giá BS   │  │                 │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

Actors:
  👤 Bệnh nhân (Patient)  → UC01-UC12 (Mobile App)
  👨‍⚕️ Bác sĩ (Doctor)      → UC02, UC10, UC11 + Xác nhận/từ chối (Web Admin)
  👩‍💼 Admin                 → UC02, UC13-UC18 (Web Admin)
```

### 4.2. Mô tả Use Case chính

#### UC08 - Đặt lịch khám (Use Case chính)

| Thông tin | Chi tiết |
|---|---|
| **Actor** | Bệnh nhân |
| **Mô tả** | Bệnh nhân đặt lịch khám bệnh với bác sĩ cụ thể |
| **Điều kiện tiên quyết** | Đã đăng nhập, đã chọn bác sĩ |
| **Luồng chính** | 1. BN chọn chuyên khoa<br>2. BN chọn bác sĩ<br>3. BN chọn ngày khám<br>4. Hệ thống hiển thị các khung giờ trống<br>5. BN chọn khung giờ<br>6. BN nhập triệu chứng/lý do khám<br>7. BN xác nhận đặt lịch<br>8. Hệ thống tạo lịch khám (status=Pending)<br>9. Hệ thống gửi thông báo cho bác sĩ<br>10. Hiển thị màn hình thành công |
| **Luồng ngoại lệ** | - Không còn khung giờ trống → Thông báo "Hết lịch, vui lòng chọn ngày khác"<br>- Mất kết nối → Hiển thị lỗi, cho phép thử lại |
| **Kết quả** | Lịch khám được tạo với trạng thái Pending |

---

## 5. SƠ ĐỒ PHÂN RÃ CHỨC NĂNG

```
🏥 ỨNG DỤNG ĐẶT LỊCH KHÁM BỆNH
├── 1. QUẢN LÝ TÀI KHOẢN
│   ├── 1.1 Đăng ký tài khoản
│   ├── 1.2 Đăng nhập
│   ├── 1.3 Quên mật khẩu
│   ├── 1.4 Đổi mật khẩu
│   └── 1.5 Phân quyền (Patient/Doctor/Admin)
│
├── 2. QUẢN LÝ HỒ SƠ BỆNH NHÂN
│   ├── 2.1 Xem thông tin cá nhân
│   ├── 2.2 Cập nhật thông tin cá nhân
│   ├── 2.3 Upload ảnh đại diện
│   └── 2.4 Xem lịch sử bệnh án
│
├── 3. QUẢN LÝ CHUYÊN KHOA
│   ├── 3.1 Xem danh sách chuyên khoa
│   ├── 3.2 Thêm chuyên khoa (Admin)
│   ├── 3.3 Sửa chuyên khoa (Admin)
│   └── 3.4 Ẩn/Hiện chuyên khoa (Admin)
│
├── 4. QUẢN LÝ BÁC SĨ
│   ├── 4.1 Xem danh sách bác sĩ
│   ├── 4.2 Tìm kiếm bác sĩ (theo tên, chuyên khoa)
│   ├── 4.3 Xem chi tiết bác sĩ
│   ├── 4.4 Thêm/Sửa bác sĩ (Admin)
│   └── 4.5 Quản lý lịch làm việc bác sĩ
│
├── 5. ĐẶT LỊCH KHÁM
│   ├── 5.1 Chọn chuyên khoa
│   ├── 5.2 Chọn bác sĩ
│   ├── 5.3 Chọn ngày khám
│   ├── 5.4 Chọn khung giờ khám
│   ├── 5.5 Nhập triệu chứng
│   ├── 5.6 Xác nhận đặt lịch
│   └── 5.7 Hủy lịch khám
│
├── 6. QUẢN LÝ LỊCH KHÁM
│   ├── 6.1 Xem lịch khám sắp tới
│   ├── 6.2 Xem lịch sử khám
│   ├── 6.3 Xem chi tiết lịch khám
│   ├── 6.4 Xác nhận lịch khám (Bác sĩ)
│   ├── 6.5 Từ chối lịch khám (Bác sĩ)
│   └── 6.6 Hoàn thành lịch khám (Bác sĩ)
│
├── 7. KẾT QUẢ KHÁM
│   ├── 7.1 Ghi kết quả khám (Bác sĩ)
│   ├── 7.2 Xem kết quả khám (Bệnh nhân)
│   └── 7.3 Xem lịch sử bệnh án
│
├── 8. ĐÁNH GIÁ
│   ├── 8.1 Đánh giá bác sĩ (1-5 sao)
│   ├── 8.2 Viết nhận xét
│   └── 8.3 Xem đánh giá
│
├── 9. THÔNG BÁO
│   ├── 9.1 Gửi thông báo đặt lịch
│   ├── 9.2 Gửi thông báo xác nhận/từ chối
│   ├── 9.3 Nhắc lịch khám
│   └── 9.4 Đánh dấu đã đọc
│
└── 10. QUẢN TRỊ HỆ THỐNG (Admin)
    ├── 10.1 Dashboard thống kê
    ├── 10.2 Quản lý người dùng
    ├── 10.3 Quản lý chuyên khoa
    ├── 10.4 Quản lý bác sĩ
    ├── 10.5 Quản lý tất cả lịch khám
    └── 10.6 Thống kê báo cáo
```

---

## 6. THIẾT KẾ CƠ SỞ DỮ LIỆU (ERD)

### 6.1. Danh sách bảng dữ liệu

| STT | Bảng | Tên DB | Mô tả | Số trường |
|---|---|---|---|---|
| 1 | Người dùng | `users` | Tài khoản đăng nhập cho tất cả vai trò | 10 |
| 2 | Bệnh nhân | `patients` | Thông tin chi tiết bệnh nhân | 10 |
| 3 | Chuyên khoa | `specialties` | Danh mục chuyên khoa y tế | 6 |
| 4 | Bác sĩ | `doctors` | Thông tin chi tiết bác sĩ | 12 |
| 5 | Lịch làm việc | `doctor_schedules` | Lịch làm việc theo ngày trong tuần | 8 |
| 6 | Khung giờ | `time_slots` | Các slot khám cụ thể theo ngày | 7 |
| 7 | Lịch khám | `appointments` | Cuộc hẹn khám bệnh | 11 |
| 8 | Kết quả khám | `medical_records` | Chẩn đoán và đơn thuốc | 7 |
| 9 | Đánh giá | `reviews` | Đánh giá bác sĩ | 7 |
| 10 | Thông báo | `notifications` | Thông báo đẩy | 8 |

### 6.2. Chi tiết từng bảng

#### Bảng `users` (Người dùng)

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | INT | PK, Auto increment | Mã người dùng |
| email | VARCHAR | UNIQUE, NOT NULL | Email đăng nhập |
| phone | VARCHAR | UNIQUE | Số điện thoại |
| passwordHash | VARCHAR | NOT NULL | Mật khẩu đã mã hóa |
| fullName | VARCHAR | NOT NULL | Họ và tên |
| avatar | VARCHAR | NULL | URL ảnh đại diện |
| role | ENUM | NOT NULL, DEFAULT 'PATIENT' | Vai trò: PATIENT/DOCTOR/ADMIN |
| isActive | BOOLEAN | DEFAULT true | Trạng thái hoạt động |
| createdAt | TIMESTAMP | DEFAULT now() | Ngày tạo |
| updatedAt | TIMESTAMP | Auto update | Ngày cập nhật |

#### Bảng `patients` (Bệnh nhân)

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | INT | PK, Auto increment | Mã bệnh nhân |
| userId | INT | FK → users.id, UNIQUE | Liên kết tài khoản |
| dateOfBirth | DATE | NULL | Ngày sinh |
| gender | ENUM | NULL | Giới tính: MALE/FEMALE/OTHER |
| address | VARCHAR | NULL | Địa chỉ |
| insuranceNumber | VARCHAR | NULL | Số BHYT |
| bloodType | VARCHAR | NULL | Nhóm máu |
| allergies | TEXT | NULL | Dị ứng |
| medicalHistory | TEXT | NULL | Tiền sử bệnh |
| createdAt | TIMESTAMP | DEFAULT now() | Ngày tạo |

#### Bảng `doctors` (Bác sĩ)

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | INT | PK, Auto increment | Mã bác sĩ |
| userId | INT | FK → users.id, UNIQUE | Liên kết tài khoản |
| specialtyId | INT | FK → specialties.id | Chuyên khoa |
| degree | VARCHAR | NULL | Bằng cấp (ThS, TS, PGS...) |
| description | TEXT | NULL | Giới thiệu |
| experienceYears | INT | DEFAULT 0 | Số năm kinh nghiệm |
| consultationFee | DECIMAL(10,2) | DEFAULT 0 | Phí khám |
| rating | FLOAT | DEFAULT 0 | Điểm đánh giá TB |
| totalReviews | INT | DEFAULT 0 | Tổng số đánh giá |
| isActive | BOOLEAN | DEFAULT true | Đang hoạt động |
| createdAt | TIMESTAMP | DEFAULT now() | Ngày tạo |

#### Bảng `appointments` (Lịch khám)

| Trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| id | INT | PK, Auto increment | Mã lịch khám |
| patientId | INT | FK → patients.id | Bệnh nhân |
| doctorId | INT | FK → doctors.id | Bác sĩ |
| timeSlotId | INT | FK → time_slots.id, UNIQUE | Khung giờ |
| appointmentDate | DATE | NOT NULL | Ngày khám |
| status | ENUM | DEFAULT 'PENDING' | Trạng thái |
| symptoms | TEXT | NULL | Triệu chứng |
| notes | TEXT | NULL | Ghi chú |
| cancelReason | TEXT | NULL | Lý do hủy |
| createdAt | TIMESTAMP | DEFAULT now() | Ngày tạo |
| updatedAt | TIMESTAMP | Auto update | Ngày cập nhật |

**Các trạng thái lịch khám (AppointmentStatus):**

```
PENDING    → Chờ xác nhận (bệnh nhân vừa đặt)
CONFIRMED  → Đã xác nhận (bác sĩ đồng ý)
REJECTED   → Bị từ chối (bác sĩ không nhận)
CANCELLED  → Đã hủy (bệnh nhân hoặc bác sĩ hủy)
COMPLETED  → Đã khám xong
NO_SHOW    → Không đến khám
```

### 6.3. Sơ đồ quan hệ (ERD)

```
┌──────────┐     1:1      ┌──────────┐
│  users   │─────────────▶│ patients │
│          │              │          │
│  id (PK) │              │  userId  │──┐
│  email   │              │  gender  │  │
│  role    │              │  dob     │  │ 1:N
│          │     1:1      │  address │  │
│          │─────────────▶│          │  │
└──────────┘              └──────────┘  │
     │                                  │
     │ 1:1     ┌──────────────┐         │
     └────────▶│   doctors    │         │
               │              │    ┌────┴────────────┐
               │  userId      │    │  appointments   │
               │  specialtyId │◀───│                 │
               │  degree      │ 1:N│  patientId (FK) │
               │  rating      │    │  doctorId (FK)  │
               └──────┬───────┘    │  timeSlotId (FK)│
                      │            │  status         │
                 N:1  │            │  symptoms       │
               ┌──────┴───────┐    └──────┬──────────┘
               │ specialties  │           │
               │              │      1:1  │  1:1
               │  name        │    ┌──────┴─────┐──────────┐
               │  icon        │    │            │          │
               └──────────────┘    ▼            ▼          │
                          ┌──────────────┐ ┌─────────┐     │
                          │medical_records│ │ reviews │     │
                          │              │ │         │     │
                          │ diagnosis    │ │ rating  │     │
                          │ prescription │ │ comment │     │
                          └──────────────┘ └─────────┘     │
                                                           │
               ┌──────────────────┐     1:1               │
               │   time_slots     │◀───────────────────────┘
               │                  │
               │  doctorId (FK)   │
               │  date            │
               │  startTime       │
               │  status          │
               └──────────────────┘
```

---

## 7. LUỒNG XỬ LÝ CHÍNH

### 7.1. Luồng Đặt Lịch Khám

```
Bệnh nhân                    Mobile App                     Backend API                    Database
    │                            │                              │                              │
    │  1. Mở app, xem trang chủ  │                              │                              │
    │ ──────────────────────────▶ │  2. GET /api/specialties     │                              │
    │                            │ ────────────────────────────▶ │  3. Query specialties        │
    │                            │                              │ ────────────────────────────▶ │
    │                            │                              │ ◀──────── Danh sách CK ────── │
    │                            │ ◀──── Response chuyên khoa ── │                              │
    │                            │                              │                              │
    │  4. Chọn chuyên khoa       │                              │                              │
    │ ──────────────────────────▶ │  5. GET /api/doctors?        │                              │
    │                            │     specialtyId=X            │                              │
    │                            │ ────────────────────────────▶ │  6. Query doctors            │
    │                            │                              │ ────────────────────────────▶ │
    │                            │ ◀──── Response bác sĩ ─────── │                              │
    │                            │                              │                              │
    │  7. Chọn bác sĩ            │                              │                              │
    │ ──────────────────────────▶ │  8. GET /api/doctors/{id}/   │                              │
    │                            │     available-slots?date=Y   │                              │
    │                            │ ────────────────────────────▶ │  9. Query available slots    │
    │                            │                              │ ────────────────────────────▶ │
    │                            │ ◀── Response khung giờ trống ─ │                              │
    │                            │                              │                              │
    │  10. Chọn giờ + nhập       │                              │                              │
    │      triệu chứng          │                              │                              │
    │ ──────────────────────────▶ │  11. POST /api/appointments  │                              │
    │                            │ ────────────────────────────▶ │  12. Create appointment      │
    │                            │                              │      Update slot status      │
    │                            │                              │      Create notification     │
    │                            │                              │ ────────────────────────────▶ │
    │                            │ ◀── Đặt lịch thành công ───── │                              │
    │ ◀── Hiển thị xác nhận ✅ ── │                              │                              │
```

### 7.2. Luồng Xác nhận & Hoàn thành Khám

```
Bác sĩ                      Web Admin                     Backend API                     Database
    │                            │                              │                              │
    │  1. Xem lịch khám mới     │                              │                              │
    │ ──────────────────────────▶ │  2. GET /api/appointments    │                              │
    │                            │     ?status=PENDING          │                              │
    │                            │ ────────────────────────────▶ │ ────────────────────────────▶ │
    │                            │ ◀──── Danh sách chờ ───────── │                              │
    │                            │                              │                              │
    │  3. Xác nhận lịch khám    │                              │                              │
    │ ──────────────────────────▶ │  4. PUT /api/appointments/   │                              │
    │                            │     {id}/confirm             │                              │
    │                            │ ────────────────────────────▶ │  5. Update status=CONFIRMED  │
    │                            │                              │     Send notification to BN  │
    │                            │                              │ ────────────────────────────▶ │
    │                            │ ◀── Xác nhận OK ────────────  │                              │
    │                            │                              │                              │
    │  ... Sau khi khám xong ... │                              │                              │
    │                            │                              │                              │
    │  6. Đánh dấu hoàn thành   │                              │                              │
    │ ──────────────────────────▶ │  7. PUT /appointments/       │                              │
    │                            │     {id}/complete            │                              │
    │                            │ ────────────────────────────▶ │  8. Update status=COMPLETED  │
    │                            │                              │ ────────────────────────────▶ │
    │                            │                              │                              │
    │  9. Ghi kết quả khám      │                              │                              │
    │ ──────────────────────────▶ │  10. POST /medical-records   │                              │
    │                            │ ────────────────────────────▶ │  11. Create medical record   │
    │                            │                              │      Send notif to BN        │
    │                            │                              │ ────────────────────────────▶ │
    │                            │ ◀── Ghi kết quả OK ────────── │                              │
```

### 7.3. Luồng trạng thái Lịch khám

```
                    ┌──────────────────┐
                    │     PENDING      │  ← BN vừa đặt lịch
                    │   (Chờ xác nhận) │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │  CONFIRMED   │ │   REJECTED   │ │  CANCELLED   │
    │ (Đã xác nhận)│ │ (Bị từ chối) │ │  (Đã hủy)    │
    └──────┬───────┘ └──────────────┘ └──────────────┘
           │
     ┌─────┼─────┐
     │     │     │
     ▼     ▼     ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│COMPLETED│ │CANCELLED│ │ NO_SHOW │
│(Đã khám)│ │(Đã hủy) │ │(Vắng)   │
└─────────┘ └─────────┘ └─────────┘
```

---

## 8. CÔNG NGHỆ SỬ DỤNG

| Thành phần | Công nghệ | Phiên bản |
|---|---|---|
| Mobile App | React Native + Expo | SDK 52+ |
| Navigation | Expo Router | 4.x |
| State Management | Zustand | 5.x |
| Backend Framework | Node.js + Express.js | Node 18+, Express 4.x |
| ORM | Prisma | 7.x |
| Database | PostgreSQL | 14+ |
| Authentication | JWT (jsonwebtoken) | 9.x |
| Password Hashing | bcryptjs | 3.x |
| Web Admin | React + Vite | React 19, Vite 6 |
| UI Library (Web) | Ant Design | 5.x |
| HTTP Client | Axios | 1.x |

---

## 9. PHÂN CÔNG NHÓM (3 thành viên)

| Thành viên | Vai trò | Công việc chính | Phần trăm |
|---|---|---|---|
| Nguyễn Việt Hùng | Backend Dev + Web Admin | API endpoints, Database, Web Admin dashboard | ~40% |
| Lê Việt Anh | Mobile Developer | React Native App toàn bộ (19 màn hình) | ~35% |
| Nguyễn Lý Tiền | Fullstack + Docs + Test | Hỗ trợ backend/mobile, Documentation, Test case | ~25% |

---

## 10. KẾ HOẠCH THỰC HIỆN (10 tuần)

| Tuần | Nội dung | Deliverables |
|---|---|---|
| 1 | Setup dự án, lập kế hoạch | Repo GitHub, cấu trúc project |
| 2 | Phân tích yêu cầu | Tài liệu yêu cầu, ERD, Use Case |
| 3 | Authentication + Setup DB | API auth, Login/Register mobile |
| 4 | Bác sĩ & Chuyên khoa | CRUD bác sĩ/CK, Trang chủ mobile |
| 5 | Đặt lịch khám | Booking flow, Available slots |
| 6 | Tích hợp hệ thống | End-to-end: Đặt→Xác nhận→Thông báo |
| 7 | Kết quả khám | Medical records, Lịch sử bệnh án |
| 8 | Hoàn thiện | Notification, Review, Polish UI |
| 9 | Test case & Kiểm thử | Bộ test case, sửa lỗi |
| 10 | Báo cáo & Bảo vệ | Báo cáo, Slide, Video demo |
