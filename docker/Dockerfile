FROM node:22.23.4-alpine AS builder

ARG CIRCLE_BRANCH
ARG CIRCLE_TAG

ENV CIRCLE_BRANCH=$CIRCLE_BRANCH
ENV CIRCLE_TAG=$CIRCLE_TAG

COPY . /src

WORKDIR /src

RUN npm install

RUN cd setup && npm run build:setup && npm run do-setup

FROM node:22.23.4-alpine

WORKDIR /app

COPY --from=builder /src/setup/deployment.zip ./

# Next 9 / webpack 4 needs the legacy OpenSSL provider (MD4) on Node 17+
RUN unzip -o deployment.zip && npm install && NODE_OPTIONS=--openssl-legacy-provider npm run build
