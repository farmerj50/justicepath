# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# App source
COPY . .

# Optional override via build arg; otherwise use the committed .env.production
# (This avoids broken builds when CI forgets to pass VITE_API_URL.)
ARG VITE_API_URL
RUN if [ -n "$VITE_API_URL" ]; then \
      printf "VITE_API_URL=%s\n" "$VITE_API_URL" > .env.production; \
    fi && \
    echo "Effective .env.production:" && cat .env.production

# Build the SPA (Vite reads .env.production automatically in production mode)
RUN npm run build


# --- Runtime stage ---
FROM node:20-alpine
WORKDIR /app

# Static server
RUN npm i -g serve

# Copy build artifacts
COPY --from=build /app/dist ./dist

# Cloud Run listens on $PORT; bind to 0.0.0.0
ENV PORT=8080
CMD ["sh","-c","serve -s dist -l tcp://0.0.0.0:${PORT:-8080}"]
