cd ~/app/justicepath-main

# create Dockerfile if it doesn't exist
test -f Dockerfile || cat > Dockerfile <<'EOF'
# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Runtime (static) ---
FROM node:20-alpine
WORKDIR /app
RUN npm i -g serve
COPY --from=build /app/dist ./dist
ENV PORT=8080
CMD ["serve","-s","dist","-l","8080"]
EOF
