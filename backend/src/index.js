const express = require("express");
const cors = require("cors");
const http = require("http");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();

const envConfig = require("./utils/env");
envConfig.validate();

const apiRoutes = require("./routes");
const swaggerSpec = require("./config/swagger.config");
const { initSocket } = require("./utils/socket");
const { errorHandler } = require("./utils/errorHandler");

const app = express();

// Security Middlewares
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // Cho phép load ảnh từ các origin khác

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 300, // giới hạn 300 requests / 15 phút
  message: { success: false, message: "Too many requests, please try again later." }
});
app.use("/api", limiter);

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8081'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Phục vụ thư mục upload ảnh tĩnh
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Medical Booking API Docs',
}));

// Welcome Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Medical Appointment Booking API!",
    docs: "/api-docs",
  });
});

// Load Routes
app.use("/api", apiRoutes);

// Error Handling Middleware (Global)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Khởi tạo Socket.io
initSocket(server);

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API Docs: http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
