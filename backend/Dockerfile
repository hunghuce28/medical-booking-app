FROM node:20-alpine AS base

WORKDIR /app

# Cài đặt dependencies
COPY package*.json ./

# ========================
# Development Stage
# ========================
FROM base AS development
RUN npm ci
COPY . .
RUN npx prisma generate
EXPOSE 5000
CMD ["npm", "run", "dev"]

# ========================
# Production Stage
# ========================
FROM base AS production
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 5000
CMD ["node", "src/index.js"]
