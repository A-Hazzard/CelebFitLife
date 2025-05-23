FROM node:20

WORKDIR /app/celebfitlife

COPY package*.json ./

RUN npm install -g pnpm 

RUN pnpm install

COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]