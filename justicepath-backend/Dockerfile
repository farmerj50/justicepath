# syntax=docker/dockerfile:1

# Use Debian-slim to avoid Prisma/Alpine binary issues
FROM node:20-bullseye-slim AS deps
WORKDIR /app
# Install openssl (needed by Prisma engines)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --include=dev

FROM node:20-bullseye-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client + build TS
RUN npx prisma generate && npm run build

FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Runtime deps only (includes @prisma/client)
COPY package*.json ./
RUN npm ci --omit=dev
# Bring compiled app and Prisma engines
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

# Cloud Run will set PORT; make sure your server uses it and binds 0.0.0.0
ENV PORT=8080
CMD ["node","dist/server.js"]
