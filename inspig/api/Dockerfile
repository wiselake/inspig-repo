FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
# Note: build requires devDependencies, so we install all first
RUN npm ci

# Copy source code
COPY . .

# Build NestJS app
RUN npm run build

# Prune devDependencies for production
RUN npm prune --production

EXPOSE 3001

CMD ["node", "dist/main"]
