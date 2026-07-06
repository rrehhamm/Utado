# Build context must be the repo root, e.g.:
#   docker build -f packages/frontend/Dockerfile -t utado-frontend \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.example.com/api/v1 .
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/frontend/package.json packages/frontend/package.json
# --ignore-scripts: the root postinstall builds packages/shared, whose source
# isn't copied in yet at this point (kept as its own layer for dependency caching)
RUN npm ci --ignore-scripts

COPY packages/shared packages/shared
COPY packages/frontend packages/frontend

RUN npm run build --workspace packages/shared

# Next.js inlines NEXT_PUBLIC_* variables into the client bundle at build time,
# not at container start - it must be supplied as a build arg, not just a
# runtime environment variable in docker-compose.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build --workspace packages/frontend

WORKDIR /app/packages/frontend
EXPOSE 3000
CMD ["npm", "run", "start"]
