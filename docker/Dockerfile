FROM node:16-alpine3.16 as builder

ARG CIRCLE_BRANCH
ARG CIRCLE_TAG

ENV CIRCLE_BRANCH=$CIRCLE_BRANCH
ENV CIRCLE_TAG=$CIRCLE_TAG

COPY . /src

WORKDIR /src

RUN npm install

RUN cd setup && npm run build && npm run do-setup

FROM node:16-alpine3.16

WORKDIR /app

COPY --from=builder /src/setup/deployment.zip ./

RUN unzip deployment.zip -o && npm install && npm run build

