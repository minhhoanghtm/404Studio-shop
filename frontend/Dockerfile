# ==============================================================================
# ATELIER VÉRITÉ — Frontend Production Multi-Stage Dockerfile
# Stage 1: Build static assets using Node.js 22 Alpine
# Stage 2: Serve optimized SPA via Nginx Alpine with envsubst template & nginx -t
# ==============================================================================

# ---------- Stage 1: Build Environment ----------
FROM node:22-alpine AS builder
WORKDIR /app

ARG VITE_API_BASE_URL=/api
ARG VITE_API_URL=/api
ARG VITE_WS_URL=
ARG VITE_APP_ENV=production
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}
ENV VITE_APP_ENV=${VITE_APP_ENV}

# Install dependencies first for optimal Docker layer caching
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy source code and build production bundle
COPY . .
RUN npm run build

# ---------- Stage 2: Production Nginx Server ----------
FROM nginx:1.27-alpine AS runner

ARG FRONTEND_INTERNAL_PORT
ARG BACKEND_HOST
ARG BACKEND_INTERNAL_PORT
ENV FRONTEND_INTERNAL_PORT=${FRONTEND_INTERNAL_PORT}
ENV BACKEND_HOST=${BACKEND_HOST}
ENV BACKEND_INTERNAL_PORT=${BACKEND_INTERNAL_PORT}

# Remove default Nginx config and install parameterized template
RUN rm -rf /etc/nginx/conf.d/*
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Built-in container healthcheck probe reading runtime FRONTEND_INTERNAL_PORT
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD sh -c 'test -n "${FRONTEND_INTERNAL_PORT}" && wget --quiet --tries=1 --spider "http://127.0.0.1:${FRONTEND_INTERNAL_PORT}/healthz" || exit 1'

# Validate required runtime ENV, substitute Nginx template, run nginx -t, then start Nginx
CMD ["/bin/sh", "-c", "test -n \"${FRONTEND_INTERNAL_PORT}\" && test -n \"${BACKEND_HOST}\" && test -n \"${BACKEND_INTERNAL_PORT}\" && envsubst '${FRONTEND_INTERNAL_PORT} ${BACKEND_HOST} ${BACKEND_INTERNAL_PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -t && exec nginx -g 'daemon off;'"]
