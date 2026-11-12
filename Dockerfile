FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY . .
RUN node scripts/setup-model.js

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV PUBLIC_ORIGIN=auto

EXPOSE 3000

CMD ["node", "server/index.js"]
