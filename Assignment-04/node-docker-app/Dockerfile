# Stage 1: Build stage
FROM node:18 AS builder
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY server.js ./

# Stage 2: Production stage
FROM node:18-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/server.js ./
EXPOSE 3000
CMD ["node", "server.js"]
