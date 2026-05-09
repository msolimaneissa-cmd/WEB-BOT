FROM node:22-alpine

# ─── دليل العمل ───
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code (EXCEPT .env files, handled by .dockerignore)
COPY . ./

# ─── إنشاء مستخدم غير جذر لتحسين الأمان ───
RUN addgroup -g 1001 -S nodejs && adduser -S botuser -u 1001
USER botuser

# ─── نقطة الدخول ───
CMD ["node", "src/index.js"]
