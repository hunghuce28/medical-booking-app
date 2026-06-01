/**
 * Authentication Middleware
 * JWT token verification and user authentication
 */

const jwt = require("jsonwebtoken");
const envConfig = require("../utils/env");
const prisma = require("../utils/prisma");

/**
 * Verify JWT token middleware
 */
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No authorization header provided",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    const decoded = jwt.verify(token, envConfig.JWT_SECRET);
    if (decoded.type !== "access") {
      throw new Error("Invalid token type. Access token required.");
    }
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.isActive) {
      throw new Error("Account is locked or does not exist.");
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      error: error.message,
    });
  }
}

/**
 * Check user role middleware
 * @param {...string} allowedRoles - Allowed roles
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Allowed roles: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
}

/**
 * Optional authentication
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next();
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    const decoded = jwt.verify(token, envConfig.JWT_SECRET);
    if (decoded.type === "access") {
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (user && user.isActive) {
        req.user = decoded;
      }
    }
    next();
  } catch (error) {
    next();
  }
}

module.exports = {
  verifyToken,
  authorize,
  optionalAuth,
};
