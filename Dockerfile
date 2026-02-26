# Builder stage
FROM node:20.16-alpine3.19 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY database/ ./database/
COPY routes/ ./routes/
COPY app.js build.js featureFlags.js swagger.json ./
RUN npm run build

# Runtime stage
FROM node:20.16-alpine3.19 AS runtime
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
WORKDIR /app
COPY --from=builder /app/dist ./dist
USER nodejs
EXPOSE 3000
CMD ["node", "dist/app.js"]
