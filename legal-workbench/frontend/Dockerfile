# Multi-stage build for production
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Cache buster: forces rebuild when source files change
# Use: docker compose build --build-arg CACHEBUST=$(date +%s)
ARG CACHEBUST=1

# Copy source files (invalidated by CACHEBUST arg)
COPY . .

# Build the application
RUN echo "Build: $CACHEBUST" && bun run build

# Production stage with nginx
FROM nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 3000

# Health check using curl
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
