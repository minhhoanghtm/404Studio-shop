# ==============================================================================
# REACT-WebFashion — Backend Production Multi-Stage Dockerfile
# Stage 1: Dependency resolution & pruning
# Stage 2: Hardened, non-root Node.js runtime with dumb-init
# ==============================================================================

# ---------- Stage 1: Dependencies ----------
FROM node:22-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---------- Stage 2: Production Runtime ----------
FROM node:22-alpine AS runner
WORKDIR /app

# Install dumb-init for proper PID 1 signal propagation and zombie reaping
RUN apk add --no-cache dumb-init curl

ARG BACKEND_INTERNAL_PORT
ENV NODE_ENV=production
ENV BACKEND_INTERNAL_PORT=${BACKEND_INTERNAL_PORT}
ENV BACKEND_PORT=${BACKEND_INTERNAL_PORT}
ENV PORT=${BACKEND_INTERNAL_PORT}

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Copy application code
COPY . .

# Ensure uploads directory exists and is owned by non-root node user
RUN mkdir -p /app/uploads && chown -R node:node /app

# Use non-root node user provided by alpine node image
USER node

# Built-in healthcheck probe reading port strictly from runtime ENV
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "const p=process.env.BACKEND_PORT||process.env.PORT||process.env.BACKEND_INTERNAL_PORT; if(!p) process.exit(1); fetch('http://127.0.0.1:'+p+'/api/health/liveness').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# dumb-init forwards SIGTERM/SIGINT directly to node process for graceful shutdown
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/server.js"]
