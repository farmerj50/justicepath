# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Accept API URL at build time and expose to Vite
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Fail fast if not provided
RUN test -n "$VITE_API_URL"

# Write .env.production so Vite picks it up during build
RUN printf "VITE_API_URL=%s\n" "$VITE_API_URL" > .env.production

# Build the SPA
RUN npm run build

# --- Runtime stage ---
FROM node:20-alpine
WORKDIR /app

RUN npm i -g serve
COPY --from=build /app/dist ./dist

ENV PORT=8080
# IMPORTANT: bind 0.0.0.0 for Cloud Run
CMD sh -c 'serve -s dist -l tcp://0.0.0.0:${PORT:-8080}'
