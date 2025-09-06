# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# ⬇️ receive the API URL from CI and expose it to Vite at build time
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
# (extra-safe) also write .env.production so Vite/dotenv can load it
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env.production

# build the SPA
RUN npm run build

# --- Runtime stage ---
FROM node:20-alpine
WORKDIR /app

RUN npm i -g serve
COPY --from=build /app/dist ./dist

ENV PORT=8080
# bind to Cloud Run's PORT
CMD sh -c 'serve -s dist -l ${PORT:-8080}'
