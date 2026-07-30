# Stage 1: Build stage
FROM node:18 AS builder
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY server.js ./

# Stage 2: Production stage
FROM node:18-alpine
WORKDIR /usr/src/app
RUN apk upgrade --no-cache && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npxRUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /usr/src/app/server.js ./

USER appuser

EXPOSE 5000
CMD ["node", "server.js"]