# Build stage: image
FROM node:18-alpine AS builder
# Build stage: workdir
WORKDIR /app
# Build stage: build arg
ARG NEXT_PUBLIC_BASE_URL
# Build stage: export arg
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
# Build stage: copy manifests
COPY package*.json ./
# Build stage: install deps
RUN npm install
# Build stage: copy sources
COPY . .
# Build stage: build app
# RUN npm run build

# # Runtime stage: image
# FROM node:18-alpine AS runner
# # Runtime stage: workdir
# WORKDIR /app
# # Runtime stage: env mode
# ENV NODE_ENV=production
# # Runtime stage: copy build
# COPY --from=builder /app/.next ./.next
# # Runtime stage: copy public
# COPY --from=builder /app/public ./public
# # Runtime stage: copy manifests
# COPY --from=builder /app/package*.json ./
# # Runtime stage: install prod deps
# RUN npm install --omit=dev
# Runtime stage: expose port
# EXPOSE 3000
# Runtime stage: start server
CMD ["npm", "run", "dev"]
