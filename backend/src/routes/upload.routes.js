const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken, authorize } = require('../utils/auth');

// Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình Multer lưu trữ file local
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Đặt tên file an toàn: uniqueSuffix + originalExtension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'file-' + uniqueSuffix + ext);
  }
});

// Bộ lọc định dạng file ảnh
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Chỉ chấp nhận các định dạng ảnh (.jpeg, .jpg, .png, .gif, .webp)'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: fileFilter
});

// Route POST /api/upload
// Yêu cầu đăng nhập (ADMIN, DOCTOR, PATIENT được upload ảnh)
router.post('/', verifyToken, authorize('ADMIN', 'DOCTOR', 'PATIENT'), (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: 'Lỗi tải file: ' + err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp file để tải lên' });
    }

    // Tạo URL ảnh relative để trả về cho client. Client sẽ tự nối BASE_URL.
    // Ví dụ: /uploads/file-123456789.png
    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Tải file lên thành công',
      data: {
        filename: req.file.filename,
        url: fileUrl
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
