# 🩺 Medical Appointment Booking System (Hệ thống đặt lịch khám bệnh trực tuyến)

Hệ thống đặt lịch khám bệnh trực tuyến đa nền tảng y tế số giúp tối ưu hóa quy trình kết nối giữa bệnh nhân, bác sĩ và nhà quản trị phòng khám/bệnh viện. Dự án được phát triển theo cấu trúc phân lớp chuyên nghiệp, đáp ứng các tiêu chuẩn bảo mật, chịu tải và tuân thủ dữ liệu y tế.

---

## 🏗️ Kiến trúc hệ thống (System Architecture)

Dự án áp dụng mô hình **Clean Layered Architecture** kết hợp với **Repository Pattern** để tách biệt hoàn toàn Business Logic khỏi Data Access Layer:

```mermaid
graph TD
    Client[Mobile App / Web Admin / API Client] -->|HTTP / WebSockets| Express[Express.js Layer]
    Express -->|Middleware| Security[Helmet, Rate Limit, CORS, Compression]
    Security -->|Auth Middleware| Controller[Controllers]
    Controller -->|Request Validation| Joi[Joi Validation]
    Controller -->|Service Call| Service[Service Layer]
    Service -->|Event Emit| EventEmitter[EventEmitter Notification Queue]
    EventEmitter -->|Job Execution| EmailJob[Nodemailer Email Dispatch]
    EventEmitter -->|Job Execution| SocketJob[Realtime WebSockets Push]
    Service -->|Read/Write Operations| Repository[Repository Layer]
    Repository -->|Query / Row Lock| Prisma[Prisma ORM]
    Prisma -->|Transaction / SQL| PostgreSQL[(PostgreSQL Database)]
    Service -->|Read Cache| RedisCache[Redis Caching Middleware]
    RedisCache -->|Bypass / Fallback| Database
```

### 🗄️ Sơ đồ thực thể liên kết (Entity-Relationship Diagram - ERD)

Dưới đây là thiết kế cơ sở dữ liệu hoàn chỉnh, bao gồm các bảng bảo mật và động cơ quản lý lịch trực nâng cao:

![Sơ đồ thực thể liên kết ERD](docs/images/database_erd.png)

<details>
<summary>🖥️ Xem mã nguồn Mermaid ERD</summary>

```mermaid
erDiagram
    users ||--o| patients : "userId (1:1)"
    users ||--o| doctors : "userId (1:1)"
    users ||--o{ notifications : "userId (1:N)"
    users ||--o{ refresh_tokens : "userId (1:N)"
    users ||--o{ audit_logs : "userId (1:N)"
    users ||--o{ appointment_histories : "changedByUserId (1:N)"
    specialties ||--o{ doctors : "specialtyId (1:N)"
    doctors ||--o{ doctor_schedules : "doctorId (1:N)"
    doctors ||--o{ time_slots : "doctorId (1:N)"
    doctors ||--o{ leave_requests : "doctorId (1:N)"
    patients ||--o{ appointments : "patientId (1:N)"
    doctors ||--o{ appointments : "doctorId (1:N)"
    time_slots ||--o| appointments : "timeSlotId (1:1)"
    appointments ||--o| medical_records : "appointmentId (1:1)"
    appointments ||--o| reviews : "appointmentId (1:1)"
    appointments ||--o{ appointment_histories : "appointmentId (1:N)"
    patients ||--o{ reviews : "patientId (1:N)"
    doctors ||--o{ reviews : "doctorId (1:N)"
    holidays {
        int id
        date date
        string name
    }
```
</details>

---

## ⚡ Các cải tiến kỹ thuật nổi bật (Advanced Backend Features)

> [!IMPORTANT]
> Dự án này vượt qua cấu trúc của một ứng dụng CRUD thông thường thông qua các nâng cấp doanh nghiệp sau:

1. **Repository Pattern (Tách lớp truy cập dữ liệu)**
   - Hệ thống triển khai 12 domain repositories kế thừa từ `BaseRepository` để trừu tượng hóa các tác vụ database của Prisma, giúp dễ dàng viết Unit Test độc lập và giảm khớp nối (coupling).
2. **Double Booking Prevention (Pessimistic Concurrency Locking)**
   - Ngăn chặn triệt để tình trạng hai bệnh nhân đặt cùng một khung giờ của bác sĩ tại cùng một thời điểm bằng cách áp dụng khóa dòng `SELECT ... FOR UPDATE` (Pessimistic Write Lock) trong database transaction.
3. **Redis Caching Middleware (Tối ưu hóa hiệu năng)**
   - Tự động lưu cache các API tần suất đọc cao như chuyên khoa và danh sách bác sĩ. Cơ chế **Graceful Fallback** tự động bỏ qua cache khi kết nối Redis gặp sự cố, đảm bảo hệ thống không bị gián đoạn.
4. **Decoupled Event-based Notification Queue**
   - Áp dụng mẫu thiết kế hướng sự kiện (EventEmitter) để chuyển luồng gửi thông báo và gửi email thành các tác vụ chạy ngầm phi tuần tự (Non-blocking).
5. **SMTP Email System (Nodemailer & Ethereal Fallback)**
   - Tích hợp gửi email thông báo thực tế khi đặt/hủy/xác nhận lịch khám. Hỗ trợ tự động tạo tài khoản kiểm thử **Ethereal Email** khi không cung cấp cấu hình SMTP thực tế, giúp lập trình viên kiểm thử dễ dàng qua link log ở console.
6. **Refresh Token Rotation & Session Revocation**
   - Bảo mật phiên đăng nhập nâng cao với JWT ngắn hạn (15 phút) đi kèm cơ chế quay vòng Refresh Token (Token Rotation) được lưu trữ trong cơ sở dữ liệu. Cho phép người dùng theo dõi và đăng xuất các phiên đăng nhập lạ (Force Logout).
7. **Audit Log System (An toàn & Tuân thủ y tế)**
   - Ghi lại vết lịch sử hoạt động đối với toàn bộ các thao tác thay đổi dữ liệu nhạy cảm (Ai làm? Vào lúc nào? Thiết bị gì? Giá trị cũ và mới là gì?).
8. **Health check & Readiness Check**
   - Cung cấp các endpoint `/health` và `/ready` để giám sát trạng thái kết nối trực tiếp đến PostgreSQL và Redis trong môi trường Kubernetes hoặc Docker Swarm.

---

## 📁 Cấu trúc thư mục dự án (Directory Structure)

```text
medical_appointment_booking/
 ├── .github/workflows/       # CI/CD GitHub Actions
 ├── backend/                 # API Server Code
 │    ├── prisma/             # Schema & database migrations
 │    ├── src/
 │    │    ├── config/        # Cấu hình Swagger & Permissions (RBAC)
 │    │    ├── controllers/   # Điều khiển luồng HTTP requests
 │    │    ├── middleware/    # Rate Limiter, Cache, Audit, Permissions middlewares
 │    │    ├── queues/        # EventEmitter Notification Queue
 │    │    ├── repositories/  # Database Repository Layer
 │    │    ├── routes/        # Router định tuyến API endpoints
 │    │    ├── services/      # Lớp chứa core business logic
 │    │    ├── utils/         # Kết nối Redis, Socket.io, Error Handler, Env Validator
 │    │    └── index.js       # App entry point
 │    ├── __tests__/          # Jest Test suite (Unit & Integration tests)
 │    ├── Dockerfile          # Multi-stage Dockerfile cho backend
 │    └── package.json
 ├── web-admin/               # Web Portal quản trị (Vite + React)
 │    ├── src/
 │    └── Dockerfile          # Dockerfile phục vụ web-admin qua Nginx
 ├── mobile/                  # Mobile App bệnh nhân (React Native + Expo)
 └── docker-compose.yml       # Docker Compose chạy toàn bộ hệ thống
```

---

## ⚙️ Hướng dẫn cài đặt & Chạy ứng dụng (Quick Start)

### 1. Cấu hình môi trường (.env)

Tạo file `backend/.env` dựa trên file `.env.example`:

```env
PORT=5000
NODE_ENV=development

# Chuỗi kết nối PostgreSQL
DATABASE_URL="postgresql://postgres:1234@localhost:5432/medical_booking?schema=public"

# Bảo mật JWT
JWT_SECRET="ab84b553c3d526978434758d4a41fae0a297e682d33452bd20af8121d9600e12"
JWT_EXPIRE=7d

# Cấu hình Redis (Tùy chọn, tự động bypass nếu bỏ trống)
REDIS_URL="redis://localhost:6379"

# Cấu hình SMTP Email (Tùy chọn, tự động sinh tài khoản Ethereal thử nghiệm nếu bỏ trống)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM='"Medical Booking" <noreply@yourdomain.com>'
```

### 2. Chạy ứng dụng cục bộ (Local Run)

Yêu cầu đã cài đặt **Node.js (>=16)** và **PostgreSQL**:

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Cài đặt các thư viện
npm install

# 3. Đồng bộ cấu trúc Database và khởi động Migration
npx prisma db push --accept-data-loss

# 4. Nạp dữ liệu mẫu (Seeding)
npm run prisma:seed

# 5. Chạy server ở chế độ Development
npm run dev
```
> Server sẽ khởi chạy tại: `http://localhost:5000`  
> Tài liệu Swagger API tại: `http://localhost:5000/api-docs`

---

## 🐳 Triển khai bằng Docker Compose (Production-ready)

Hệ thống được đóng gói hoàn chỉnh bằng Docker Compose để chạy toàn bộ dịch vụ (Backend, DB, Redis, Web-Admin) chỉ với 1 câu lệnh duy nhất:

```bash
# Khởi chạy hệ thống ở chế độ background
docker compose up -d --build
```

Dịch vụ sẽ tự động ánh xạ các cổng:
- **Backend API:** `http://localhost:5000`
- **Swagger Docs:** `http://localhost:5000/api-docs` (Xem minh họa giao diện bên dưới)

![Giao diện tương tác Swagger API Documentation](docs/images/swagger_docs.png)

- **Web Admin Portal:** `http://localhost:3000`
- **PostgreSQL Database:** `localhost:5432`
- **Redis Cache Server:** `localhost:6379`

Dừng hệ thống:
```bash
docker compose down
```

---

## 🧪 Quy trình kiểm thử hệ thống (Testing Suite)

Dự án đi kèm **96 test cases** được viết bằng Jest để đảm bảo tính ổn định và độ tin cậy của mã nguồn.

![Báo cáo độ bao phủ mã nguồn và các test case passing của Jest](docs/images/jest_coverage.png)

### Chạy toàn bộ Tests
```bash
cd backend
npm run test
```

### Chạy Unit Tests độc lập
```bash
npm run test:unit
```

### Chạy Integration Tests (API Endpoint Tests)
```bash
npm run test:integration
```

---

## 🔒 Danh sách lỗi HTTP & Mã lỗi trả về (API Error Codes)

Hệ thống quản lý lỗi tập trung tại `errorHandler.js` và trả về các mã lỗi chuẩn hóa dưới dạng JSON:

| Trạng thái HTTP | Mã lỗi | Ý nghĩa |
| :--- | :--- | :--- |
| `400 Bad Request` | `Validation error` | Định dạng dữ liệu đầu vào không hợp lệ (Joi validation) |
| `401 Unauthorized` | `INVALID_TOKEN` | Access token không hợp lệ hoặc bị giả mạo |
| `401 Unauthorized` | `TOKEN_EXPIRED` | Access token đã hết hạn |
| `400 Bad Request` | `UNIQUE_CONSTRAINT` | Trùng lặp dữ liệu duy nhất (như email hoặc phone đã được đăng ký) |
| `404 Not Found` | `NOT_FOUND` | Bản ghi không tồn tại trong cơ sở dữ liệu |
| `403 Forbidden` | `Access denied` | Người dùng không có quyền truy cập endpoint này (RBAC) |
| `500 Server Error` | `Internal Server Error` | Lỗi phát sinh từ phía server |

---

## 📈 Quy trình tích hợp liên tục (CI/CD Workflows)

Dự án cấu hình GitHub Actions (`.github/workflows/ci.yml`) để tự động hóa kiểm thử phần mềm trên mỗi sự kiện `push` hoặc `pull_request` lên nhánh `main`:

![GitHub Actions CI Pipeline Passing](docs/images/github_ci_passing.png)

1. Khởi tạo dịch vụ PostgreSQL kiểm thử tạm thời.
2. Kiểm tra lỗi cú pháp (Linting).
3. Biên dịch ứng dụng (Build validation).
4. Chạy toàn bộ 96+ ca kiểm thử tự động (Unit & Integration tests).
