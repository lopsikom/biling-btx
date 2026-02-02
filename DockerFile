FROM node:lts-alpine3.22
WORKDIR /app

COPY . .

RUN npm ci

EXPOSE 3000

CMD ["npm", "run", "dev"]