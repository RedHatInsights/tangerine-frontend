FROM registry.access.redhat.com/hi/nodejs:22.23.2-1790001698 AS builder

USER root

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json .
RUN npm ci

COPY . .
RUN npm run build

FROM registry.access.redhat.com/hi/nodejs:22.23.2-1790001698

WORKDIR /app
COPY package.json ./
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/build build

EXPOSE 3000

CMD ["node", "./node_modules/.bin/serve", "--no-clipboard", "--single", "./build"]
