FROM node:20-alpine

WORKDIR /app

# Copiar tudo
COPY . .

# Instalar TODAS as dependências do frontend (incluindo devDependencies para build)
RUN npm install --include=dev

# Build do frontend
RUN npm run build

# Instalar dependências do backend
RUN cd server && npm install --production

# Limpar devDependencies do frontend após build
RUN rm -rf node_modules

# O backend serve o frontend em produção
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

WORKDIR /app/server

CMD ["node", "index.js"]
