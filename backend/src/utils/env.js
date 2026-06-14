/**
 * Environment Variables Configuration
 * Validates and loads all required environment variables
 */

const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];

/**
 * Validate environment variables
 */
function validateEnv() {
  const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingVars.length > 0) {
    console.warn(
      `⚠️  Missing required environment variables: ${missingVars.join(", ")}`,
    );
  }
}

/**
 * Export environment configuration object
 */
const envConfig = {
  // Basic
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || "7d",

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",

  // Cloudinary (Optional)
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Email (Optional)
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || "587", 10),
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM,

  // Validation
  validate: validateEnv,
};

module.exports = envConfig;
