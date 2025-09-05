# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# pass at build: --build-arg VITE_API_URL=...
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Runtime stage ---
FROM node:20-alpine
WORKDIR /app
RUN npm i -g serve
COPY --from=build /app/dist ./dist
ENV PORT=8080
# Respect Cloud Run's PORT (and bind all interfaces)
CMD sh -c 'serve -s dist -l ${PORT:-8080}'
