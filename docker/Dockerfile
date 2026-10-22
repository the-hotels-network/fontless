FROM node:26.12.1-alpine as builder

ARG CIRCLE_BRANCH
ARG CIRCLE_TAG

ENV CIRCLE_BRANCH=$CIRCLE_BRANCH
ENV CIRCLE_TAG=$CIRCLE_TAG

COPY . /src

WORKDIR /src

RUN npm install

RUN cd setup && npm run build && npm run do-setup

FROM node:26.12.1-alpine

WORKDIR /app

COPY --from=builder /src/setup/deployment.zip ./

RUN unzip deployment.zip -o && npm install && npm run build

