FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV AI_SERVICE_PORT=8081

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 8081

HEALTHCHECK --interval=20s --timeout=5s --retries=3 --start-period=10s \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:8081/health/liveness || exit 1

CMD ["node", "dist/index.js"]
