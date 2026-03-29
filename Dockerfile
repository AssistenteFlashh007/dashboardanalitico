FROM node:20-alpine

WORKDIR /app

# Instalar dependências do frontend
COPY package.json package-lock.json* ./
RUN npm install

# Instalar dependências do backend
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install

# Copiar código
COPY . .

# Build do frontend
RUN npm run build

# O backend serve o frontend em produção
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server/index.js"]
