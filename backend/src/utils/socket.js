const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const envConfig = require('./env');
const prisma = require('./prisma');

let io = null;

/**
 * Khởi tạo Socket.io server
 * @param {object} server - HTTP Server instance
 */
function initSocket(server) {
  io = socketIO(server, {
    cors: {
      origin: envConfig.CORS_ORIGIN ? envConfig.CORS_ORIGIN.split(',') : "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      credentials: true
    }
  });

  // Middleware xác thực JWT token kết nối
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      // Giải mã token sử dụng JWT_SECRET giống backend auth
      const decoded = jwt.verify(token, envConfig.JWT_SECRET);
      
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user || !user.isActive) {
        return next(new Error('Authentication error: Account is locked or does not exist'));
      }

      socket.user = decoded;
      next();
    } catch (err) {
      console.error('[Socket Auth Error]:', err.message);
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  // Lắng nghe kết nối
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    const roomName = `user:${userId}`;
    
    // Tự động tham gia room riêng theo userId
    socket.join(roomName);
    console.log(`[Socket] Người dùng ${userId} (Role: ${socket.user.role}) đã kết nối. Room: ${roomName}`);

    socket.on('disconnect', () => {
      console.log(`[Socket] Người dùng ${userId} đã ngắt kết nối.`);
    });
  });

  return io;
}

/**
 * Gửi thông điệp realtime tới một user cụ thể qua room 'user:userId'
 * @param {number|string} userId - ID của người nhận
 * @param {string} event - Tên sự kiện
 * @param {object} data - Dữ liệu gửi đi
 */
function sendToUser(userId, event, data) {
  if (io) {
    const roomName = `user:${userId}`;
    io.to(roomName).emit(event, data);
    console.log(`[Socket] Đã gửi sự kiện '${event}' tới ${roomName}`);
  } else {
    console.warn('[Socket] Socket server chưa được khởi tạo!');
  }
}

module.exports = {
  initSocket,
  sendToUser
};
