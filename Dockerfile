# A multi-stage Docker build.
# Using a base image to compile the application
# and an NGINX-Alpine image for the run-time image.

# Build stage

FROM node:14 AS builder

WORKDIR /app
COPY package.json ./
COPY pnpm-lock.yaml ./

RUN npm i -g pnpm@6.24.0 && \
    pnpm i

COPY . .

RUN pnpm build

# Run stage

FROM nginx:1.19.0

WORKDIR /usr/share/nginx/html/
COPY --from=builder /app/build .
