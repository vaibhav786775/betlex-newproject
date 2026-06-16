FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV DATABASE_URL="postgresql://postgres:postgres@postgres:5432/beetlex_db?schema=public"

RUN npx prisma generate

RUN npm run build

EXPOSE 3000

CMD ["sh", "docker-entrypoint.sh"]