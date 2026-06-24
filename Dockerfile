FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY . .
RUN npm ci
RUN npx prisma generate

CMD ["sh", "-c", "npx prisma migrate deploy && npx ts-node src/index.ts"]