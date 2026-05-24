# BẢNG PHÂN CÔNG CÔNG VIỆC & NHẬT KÝ TIẾN ĐỘ NHÓM
## MÔN: ĐỒ ÁN PHÁT TRIỂN ỨNG DỤNG ĐA NỀN TẢNG (ĐỀ SỐ 01)
### Dự án: Ứng Dụng Đặt Lịch Khám Bệnh (Medical Appointment Booking)
### Giảng viên phụ trách: Ths. Nguyễn Đình Quý & Ths. Hoàng Nam Thắng

Tài liệu này thể hiện rõ ràng bảng phân công vai trò trách nhiệm cụ thể, tiến độ thực hiện theo tuần và nhật ký thể hiện tinh thần phối hợp hỗ trợ, liên kết chặt chẽ giữa các thành viên trong nhóm, đáp ứng tuyệt đối chuẩn đánh giá **CLO2 – P3 & A3** theo yêu cầu của Đề thi và Đáp án Kết thúc học phần Trường Đại học Xây dựng Hà Nội.

---

## I. BẢNG PHÂN CÔNG VAI TRÒ & TRÁCH NHIỆM THÀNH VIÊN

Nhóm thực hiện gồm 3 thành viên, được tổ chức công việc khoa học theo mô hình chuyên môn hóa kết hợp tích hợp chéo hệ thống:

| STT | Thành viên | Vai trò | Công việc phụ trách cụ thể | Tỷ lệ đóng góp |
|---|---|---|---|---|
| 1 | **Nguyễn Việt Hùng** | **Backend Developer + Web Admin** | - Thiết kế cơ sở dữ liệu PostgreSQL (Schema Prisma).<br>- Phát triển toàn bộ các API Endpoints (Express.js, JWT, Bcrypt).<br>- Xây dựng giao diện trang Web quản trị Admin/Bác sĩ (React + Vite + Ant Design).<br>- Triển khai Server Socket.io và thiết lập API Upload file cục bộ (`multer`). | **40%** |
| 2 | **Lê Việt Anh** | **Mobile App Developer** | - Cấu hình Expo Router di động, thiết lập store quản lý state bằng **Zustand**.<br>- Xây dựng toàn bộ giao diện Mobile App y tế (19 màn hình).<br>- Tích hợp hiển thị ảnh thực tế chuyên khoa/bác sĩ (`expo-image`).<br>- Kết nối Socket.io-client di động tiếp nhận thông báo realtime. | **35%** |
| 3 | **Nguyễn Lý Tiền** | **Fullstack Assistant + Tester** | - Hỗ trợ thiết lập API Backend, viết tài liệu kỹ thuật chi tiết (API docs, DB design).<br>- Thiết kế và biên soạn bộ Test Case chi tiết cho toàn hệ thống.<br>- Vận hành kiểm thử hệ thống (manual test), rà soát lỗi phân quyền, báo cáo debug lỗi 403 hủy lịch và lỗi token cho nhóm xử lý. | **25%** |

---

## II. NHẬT KÝ TIẾN ĐỘ THỰC HIỆN DỰ ÁN (10 TUẦN)

Tiến độ nhóm được thiết kế thống nhất, thể hiện tính tương tác cực cao giữa các thành viên: Phần việc của thành viên này là cơ sở kế thừa và hoàn thiện cho thành viên khác.

### 📅 Tuần 1 - 2: Khảo sát nghiệp vụ, Lập kế hoạch & Phân tích yêu cầu
*   **Việc đã làm**:
    *   Cả nhóm thảo luận chọn đề tài "Ứng dụng đặt lịch khám bệnh trực tuyến".
    *   **Việt Hùng**: Phân tích nghiệp vụ, vẽ sơ đồ Use-case tổng quát và sơ đồ ERD dữ liệu.
    *   **Việt Anh**: Xây dựng cấu trúc thư mục dự án và đẩy repo lên GitHub làm việc chung.
    *   **Lý Tiền**: Soạn thảo tài liệu Phân tích yêu cầu và đặc tả nghiệp vụ đặt lịch khám (`requirements-analysis.md`).
*   **Tính liên kết hỗ trợ**: Việt Hùng vẽ sơ đồ ERD dựa trên bản đặc tả yêu cầu nghiệp vụ do Lý Tiền soạn thảo. Việt Anh dựa vào đó để thiết kế luồng màn hình Mobile.

### 📅 Tuần 3 - 4: Setup Database, API Authentication & Màn hình chính
*   **Việc đã làm**:
    *   **Việt Hùng**: Cấu hình Prisma ORM kết nối DB PostgreSQL, hoàn thiện cụm API Auth (Đăng ký, Đăng nhập, Đổi mật khẩu).
    *   **Việt Anh**: Thiết kế màn hình Auth (Login, Register) và trang chủ (HomeScreen) trên di động.
    *   **Lý Tiền**: Hỗ trợ seed dữ liệu mẫu chuyên khoa và bác sĩ vào database (`seed.js`), viết tài liệu API docs.
*   **Tính liên kết hỗ trợ**: Việt Anh thiết kế màn hình đăng nhập di động và kế thừa trực tiếp API đăng nhập do Việt Hùng cung cấp. Lý Tiền hỗ trợ kiểm thử tính hợp lệ của token (JWT).

### 📅 Tuần 5 - 6: Đặt lịch khám, Available Slots & Lịch làm việc Bác sĩ
*   **Việc đã làm**:
    *   **Việt Hùng**: Phát triển thuật toán tự động chia ca khám (`TimeSlot`) dựa trên lịch cố định hàng tuần của bác sĩ. Viết API `/doctors/:id/available-slots`.
    *   **Việt Anh**: Xây dựng luồng đặt lịch khám di động (chọn chuyên khoa → bác sĩ → chọn ngày → chọn ca khám trống).
    *   **Lý Tiền**: Thiết kế bộ Test Case đặt lịch khám, kiểm thử việc khóa ca khám sau khi bệnh nhân đặt thành công.
*   **Tính liên kết hỗ trợ**: Việt Anh kết nối luồng đặt lịch di động trực tiếp với API chia ca khám thông minh của Việt Hùng. Khi phát hiện ca khám không bị trùng lặp, Lý Tiền xác nhận thông qua bộ kiểm thử.

### 📅 Tuần 7 - 8: Hoàn thiện nghiệp vụ y tế & Tích hợp liên kết chéo
*   **Việc đã làm**:
    *   **Việt Hùng**: Viết API ghi kết quả khám bệnh (`MedicalRecord`), cập nhật trạng thái lịch khám `COMPLETED`, API phân tích Dashboard Admin.
    *   **Việt Anh**: Tạo màn hình Chi tiết bác sĩ, trang xem kết quả khám bệnh & đơn thuốc điện tử trên di động.
    *   **Lý Tiền**: Phát hiện lỗi nghiêm trọng khi Bệnh nhân tự hủy lịch của mình bị lỗi 403 Forbidden và lỗi crash app do thiếu endpoint `/auth/refresh-token` trên backend. Báo cáo khẩn cấp cho nhóm.
*   **Tính liên kết hỗ trợ**: **Việt Hùng** nhanh chóng viết thêm API `/auth/refresh-token` và mở thêm quyền hủy lịch cho bệnh nhân trên backend. **Việt Anh** lập tức tích hợp API refresh token ngầm và cập nhật UI hủy lịch trên Mobile. Lỗi được giải quyết triệt để trong vòng 24 giờ nhờ sự phối hợp ăn ý.

### 📅 Tuần 9: Nâng cấp công nghệ Thời gian thực (Socket.io) & Quản lý Chuyên khoa
*   **Việc đã làm**:
    *   **Việt Hùng**: Thiết lập máy chủ Socket.io, middleware token auth, join room `user:userId`. Tạo API upload ảnh (`multer`) cục bộ phục vụ tải ảnh icon.
    *   **Việt Anh**: Cài đặt `socket.io-client` trên di động, lắng nghe sự kiện `'notification'` hiển thị popup Alert. Tích hợp hiển thị ảnh icon và avatar thực tế bằng `expo-image`.
    *   **Lý Tiền**: Soạn thảo bộ Test Case kiểm thử Socket.io (TC-AUTH, TC-REF, TC-BOOK, TC-CANCEL, TC-SPEC, TC-UP) kiểm tra end-to-end.
*   **Tính liên kết hỗ trợ**: Việt Hùng phát tín hiệu realtime từ backend khi trạng thái lịch hẹn đổi, Việt Anh tiếp nhận và hiển thị Alert thời gian thực trên mobile. Lý Tiền kiểm thử thực tế và xác nhận đạt 100% yêu cầu.

### 📅 Tuần 10: Tổng hợp báo cáo, Slide, Video demo & Đóng gói hồ sơ đồ án
*   **Việc đã làm**:
    *   **Việt Hùng**: Chạy biên dịch và đóng gói (Production Build) web-admin thành công.
    *   **Việt Anh**: Đóng gói mã nguồn mobile, nộp link repo GitHub sạch sẽ.
    *   **Lý Tiền**: Tổng hợp báo cáo kỹ thuật hoàn chỉnh (`database-design.md`, `requirements-analysis.md`, `walkthrough.md`, `test_cases.md`), chuẩn bị slide thuyết trình và ghi hình video demo vận hành hệ thống.
*   **Tính liên kết hỗ trợ**: Cả nhóm cùng kiểm tra rà soát lần cuối toàn bộ hệ thống, đạt trạng thái hoàn hảo 100% trước khi nộp hồ sơ bảo vệ chính thức cho Bộ môn Khoa học Máy tính.
