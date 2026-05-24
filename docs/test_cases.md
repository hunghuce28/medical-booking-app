# BỘ TEST CASE KIỂM THỬ SẢN PHẨM THỰC TẾ
## MÔN: ĐỒ ÁN PHÁT TRIỂN ỨNG DỤNG ĐA NỀN TẢNG (ĐỀ SỐ 01)
### Dự án: Ứng Dụng Đặt Lịch Khám Bệnh (Medical Appointment Booking)

Tài liệu này trình bày chi tiết bộ kịch bản kiểm thử (Test Cases) cho các module chức năng cốt lõi của hệ thống, tuân thủ nghiêm ngặt cấu trúc đánh giá chuẩn đầu ra **CLO1 – P3** theo yêu cầu của Đề thi Kết thúc học phần Trường Đại học Xây dựng Hà Nội.

---

## I. MODULE 1: QUẢN LÝ XÁC THỰC (AUTHENTICATION & REFRESH TOKEN)

### 🔑 Chức năng 1.1: Đăng nhập hệ thống (Mobile App & Web Admin)
*   **Mô tả**: Xác thực tài khoản người dùng, phân quyền truy cập và lưu trữ token.

| Test Case ID | Mô tả | Các bước kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Trạng thái | Ghi chú |
|---|---|---|---|---|---|---|---|
| **TC-AUTH-01** | Đăng nhập thành công với thông tin hợp lệ | 1. Mở màn hình Đăng nhập.<br>2. Nhập Email & Mật khẩu đúng.<br>3. Nhấn nút "Đăng nhập". | - Email: `patient@gmail.com`<br>- Mật khẩu: `123456` | - Đăng nhập thành công.<br>- Điều hướng vào trang chủ.<br>- Token lưu trữ thành công. | Đúng như mong đợi. Đã điều hướng vào màn hình HomeScreen. | **PASS** | Kiểm thử trên thiết bị di động |
| **TC-AUTH-02** | Đăng nhập thất bại khi sai mật khẩu | 1. Mở màn hình Đăng nhập.<br>2. Nhập Email đúng, Mật khẩu sai.<br>3. Nhấn nút "Đăng nhập". | - Email: `patient@gmail.com`<br>- Mật khẩu: `wrongpass` | - Hiển thị thông báo lỗi "Email hoặc mật khẩu không chính xác".<br>- Giữ nguyên ở màn hình Đăng nhập. | Đúng như mong đợi. Hiển thị thông báo lỗi trực quan dạng Toast/Alert. | **PASS** | Kiểm thử xác thực đầu vào ở server |

---

### 🔄 Chức năng 1.2: Làm mới phiên đăng nhập tự động (Refresh Token)
*   **Mô tả**: Tự động cấp Access Token mới khi token cũ hết hạn để giữ phiên đăng nhập cho bệnh nhân trên Mobile không bị crash hoặc logout.

| Test Case ID | Mô tả | Các bước kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Trạng thái | Ghi chú |
|---|---|---|---|---|---|---|---|
| **TC-REF-01** | Tự động làm mới Access Token thành công | 1. Giả lập Access Token hết hạn.<br>2. Thực hiện một yêu cầu gọi API bất kỳ (ví dụ lấy danh sách bác sĩ).<br>3. Hệ thống bắt lỗi 401 và gọi ngầm API `/auth/refresh-token`. | - `refreshToken` hợp lệ lưu trong SecureStore | - Hệ thống tự gia hạn token ngầm thành công.<br>- Hoàn tất request ban đầu mượt mà không bị logout hay crash. | Đúng như mong đợi. Log console hiển thị gọi API refresh thành công và lấy danh sách bác sĩ bình thường. | **PASS** | Đã khắc phục triệt để lỗi crash phiên cũ |
| **TC-REF-02** | Bắt buộc đăng nhập lại khi Refresh Token hết hạn | 1. Giả lập cả Access & Refresh Token đều hết hạn.<br>2. Thực hiện gọi API bất kỳ.<br>3. Gọi API `/auth/refresh-token` trả về lỗi 401. | - `refreshToken` hết hạn hoặc không tồn tại | - Xóa toàn bộ token trong bộ nhớ.<br>- Tự động điều hướng người dùng quay lại màn hình Đăng nhập. | Đúng như mong đợi. Hệ thống điều hướng an toàn về màn hình Auth. | **PASS** | Bảo mật cơ chế duy trì phiên |

---

## II. MODULE 2: ĐẶT LỊCH KHÁM BỆNH (BOOKING FLOW - MOBILE APP)

### 🏥 Chức năng 2.1: Đặt lịch khám nhanh theo Bác sĩ
*   **Mô tả**: Bệnh nhân chọn bác sĩ nổi bật, xem thông tin chi tiết và đặt lịch khám.

| Test Case ID | Mô tả | Các bước kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Trạng thái | Ghi chú |
|---|---|---|---|---|---|---|---|
| **TC-BOOK-01** | Xem chi tiết bác sĩ & liên kết đặt lịch thành công | 1. Từ trang chủ, bấm vào thẻ Bác sĩ nổi bật.<br>2. Hệ thống chuyển tới trang Chi tiết bác sĩ.<br>3. Bấm "Đặt lịch hẹn ngay". | - Bác sĩ ID: `1` (BS. Nguyễn Việt Hùng) | - Hiển thị đầy đủ ảnh thật, bằng cấp, kinh nghiệm và chuyên khoa.<br>- Chuyển sang màn hình Booking với thông tin bác sĩ được điền sẵn. | Đúng như mong đợi. Avatar hiển thị ảnh thật sắc nét và liên kết đặt lịch hoạt động trơn tru. | **PASS** | Kiểm tra luồng liên kết UX trên Mobile |
| **TC-BOOK-02** | Đặt lịch thành công với khung giờ trống | 1. Chọn ngày khám.<br>2. Chọn khung giờ còn trống (`AVAILABLE`).<br>3. Nhập triệu chứng.<br>4. Nhấn "Xác nhận đặt lịch". | - Ngày khám: `2026-05-25`<br>- Khung giờ: `08:00 - 08:30`<br>- Triệu chứng: `Đau đầu nhẹ` | - Đặt lịch thành công, hiển thị màn hình chúc mừng.<br>- Trạng thái lịch là `PENDING`.<br>- Khung giờ đó chuyển thành `BOOKED` trên DB. | Đúng như mong đợi. Trạng thái TimeSlot trong CSDL được cập nhật chuẩn xác. | **PASS** | Kiểm thử luồng xử lý chính (Luồng nghiệp vụ) |

---

### ❌ Chức năng 2.2: Hủy lịch khám bệnh & Hoàn trả ca khám
*   **Mô tả**: Bệnh nhân tự hủy lịch của mình và hệ thống tự động hoàn trả ca khám về trạng thái Trống.

| Test Case ID | Mô tả | Các bước kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Trạng thái | Ghi chú |
|---|---|---|---|---|---|---|---|
| **TC-CANCEL-01** | Bệnh nhân hủy lịch khám của chính mình thành công | 1. Đăng nhập tài khoản Bệnh nhân.<br>2. Vào "Lịch sử khám", chọn lịch hẹn `PENDING`.<br>3. Nhấn "Hủy lịch" và nhập lý do. | - Lịch khám ID: `5`<br>- Lý do: `Bận đột xuất` | - Lịch chuyển trạng thái thành `CANCELLED`.<br>- Khung giờ của lịch hẹn được mở lại thành `AVAILABLE` để người khác đặt. | Đúng như mong đợi. Lịch được hủy mượt mà, khung giờ được giải phóng tự động trên database. | **PASS** | Đã sửa lỗi phân quyền 403 thành công |
| **TC-CANCEL-02** | Bệnh nhân không được phép hủy lịch của người khác | 1. Đăng nhập tài khoản Bệnh nhân A.<br>2. Cố tình gửi request `PATCH /api/appointments/10/status` với body `CANCELLED` (Lịch 10 là của Bệnh nhân B). | - Lịch khám ID: `10` | - Backend từ chối request, trả về lỗi 403 Forbidden.<br>- Dữ liệu lịch hẹn 10 không bị thay đổi. | Đúng như mong đợi. Lỗi phân quyền được xử lý chặt chẽ ở tầng Service của Backend. | **PASS** | Kiểm thử bảo mật & phân quyền (Ngoại lệ) |

---

## III. MODULE 3: QUẢN LÝ CHUYÊN KHOA (SPECIALTY MANAGE - WEB ADMIN)

### 📂 Chức năng 3.1: Hiển thị và Bật/Tắt trạng thái hoạt động Chuyên khoa
*   **Mô tả**: Admin xem toàn bộ danh mục chuyên khoa (bao gồm cả chuyên khoa bị ẩn) và bật/tắt hoạt động.

| Test Case ID | Mô tả | Các bước kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Trạng thái | Ghi chú |
|---|---|---|---|---|---|---|---|
| **TC-SPEC-01** | Bật/Tắt trạng thái hoạt động chuyên khoa tức thời | 1. Vào trang "Quản lý Chuyên khoa".<br>2. Gạt nút Switch "Trạng thái" của một chuyên khoa đang Hoạt động thành Tắt. | - Chuyên khoa: `Nhi khoa`<br>- `isActive` ban đầu: `true` | - Trạng thái chuyển thành `Tạm ngưng`.<br>- Chuyên khoa đó lập tức biến mất khỏi danh sách chọn trên Mobile App. | Đúng như mong đợi. Badge cập nhật màu sắc đỏ/xanh tức thời, đồng bộ dữ liệu API tốt. | **PASS** | Kiểm thử tính nhất quán dữ liệu giữa Web và Mobile |
| **TC-SPEC-02** | Mở lại chuyên khoa bị ẩn thành công | 1. Tại trang Quản lý Chuyên khoa (hiển thị cả chuyên khoa ẩn).<br>2. Nhấn nút "Mở lại" hoặc gạt Switch của chuyên khoa đang tạm ngưng sang Bật. | - Chuyên khoa: `Nhi khoa`<br>- `isActive` ban đầu: `false` | - Trạng thái đổi thành `Đang hoạt động`.<br>- Chuyên khoa xuất hiện lại bình thường trên ứng dụng di động để bệnh nhân đặt lịch. | Đúng như mong đợi. Dữ liệu được khôi phục chính xác. | **PASS** | Tính năng khôi phục cấu hình hệ thống |

---

### 📤 Chức năng 3.2: Tải lên hình ảnh biểu tượng thực tế (Upload Icon)
*   **Mô tả**: Tải tệp ảnh thật lên lưu trữ cục bộ tại backend và gán làm biểu tượng chuyên khoa.

| Test Case ID | Mô tả | Các bước kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Trạng thái | Ghi chú |
|---|---|---|---|---|---|---|---|
| **TC-UP-01** | Tải ảnh lên thành công qua API Upload | 1. Nhấn "Thêm chuyên khoa" hoặc "Sửa".<br>2. Tại ô "Tải ảnh lên", chọn một file ảnh `.png` hợp lệ.<br>3. Hệ thống tự động upload. | - File: `nhi_khoa_icon.png` (kích thước 200KB) | - File ảnh được upload thành công lên thư mục `backend/uploads`.<br>- API trả về URL ảnh tĩnh.<br>- Hiển thị ảnh xem trước (preview) trên form. | Đúng như mong đợi. Ảnh preview xuất hiện mượt mà ngay trên Modal của Ant Design. | **PASS** | Kiểm thử kết nối API File Upload và Multer |
| **TC-UP-02** | Từ chối tải lên file không phải định dạng ảnh | 1. Chọn file định dạng `.pdf` hoặc `.txt` để tải lên biểu tượng chuyên khoa. | - File: `tai_lieu.txt` | - Hệ thống từ chối tải lên.<br>- Hiển thị thông báo lỗi "Chỉ chấp nhận các định dạng ảnh (.jpeg, .jpg, .png, .gif, .webp)". | Đúng như mong đợi. Bộ lọc Multer ở backend hoạt động chính xác. | **PASS** | Kiểm thử tính an toàn đầu vào (Ngoại lệ) |
