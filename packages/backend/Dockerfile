# Build context must be the repo root (this is a workspace package that
# depends on @utado/shared), e.g.:
#   docker build -f packages/backend/Dockerfile -t utado-backend .
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/backend/package.json packages/backend/package.json
# --ignore-scripts: the root postinstall builds packages/shared, whose source
# isn't copied in yet at this point (kept as its own layer for dependency caching)
RUN npm ci --ignore-scripts

COPY packages/shared packages/shared
COPY packages/backend packages/backend

RUN npm run build --workspace packages/shared
RUN npm run build --workspace packages/backend

WORKDIR /app/packages/backend
EXPOSE 4000

# Migrations are idempotent (tracked in schema_migrations), so running them
# on every container start is safe and keeps deploys to a single command.
CMD ["sh", "-c", "npm run migrate && node dist/server.js"]
