FROM node:20

# Installe Docker CLI
RUN apt-get update && apt-get install -y docker.io docker-compose \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "bot.js"]

