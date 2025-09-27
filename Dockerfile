# --- build ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Accept API URL; default to /api so LB routing works
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# Bake it for Vite and prove it in logs
RUN printf "VITE_API_URL=%s\n" "$VITE_API_URL" > .env.production
RUN echo ">>> BUILD: VITE_API_URL=$VITE_API_URL"
RUN npm run build

# --- runtime ---
FROM node:20-alpine
WORKDIR /app
RUN npm i -g serve
COPY --from=build /app/dist ./dist
ENV PORT=8080
CMD ["sh","-c","serve -s dist -l tcp://0.0.0.0:${PORT:-8080}"]
