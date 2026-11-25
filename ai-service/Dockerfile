FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ARG AI_SERVICE_INTERNAL_PORT
ENV NODE_ENV=production
ENV AI_SERVICE_INTERNAL_PORT=${AI_SERVICE_INTERNAL_PORT}
ENV AI_SERVICE_PORT=${AI_SERVICE_INTERNAL_PORT}

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

HEALTHCHECK --interval=20s --timeout=5s --retries=3 --start-period=10s \
  CMD node -e "const p=process.env.AI_SERVICE_PORT||process.env.PORT||process.env.AI_SERVICE_INTERNAL_PORT; if(!p) process.exit(1); fetch('http://127.0.0.1:'+p+'/health/liveness').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
