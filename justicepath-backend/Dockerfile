# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json prisma/schema.prisma ./
RUN npm ci --include=dev

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client & build TS
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# App code
COPY --from=build /app/dist ./dist
COPY package*.json ./
# Runtime deps only (includes @prisma/client)
RUN npm ci --omit=dev
# Ensure generated Prisma client binaries are present
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

ENV PORT=8080
CMD ["node", "dist/server.js"]
