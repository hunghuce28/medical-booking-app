/**
 * Joi Validation Schemas
 * Kiểm tra dữ liệu đầu vào cho tất cả các API endpoint
 */

const Joi = require('joi');

// ========================
// Middleware factory: tạo middleware validation từ schema
// ========================
function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { 
      abortEarly: false,    // Trả về TẤT CẢ lỗi, không dừng ở lỗi đầu tiên
      stripUnknown: true    // Tự động loại bỏ các trường không khai báo trong schema
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors,
      });
    }

    next();
  };
}

// ========================
// AUTH SCHEMAS
// ========================

const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email không đúng định dạng',
      'any.required': 'Email là bắt buộc',
      'string.empty': 'Email không được để trống',
    }),
  fullName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Họ tên phải có ít nhất 2 ký tự',
      'string.max': 'Họ tên không được vượt quá 100 ký tự',
      'any.required': 'Họ tên là bắt buộc',
      'string.empty': 'Họ tên không được để trống',
    }),
  password: Joi.string()
    .min(6)
    .max(50)
    .required()
    .messages({
      'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
      'string.max': 'Mật khẩu không được vượt quá 50 ký tự',
      'any.required': 'Mật khẩu là bắt buộc',
      'string.empty': 'Mật khẩu không được để trống',
    }),
  phone: Joi.string()
    .pattern(/^[0-9]{10,11}$/)
    .allow('', null)
    .messages({
      'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số',
    }),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email không đúng định dạng',
      'any.required': 'Email là bắt buộc',
      'string.empty': 'Email không được để trống',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Mật khẩu là bắt buộc',
      'string.empty': 'Mật khẩu không được để trống',
    }),
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Mật khẩu cũ là bắt buộc',
      'string.empty': 'Mật khẩu cũ không được để trống',
    }),
  newPassword: Joi.string()
    .min(6)
    .max(50)
    .required()
    .messages({
      'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
      'any.required': 'Mật khẩu mới là bắt buộc',
      'string.empty': 'Mật khẩu mới không được để trống',
    }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email không đúng định dạng',
      'any.required': 'Email là bắt buộc',
      'string.empty': 'Email không được để trống',
    }),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Token khôi phục mật khẩu là bắt buộc',
      'string.empty': 'Token khôi phục mật khẩu không được để trống',
    }),
  newPassword: Joi.string()
    .min(6)
    .max(50)
    .required()
    .messages({
      'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
      'any.required': 'Mật khẩu mới là bắt buộc',
      'string.empty': 'Mật khẩu mới không được để trống',
    }),
});


const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token là bắt buộc',
      'string.empty': 'Refresh token không được để trống',
    }),
});

// ========================
// APPOINTMENT SCHEMAS
// ========================

const createAppointmentSchema = Joi.object({
  doctorId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID bác sĩ phải là số',
      'number.positive': 'ID bác sĩ không hợp lệ',
      'any.required': 'ID bác sĩ là bắt buộc',
    }),
  timeSlotId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID khung giờ phải là số',
      'number.positive': 'ID khung giờ không hợp lệ',
      'any.required': 'ID khung giờ là bắt buộc',
    }),
  appointmentDate: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.base': 'Ngày khám không đúng định dạng (YYYY-MM-DD)',
      'date.min': 'Ngày khám không được ở trong quá khứ',
      'any.required': 'Ngày khám là bắt buộc',
    }),
  symptoms: Joi.string()
    .max(500)
    .allow('', null)
    .messages({
      'string.max': 'Triệu chứng không được vượt quá 500 ký tự',
    }),
});

const updateAppointmentStatusSchema = Joi.object({
  status: Joi.string()
    .valid('CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')
    .required()
    .messages({
      'any.only': 'Trạng thái phải là: CONFIRMED, REJECTED, CANCELLED, COMPLETED hoặc NO_SHOW',
      'any.required': 'Trạng thái là bắt buộc',
      'string.empty': 'Trạng thái không được để trống',
    }),
  cancelReason: Joi.string()
    .max(500)
    .allow('', null)
    .messages({
      'string.max': 'Lý do hủy không được vượt quá 500 ký tự',
    }),
});

// ========================
// SPECIALTY SCHEMAS
// ========================

const createSpecialtySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Tên chuyên khoa phải có ít nhất 2 ký tự',
      'string.max': 'Tên chuyên khoa không được vượt quá 100 ký tự',
      'any.required': 'Tên chuyên khoa là bắt buộc',
      'string.empty': 'Tên chuyên khoa không được để trống',
    }),
  description: Joi.string()
    .max(500)
    .allow('', null),
  icon: Joi.string()
    .max(255)
    .allow('', null),
  isActive: Joi.boolean(),
});

const updateSpecialtySchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().max(500).allow('', null),
  icon: Joi.string().max(255).allow('', null),
  isActive: Joi.boolean(),
}).min(1).messages({
  'object.min': 'Cần cung cấp ít nhất một trường để cập nhật',
});

// ========================
// DOCTOR SCHEMAS
// ========================

const createDoctorSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không đúng định dạng',
    'any.required': 'Email là bắt buộc',
  }),
  fullName: Joi.string().min(2).max(100).required().messages({
    'any.required': 'Họ tên là bắt buộc',
  }),
  phone: Joi.string().pattern(/^[0-9]{10,11}$/).allow('', null),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
    'any.required': 'Mật khẩu là bắt buộc',
  }),
  specialtyId: Joi.number().integer().positive().required().messages({
    'any.required': 'ID chuyên khoa là bắt buộc',
  }),
  degree: Joi.string().max(50).allow('', null),
  description: Joi.string().max(1000).allow('', null),
  experienceYears: Joi.number().integer().min(0).max(70).default(0),
  consultationFee: Joi.number().min(0).default(0),
});

// ========================
// REVIEW SCHEMAS
// ========================

const createReviewSchema = Joi.object({
  appointmentId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID lịch khám phải là số',
      'any.required': 'ID lịch khám là bắt buộc',
    }),
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.min': 'Đánh giá phải từ 1 đến 5 sao',
      'number.max': 'Đánh giá phải từ 1 đến 5 sao',
      'any.required': 'Đánh giá sao là bắt buộc',
    }),
  comment: Joi.string()
    .max(1000)
    .allow('', null)
    .messages({
      'string.max': 'Nhận xét không được vượt quá 1000 ký tự',
    }),
});

// ========================
// MEDICAL RECORD SCHEMAS
// ========================

const createMedicalRecordSchema = Joi.object({
  appointmentId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID lịch khám phải là số',
      'any.required': 'ID lịch khám là bắt buộc',
    }),
  diagnosis: Joi.string()
    .min(2)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Chẩn đoán phải có ít nhất 2 ký tự',
      'any.required': 'Chẩn đoán là bắt buộc',
      'string.empty': 'Chẩn đoán không được để trống',
    }),
  prescription: Joi.string()
    .max(2000)
    .allow('', null),
  notes: Joi.string()
    .max(2000)
    .allow('', null),
  followUpDate: Joi.date()
    .iso()
    .allow(null)
    .messages({
      'date.base': 'Ngày tái khám không đúng định dạng',
    }),
});

// ========================
// PATIENT PROFILE SCHEMAS
// ========================

const updatePatientProfileSchema = Joi.object({
  fullName: Joi.string().min(2).max(100),
  phone: Joi.string().pattern(/^[0-9]{10,11}$/).allow('', null),
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').allow(null),
  dateOfBirth: Joi.date().iso().allow(null),
  address: Joi.string().max(500).allow('', null),
  bloodType: Joi.string().max(10).allow('', null),
  allergies: Joi.string().max(500).allow('', null),
  medicalHistory: Joi.string().max(2000).allow('', null),
  insuranceNumber: Joi.string().max(50).allow('', null),
  avatar: Joi.string().max(500).allow('', null),
});

// ========================
// EXPORTS
// ========================

module.exports = {
  validate,
  // Auth
  registerSchema,
  loginSchema,
  changePasswordSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  // Appointment
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  // Specialty
  createSpecialtySchema,
  updateSpecialtySchema,
  // Doctor
  createDoctorSchema,
  // Review
  createReviewSchema,
  // Medical Record
  createMedicalRecordSchema,
  // Patient
  updatePatientProfileSchema,
};
