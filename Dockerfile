FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code and .env file
COPY . .
COPY .env .

# Build the application
RUN npm run build

# Remove development dependencies
RUN npm prune --production


# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3050

# Expose the port the app runs on
EXPOSE 3050

# Start the application
CMD ["node", "dist/main"]