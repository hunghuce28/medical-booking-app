const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
require("dotenv").config();

const apiRoutes = require("./routes");
const { initSocket } = require("./utils/socket");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Phục vụ thư mục upload ảnh tĩnh
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Welcome Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Medical Appointment Booking API!",
  });
});

// Load Routes
app.use("/api", apiRoutes);

// Error Handling Middleware (Global)
app.use((err, req, res, next) => {
  console.error("[Error]:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Khởi tạo Socket.io
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

