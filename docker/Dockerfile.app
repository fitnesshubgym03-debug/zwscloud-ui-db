FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl mysql-client

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Generate Prisma client
RUN npm run db:generate

# Build Next.js app
RUN npm run build

# Create health check script
RUN echo '#!/bin/sh\ncurl -f http://localhost:3000/health || exit 1' > /healthcheck.sh && chmod +x /healthcheck.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Start application
CMD ["npm", "start"]
