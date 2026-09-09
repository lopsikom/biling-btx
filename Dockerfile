FROM node:lts-alpine3.22 AS base
WORKDIR /app

COPY . .

ARG PORT=3000
ARG NUXT_DATABASE_URL
ARG NUXT_AUTH_URI
ARG NUXT_PUBLIC_BASE_URL
ARG NUXT_PUBLIC_BASE_URI
ARG NUXT_REDIS_URL
ARG NUXT_REDIS_PORT=6379

ENV PORT=$PORT
ENV NUXT_REDIS_URL=$NUXT_REDIS_URL
ENV NUXT_REDIS_PORT=$NUXT_REDIS_PORT
ENV NUXT_DATABASE_URL=$NUXT_DATABASE_URL
ENV NUXT_AUTH_URI=$NUXT_AUTH_URI
ENV NUXT_PUBLIC_BASE_URL=$NUXT_PUBLIC_BASE_URL
ENV NUXT_PUBLIC_BASE_URI=$NUXT_PUBLIC_BASE_URI


RUN npm ci

RUN npx prisma generate

EXPOSE 3000

FROM base as dev
ENV NUXT_PUBLIC_DEV=true
RUN npm install --include=dev
CMD ["npm", "run", "dev"]

FROM base as prod
# NODE_ENV задаётся явно: без него process.env.NODE_ENV === undefined
# (nitro node-server его не выставляет), и любая проверка вида
# NODE_ENV !== 'production' срабатывала бы в проде. От этого флага зависит,
# редактируются ли секреты в журнале ошибок (см. server/utils/errorJournal.ts).
ENV NODE_ENV=production
ENV NUXT_PUBLIC_DEV=false
RUN npm run build
CMD ["node", ".output/server/index.mjs"]
