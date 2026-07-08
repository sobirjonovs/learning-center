FROM node:22-alpine
WORKDIR /app

# prisma generate uchun schema va DATABASE_URL build vaqtida kerak
ENV DATABASE_URL="file:/data/learning-center.db"

COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
