# apps/backend/Dockerfile
FROM node:18-alpine

# Set working directory at repo root
WORKDIR /app

# Copy root and workspace manifests for faster, deterministic installs
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
COPY packages/types/package.json packages/types/

# Install all workspaces (dev deps included to build TypeScript)
RUN npm ci

# Copy the rest of the repo
COPY . .

# Build backend
WORKDIR /app/apps/backend
RUN npm run build

# Runtime configuration
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]