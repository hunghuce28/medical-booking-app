/**
 * Helper functions cho ứng dụng
 */

/**
 * Tạo response thành công chuẩn
 */
const successResponse = (res, data, message = 'Thành công', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Tạo response lỗi chuẩn
 */
const errorResponse = (res, message = 'Có lỗi xảy ra', statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

/**
 * Tạo response phân trang
 */
const paginatedResponse = (res, data, total, page, limit, message = 'Thành công') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  });
};

/**
 * Tạo các time slots từ schedule
 * @param {string} startTime - "08:00"
 * @param {string} endTime - "17:00"
 * @param {number} duration - phút (30)
 * @returns {Array} [{startTime: "08:00", endTime: "08:30"}, ...]
 */
const generateTimeSlots = (startTime, endTime, duration) => {
  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  while (currentMinutes + duration <= endMinutes) {
    const slotStart = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
    const slotEnd = `${String(Math.floor((currentMinutes + duration) / 60)).padStart(2, '0')}:${String((currentMinutes + duration) % 60).padStart(2, '0')}`;

    slots.push({ startTime: slotStart, endTime: slotEnd });
    currentMinutes += duration;
  }

  return slots;
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  generateTimeSlots,
};
