# ==============================================================================
# ATELIER VÉRITÉ — Frontend Production Multi-Stage Dockerfile
# Stage 1: Build static assets using Node.js 22 Alpine
# Stage 2: Serve optimized SPA via hardened Nginx Alpine with security headers
# ==============================================================================

# ---------- Stage 1: Build Environment ----------
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies first for optimal Docker layer caching
COPY package*.json ./
RUN npm install --no-audit --no-fund

# Copy source code and build production bundle
COPY . .
RUN npm run build

# ---------- Stage 2: Production Nginx Server ----------
FROM nginx:1.27-alpine AS runner

# Remove default Nginx config
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom Nginx configuration with SPA fallback, caching and security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Built-in container healthcheck probe
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:80/healthz || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
