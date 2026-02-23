# Builder stage
FROM node:20.16-alpine3.19 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build

# Runtime stage
FROM node:20.16-alpine3.19 AS runtime
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
USER nodejs
EXPOSE 3000
CMD ["npm", "dist/app.js"]   
