FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate
COPY . .
RUN npx tsc

FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci --omit=dev
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/dist ./dist

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]