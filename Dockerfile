# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# Core deps first for better layer reuse
COPY package*.json ./
RUN npm ci

# App source
COPY . .

# Bake API base: default to /api (works with the LB path rule)
# CI can override with --build-arg VITE_API_URL="https://<cloud-run-backend-url>"
ARG VITE_API_URL=/api
RUN printf "VITE_API_URL=%s\n" "$VITE_API_URL" > .env.production \
 && echo "Effective .env.production:" && cat .env.production

# If you keep the file as server.json, expose it as serve.json for the "serve" binary.
# (Safe no-op if neither exists.)
RUN [ -f server.json ] && cp server.json serve.json || true

# Build the SPA (Vite reads .env.production in prod builds)
RUN npm run build

# --- Runtime stage ---
FROM node:20-alpine
WORKDIR /app

# Tiny static server
RUN npm i -g serve

# Ship built assets and caching headers file
COPY --from=build /app/dist ./dist
COPY --from=build /app/serve.json ./serve.json

# Cloud Run port
ENV PORT=8080
CMD ["sh","-c","serve -s dist -l tcp://0.0.0.0:${PORT:-8080}"]
