# A multi-stage Docker build.
# Using a base image to compile the application
# and an NGINX-Alpine image for the run-time image.

# Build stage

FROM node:14 AS builder

# RUN npm install -g yarn
RUN yarn global add lerna

RUN git clone https://github.com/InformaticsMatters/react-sci-components.git react-sci-components

WORKDIR /react-sci-components
RUN git checkout refactor-out-pose-viewer
RUN lerna bootstrap

WORKDIR /react-sci-components/packages/theme
RUN yarn link

WORKDIR /react-sci-components/packages/services
RUN yarn link

WORKDIR /react-sci-components/packages/components
RUN yarn link

WORKDIR /app
COPY package.json ./
COPY yarn.lock ./

RUN yarn install \
    --only=production \
    --non-interactive \
    --unsafe-perm

RUN yarn link @squonk/react-sci-components
RUN yarn link @squonk/mui-theme
RUN yarn link @squonk/data-tier-services

COPY . .

RUN yarn build

# Run stage

FROM nginx:1.19.0

WORKDIR /usr/share/nginx/html/
COPY --from=builder /build .
