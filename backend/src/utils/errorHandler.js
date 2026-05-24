/**
 * Error Handler Middleware
 * Global error handling for API responses
 */

/**
 * Custom error class
 */
class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  console.error("[Error Handler]:", {
    message: err.message,
    status: err.status || 500,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  // Prisma errors
  if (err.code === "P2002") {
    return res.status(400).json({
      success: false,
      message: `Unique constraint failed on field: ${err.meta?.target?.[0] || "unknown"}`,
      error: "UNIQUE_CONSTRAINT",
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Record not found",
      error: "NOT_FOUND",
    });
  }

  if (err.code === "P2003") {
    return res.status(400).json({
      success: false,
      message: "Foreign key constraint failed",
      error: "FOREIGN_KEY_CONSTRAINT",
    });
  }

  // Validation errors
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      })),
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      error: "INVALID_TOKEN",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
      error: "TOKEN_EXPIRED",
    });
  }

  // Default error response
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

/**
 * Async error wrapper
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  ApiError,
  errorHandler,
  asyncHandler,
};
