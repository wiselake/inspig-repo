# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for Next.js (NEXT_PUBLIC_* must be set at build time)
ARG NEXT_PUBLIC_API_URL=https://ins.pigplan.io
ARG NEXT_PUBLIC_USE_MOCK=false

# Set environment variables for build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_USE_MOCK=$NEXT_PUBLIC_USE_MOCK

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
